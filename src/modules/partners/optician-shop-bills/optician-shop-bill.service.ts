import { db } from '@/lib/database/db'
import { BillStatus, ChequeType, PaymentMethod, Prisma } from '@prisma/client'
import { NotFoundError, BadRequestError } from '@/lib/errors'
import { assertWithinTotal, effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'
import { auditService } from '@/modules/system/audit'

const BILL_INCLUDE = {
    opticianShop: { select: { id: true, name: true } },
    items: { include: { lensBlank: { select: { id: true, brand: true, thickness: true } } } },
    payments: {
        orderBy: { paidAt: 'desc' as const },
        include: { cheque: { select: { status: true, type: true, number: true, bankName: true, dueDate: true } } },
    },
    groupedInto: { select: { invoiceNumber: true } },
} as const

export async function listOpticianShopBills(params?: { opticianShopId?: string; status?: string; search?: string }) {
    const where: Prisma.OpticianShopBillWhereInput = {}
    if (params?.opticianShopId) where.opticianShopId = params.opticianShopId
    if (params?.status) where.status = params.status as BillStatus
    if (params?.search) {
        where.opticianShop = { name: { contains: params.search } }
    }
    // Phase 3: bills already grouped into a consolidated invoice leave the
    // payable list — the consolidated invoice carries the outstanding instead.
    where.groupedIntoId = null

    return db.opticianShopBill.findMany({
        where,
        include: BILL_INCLUDE,
        orderBy: { createdAt: 'desc' },
    })
}

export interface OpticianShopBillShopSummary {
    shopId: string
    shopName: string
    invoiceCount: number
    totalOutstanding: number
}

// Grouped bills are excluded from the standalone aggregation — their
// outstanding lives on the consolidated invoice, which is aggregated per shop
// below so each shop card reflects the shop's full debt.
export async function getOpticianShopBillsSummary(): Promise<OpticianShopBillShopSummary[]> {
    const [bills, consolidated] = await Promise.all([
        db.opticianShopBill.findMany({
            where: { groupedIntoId: null },
            select: {
                totalAmount: true,
                opticianShop: { select: { id: true, name: true } },
                payments: { include: { cheque: { select: { status: true, type: true } } } },
            },
        }),
        db.consolidatedInvoice.findMany({
            select: {
                totalAmount: true,
                opticianShop: { select: { id: true, name: true } },
                payments: { include: { cheque: { select: { status: true, type: true } } } },
            },
        }),
    ])

    const perShop = new Map<string, OpticianShopBillShopSummary>()
    const entryFor = (shop: { id: string; name: string }) =>
        perShop.get(shop.id) || {
            shopId: shop.id,
            shopName: shop.name,
            invoiceCount: 0,
            totalOutstanding: 0,
        }

    for (const bill of bills) {
        const outstanding = Math.max(
            0,
            Number(bill.totalAmount) - effectivePaymentTotal(
                bill.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
                'client'
            )
        )
        const entry = entryFor(bill.opticianShop)
        entry.invoiceCount += 1
        entry.totalOutstanding += outstanding
        perShop.set(bill.opticianShop.id, entry)
    }

    for (const invoice of consolidated) {
        const outstanding = Math.max(
            0,
            Number(invoice.totalAmount) - effectivePaymentTotal(
                invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
                'client'
            )
        )
        const entry = entryFor(invoice.opticianShop)
        entry.totalOutstanding += outstanding
        perShop.set(invoice.opticianShop.id, entry)
    }

    return [...perShop.values()].sort((a, b) => b.totalOutstanding - a.totalOutstanding)
}

export async function getOpticianShopBill(id: string) {
    const bill = await db.opticianShopBill.findUnique({
        where: { id },
        include: BILL_INCLUDE,
    })
    if (!bill) throw new NotFoundError('Bill not found')
    return bill
}

// Single writer for the bill's stored paid state: derives paidAmount/status
// from the effective (cleared-instrument) payments, clamped to the total, and
// mirrors the same figures on the linked work order.
export async function syncBillPaidState(billId: string) {
    const bill = await db.opticianShopBill.findUnique({
        where: { id: billId },
        select: {
            totalAmount: true,
            workOrderId: true,
            payments: { include: { cheque: { select: { status: true, type: true } } } },
        },
    })
    if (!bill) return
    const effective = effectivePaymentTotal(
        bill.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'client'
    )
    const paidAmount = Math.min(effective, Number(bill.totalAmount))
    const status: BillStatus = paidAmount >= Number(bill.totalAmount) ? 'paid' : paidAmount > 0 ? 'partiallyPaid' : 'unpaid'
    await db.opticianShopBill.update({ where: { id: billId }, data: { paidAmount, status } })

    if (bill.workOrderId) {
        const paymentStatus = paidAmount >= Number(bill.totalAmount) ? 'paid' : paidAmount > 0 ? 'partial' : 'pending'
        await db.atelierWorkOrder.update({
            where: { id: bill.workOrderId },
            data: { amountPaid: paidAmount, paymentStatus },
        })
    }
}

export async function recordBillPayment(id: string, data: {
    amount: number
    method: string
    chequeId?: string
    chequeNumber?: string
    chequeBankName?: string
    chequeDueDate?: string
    chequeType?: string
    notes?: string
}) {
    const bill = await db.opticianShopBill.findUnique({ where: { id }, include: BILL_INCLUDE })
    if (!bill) throw new NotFoundError('Bill not found')
    if (bill.groupedIntoId) {
        throw new BadRequestError(`Bill is already grouped into consolidated invoice ${bill.groupedInto?.invoiceNumber ?? bill.groupedIntoId}`)
    }
    if (data.amount <= 0) throw new BadRequestError('Payment amount must be positive')

    const isInstrument = data.method === 'cheque' || data.method === 'traite'

    const paymentInputs = bill.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque }))
    // Overpay guard on effective paid + pending instruments + the new amount
    assertWithinTotal({
        totalAmount: bill.totalAmount,
        effectivePaid: effectivePaymentTotal(paymentInputs, 'client'),
        pendingTotal: pendingInstrumentTotal(paymentInputs, 'client'),
        newAmount: data.amount,
    })

    const storedMethod: PaymentMethod = isInstrument ? 'cheque' : (data.method as PaymentMethod)

    await db.$transaction(async (tx) => {
        // Inline instrument creation for cheque/traite (mirrors the supplier side)
        let instrumentId: string | null = null
        if (isInstrument) {
            const cheque = await tx.cheque.create({
                data: {
                    number: data.chequeNumber || '',
                    type: (data.method === 'traite' ? 'traite' : data.chequeType || 'standard') as ChequeType,
                    bankName: data.chequeBankName || null,
                    amount: data.amount,
                    dueDate: new Date(data.chequeDueDate || Date.now()),
                    entityType: 'client_payment',
                },
            })
            instrumentId = cheque.id
        }

        await tx.opticianShopPayment.create({
            data: {
                billId: id,
                amount: data.amount,
                method: storedMethod,
                chequeId: instrumentId,
                notes: data.notes || null,
            },
        })
    })

    await syncBillPaidState(id)

    const result = await db.opticianShopBill.findUnique({ where: { id }, include: BILL_INCLUDE })
    if (!result) throw new NotFoundError('Bill not found')

    await auditService.log({
        action: 'BILL_PAYMENT_RECORDED',
        entityType: 'OPTICIAN_SHOP_BILL',
        entityId: id,
        metadata: {
            amount: data.amount,
            method: data.method,
            storedMethod,
            instrument: isInstrument,
            effectivePaid: Number(result.paidAmount),
            status: result.status,
        },
    })

    return result
}
