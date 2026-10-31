import { db } from '@/lib/database/db'
import { BillStatus, ChequeType, PaymentMethod, Prisma } from '@prisma/client'
import { NotFoundError, BadRequestError } from '@/lib/errors'
import { assertWithinTotal, effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'
import { auditService } from '@/modules/system/audit'
import { syncBillPaidState } from '@/modules/partners/optician-shop-bills/optician-shop-bill.service'

const CONSOLIDATED_INCLUDE = {
    opticianShop: { select: { id: true, name: true } },
    items: { orderBy: { sourceBillNumber: 'asc' as const } },
    payments: {
        orderBy: { paidAt: 'desc' as const },
        include: { cheque: { select: { status: true, type: true, number: true, bankName: true, dueDate: true } } },
    },
} as const

function round3(n: number): number {
    return Math.round(n * 1000) / 1000
}

function shopAbbreviation(name: string): string {
    return (
        name
            .split(' ')
            .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase())
            .filter(Boolean)
            .join('')
            .slice(0, 4) || 'SUP'
    )
}

function billEffectiveRemaining(bill: {
    totalAmount: Prisma.Decimal | string | number
    payments: { amount: Prisma.Decimal | string | number; method: string; cheque: { status: string } | null }[]
}): number {
    const effective = effectivePaymentTotal(
        bill.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'client'
    )
    return round3(Math.max(0, Number(bill.totalAmount) - effective))
}

// Split a consolidated payment across the source bills, pro-rata on each
// item's outstanding (the amount the bill contributed to the invoice total
// at group time). Every share is floored to 3 decimals and the last item
// absorbs the rounding remainder, so the shares always sum exactly to
// `amount`; since each share is proportional to a part of that amount, a
// partial consolidated payment can never overpay an individual bill.
export function allocateConsolidatedPayment(amount: number, itemAmounts: number[]): number[] {
    const shares = itemAmounts.map(() => 0)
    const count = itemAmounts.length
    if (count === 0 || amount <= 0) return shares
    const total = round3(itemAmounts.reduce((sum, a) => sum + a, 0))
    if (total <= 0) return shares
    for (let i = 0; i < count - 1; i++) {
        shares[i] = Math.floor((amount * itemAmounts[i]) / total * 1000) / 1000
    }
    const assigned = round3(shares.slice(0, -1).reduce((sum, a) => sum + a, 0))
    shares[count - 1] = round3(amount - assigned)
    return shares
}

