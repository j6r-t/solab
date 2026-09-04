import { db } from '@/lib/database/db'
import { BillStatus, PaymentMethod, Prisma } from '@prisma/client'
import { NotFoundError, BadRequestError } from '@/lib/errors'
import { effectivePaymentTotal } from '@/lib/utils/payments'

const BILL_INCLUDE = {
    opticianShop: { select: { id: true, name: true } },
    items: { include: { lensBlank: { select: { id: true, brand: true, thickness: true } } } },
    payments: { orderBy: { paidAt: 'desc' as const }, include: { cheque: { select: { status: true } } } },
} as const

export async function listOpticianShopBills(params?: { opticianShopId?: string; status?: string }) {
    const where: Prisma.OpticianShopBillWhereInput = {}
    if (params?.opticianShopId) where.opticianShopId = params.opticianShopId
    if (params?.status) where.status = params.status as BillStatus

    return db.opticianShopBill.findMany({
        where,
        include: BILL_INCLUDE,
        orderBy: { createdAt: 'desc' },
    })
}

export async function getOpticianShopBill(id: string) {
    const bill = await db.opticianShopBill.findUnique({
        where: { id },
        include: BILL_INCLUDE,
    })
    if (!bill) throw new NotFoundError('Bill not found')
    return bill
}

export async function recordBillPayment(id: string, data: { amount: number; method: string; chequeId?: string; notes?: string }) {
    const bill = await db.opticianShopBill.findUnique({ where: { id }, include: BILL_INCLUDE })
    if (!bill) throw new NotFoundError('Bill not found')
    if (data.amount <= 0) throw new BadRequestError('Payment amount must be positive')

    const currentPaid = effectivePaymentTotal(
        (bill.payments ?? []).map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'client'
    )
    const newPaid = currentPaid + (data.chequeId ? 0 : data.amount)
    if (newPaid > Number(bill.totalAmount)) throw new BadRequestError('Payment exceeds remaining balance')

    await db.opticianShopPayment.create({
        data: {
            billId: id,
            amount: data.amount,
            method: data.method as PaymentMethod,
            chequeId: data.chequeId || null,
            notes: data.notes || null,
        },
    })

    const updated = await db.opticianShopBill.findUnique({ where: { id }, include: BILL_INCLUDE })
    if (!updated) throw new NotFoundError('Bill not found')
    const effective = effectivePaymentTotal(
        updated.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'client'
    )
    const status: BillStatus = effective >= Number(updated.totalAmount) ? 'paid' : effective > 0 ? 'partiallyPaid' : 'unpaid'

    return db.opticianShopBill.update({
        where: { id },
        data: { paidAmount: effective, status },
        include: BILL_INCLUDE,
    })
}
