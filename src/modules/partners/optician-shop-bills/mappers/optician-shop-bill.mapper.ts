import type { OpticianShopBillResponse } from '@/modules/partners/optician-shop-bills/dtos/optician-shop-bill.dto'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'

type Numeric = Prisma.Decimal | string | number | null

interface BillItemInput {
    id: string
    description: string | null
    quantity: number
    unitPrice: Numeric
    itemType: string
    lensBlank?: { id: string; brand: string | null; thickness: string | null } | null
}

interface BillPaymentInput {
    id: string
    amount: Numeric
    method: string | null
    notes?: string | null
    paidAt: Date
    cheque?: { status?: string | null } | null
}

interface BillInput {
    id: string
    billNumber: string
    opticianShopId: string | null
    opticianShop?: { id: string; name: string } | null
    workOrderId?: string | null
    totalAmount: Numeric
    paidAmount: Numeric
    status: string
    items?: BillItemInput[]
    payments?: BillPaymentInput[]
    notes?: string | null
    createdAt: Date
}

export function toOpticianShopBillResponse(bill: BillInput): OpticianShopBillResponse {
    const payments = (bill.payments || []).map((p) => ({ amount: (p.amount || 0).toString(), method: p.method, cheque: p.cheque }))
    const paidAmount = effectivePaymentTotal(payments, 'client')
    const pendingAmount = pendingInstrumentTotal(payments, 'client')
    return {
        id: bill.id,
        billNumber: bill.billNumber,
        opticianShopId: bill.opticianShopId,
        opticianShop: bill.opticianShop || null,
        workOrderId: bill.workOrderId || null,
        totalAmount: (bill.totalAmount || 0).toString(),
        paidAmount: paidAmount.toString(),
        pendingAmount: pendingAmount.toString(),
        status: paidAmount >= Number(bill.totalAmount) ? 'paid' : paidAmount > 0 ? 'partiallyPaid' : 'unpaid',
        items: (bill.items || []).map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: (item.unitPrice || 0).toString(),
            itemType: item.itemType,
            lensBlank: item.lensBlank || null,
        })),
        payments: (bill.payments || []).map((p) => ({
            id: p.id,
            amount: (p.amount || 0).toString(),
            method: p.method,
            notes: p.notes || null,
            paidAt: p.paidAt,
        })),
        notes: bill.notes || null,
        createdAt: bill.createdAt,
    }
}