export async function groupOpticianShopBills(data: { opticianShopId: string; billIds: string[] }) {
    const uniqueIds = [...new Set(data.billIds)]
    if (uniqueIds.length < 2) throw new BadRequestError('At least 2 bills are required')

    const created = await db.$transaction(async (tx) => {
        const bills = await tx.opticianShopBill.findMany({
            where: { id: { in: uniqueIds } },
            include: {
                payments: { include: { cheque: { select: { status: true } } } },
                opticianShop: { select: { id: true, name: true } },
            },
        })
        if (bills.length !== uniqueIds.length) throw new NotFoundError('One or more bills not found')

        for (const bill of bills) {
            if (bill.opticianShopId !== data.opticianShopId) {
                throw new BadRequestError('All bills must belong to the same optician shop')
            }
            if (bill.groupedIntoId) {
                throw new BadRequestError(`Bill ${bill.billNumber} is already grouped into a consolidated invoice`)
            }
            if (bill.status === 'paid' || billEffectiveRemaining(bill) <= 0) {
                throw new BadRequestError(`Bill ${bill.billNumber} is already fully paid`)
            }
        }

        const amounts = bills.map((bill) => ({ billId: bill.id, billNumber: bill.billNumber, amount: billEffectiveRemaining(bill) }))
        const totalAmount = round3(amounts.reduce((sum, a) => sum + a.amount, 0))
        if (totalAmount <= 0) throw new BadRequestError('Total remaining must be positive')

        const shop = bills[0].opticianShop
        const prefix = `FAC-G-${shopAbbreviation(shop.name)}-`
        // invoiceNumber is globally unique — scan ALL invoices so two shops
        // sharing an abbreviation can never generate the same number
        const existing = await tx.consolidatedInvoice.findMany({
            select: { invoiceNumber: true },
        })
        let maxSeq = 0
        for (const inv of existing) {
            if (inv.invoiceNumber.startsWith(prefix)) {
                const num = parseInt(inv.invoiceNumber.slice(prefix.length), 10)
                if (!isNaN(num) && num > maxSeq) maxSeq = num
            }
        }
        const invoiceNumber = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`

        const invoice = await tx.consolidatedInvoice.create({
            data: {
                invoiceNumber,
                opticianShopId: data.opticianShopId,
                totalAmount,
                paidAmount: 0,
                status: 'unpaid',
                items: {
                    create: amounts.map((a) => ({
                        sourceBillId: a.billId,
                        sourceBillNumber: a.billNumber,
                        amount: a.amount,
                    })),
                },
            },
        })

        await tx.opticianShopBill.updateMany({
            where: { id: { in: uniqueIds } },
            data: { groupedIntoId: invoice.id },
        })

        return { invoice, amounts, totalAmount }
    }, { timeout: 15000 })

    await auditService.log({
        action: 'INVOICE_GROUPED',
        entityType: 'CONSOLIDATED_INVOICE',
        entityId: created.invoice.id,
        metadata: {
            invoiceNumber: created.invoice.invoiceNumber,
            opticianShopId: data.opticianShopId,
            billIds: uniqueIds,
            amounts: created.amounts.map((a) => ({ sourceBillId: a.billId, sourceBillNumber: a.billNumber, amount: a.amount })),
            totalAmount: created.totalAmount,
        },
    })

    return db.consolidatedInvoice.findUnique({ where: { id: created.invoice.id }, include: CONSOLIDATED_INCLUDE })
}

export async function listConsolidatedInvoices(params?: { opticianShopId?: string; status?: string; search?: string }) {
    const where: Prisma.ConsolidatedInvoiceWhereInput = {}
    if (params?.opticianShopId) where.opticianShopId = params.opticianShopId
    if (params?.status) where.status = params.status as BillStatus
    if (params?.search) {
        where.opticianShop = { name: { contains: params.search } }
    }

    return db.consolidatedInvoice.findMany({
        where,
        include: CONSOLIDATED_INCLUDE,
        orderBy: { createdAt: 'desc' },
    })
}

export async function getConsolidatedInvoice(id: string) {
    const invoice = await db.consolidatedInvoice.findUnique({
        where: { id },
        include: CONSOLIDATED_INCLUDE,
    })
    if (!invoice) throw new NotFoundError('Consolidated invoice not found')
    return invoice
}

export async function recordConsolidatedPayment(id: string, data: {
    amount: number
    method: string
    chequeId?: string
    chequeNumber?: string
    chequeBankName?: string
    chequeDueDate?: string
    chequeType?: string
    notes?: string
}) {
    const invoice = await db.consolidatedInvoice.findUnique({ where: { id }, include: CONSOLIDATED_INCLUDE })
    if (!invoice) throw new NotFoundError('Consolidated invoice not found')
    if (data.amount <= 0) throw new BadRequestError('Payment amount must be positive')

    const isInstrument = data.method === 'cheque' || data.method === 'traite'

    const paymentInputs = invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque }))
    // Overpay guard on effective paid + pending instruments + the new amount
    assertWithinTotal({
        totalAmount: invoice.totalAmount,
        effectivePaid: effectivePaymentTotal(paymentInputs, 'client'),
        pendingTotal: pendingInstrumentTotal(paymentInputs, 'client'),
        newAmount: data.amount,
    })

    const storedMethod: PaymentMethod = isInstrument ? 'cheque' : (data.method as PaymentMethod)

    const txMeta: { mirroredBillIds: string[] } = { mirroredBillIds: [] }

    await db.$transaction(async (tx) => {
        // Inline instrument creation for cheque/traite (mirrors the bill side)
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

        await tx.consolidatedPayment.create({
            data: {
                consolidatedInvoiceId: id,
                amount: data.amount,
                method: storedMethod,
                chequeId: instrumentId,
                notes: data.notes || null,
            },
        })

        // Mirror the payment onto the source bills: syncBillPaidState derives
        // a bill's stored paid state (and its work order) from the bill's own
        // payments, so each bill needs its share of the consolidated payment
        // as an OpticianShopPayment row. Instruments share the same cheque
        // record, so cheque status changes keep both sides in sync.
        const shares = allocateConsolidatedPayment(data.amount, invoice.items.map((item) => Number(item.amount)))
        const mirroredBillIds: string[] = []
        for (let i = 0; i < invoice.items.length; i++) {
            if (shares[i] <= 0) continue
            await tx.opticianShopPayment.create({
                data: {
                    billId: invoice.items[i].sourceBillId,
                    amount: shares[i],
                    method: storedMethod,
                    chequeId: instrumentId,
                    notes: data.notes || null,
                },
            })
            mirroredBillIds.push(invoice.items[i].sourceBillId)
        }
        txMeta.mirroredBillIds = mirroredBillIds
    })

    const updated = await db.consolidatedInvoice.findUnique({ where: { id }, include: CONSOLIDATED_INCLUDE })
    if (!updated) throw new NotFoundError('Consolidated invoice not found')
    const effective = effectivePaymentTotal(
        updated.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'client'
    )
    const paidAmount = Math.min(effective, Number(updated.totalAmount))
    const status: BillStatus = paidAmount >= Number(updated.totalAmount) ? 'paid' : paidAmount > 0 ? 'partiallyPaid' : 'unpaid'

    const result = await db.consolidatedInvoice.update({
        where: { id },
        data: { paidAmount, status },
        include: CONSOLIDATED_INCLUDE,
    })

    // Re-derive each source bill's stored paid state (and its linked work
    // order) from its payments — which now include the mirrored share of the
    // consolidated payment. Full invoice payment ⇒ each bill exactly reaches
    // its total; a partial payment leaves sane partial states, never
    // over/under-payments, because shares are pro-rata on the grouped remainders.
    for (const item of invoice.items) {
        await syncBillPaidState(item.sourceBillId)
    }

    await auditService.log({
        action: 'CONSOLIDATED_PAYMENT_RECORDED',
        entityType: 'CONSOLIDATED_INVOICE',
        entityId: id,
        metadata: {
            amount: data.amount,
            method: data.method,
            storedMethod,
            instrument: isInstrument,
            effectivePaid: paidAmount,
            status,
            mirroredBillIds: txMeta.mirroredBillIds,
        },
    })

    return result
}
