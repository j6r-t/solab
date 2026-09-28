import type { ConsolidatedInvoiceResponse } from '@/modules/partners/consolidated-invoices/dtos/consolidated-invoice.dto'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'

type Numeric = Prisma.Decimal | string | number | null

interface ConsolidatedItemInput {
    id: string
    sourceBillId: string
    sourceBillNumber: string
    amount: Numeric
}

interface ConsolidatedPaymentInput {
    id: string
    amount: Numeric
    method: string | null
    notes?: string | null
    paidAt: Date
    cheque?: {
        status?: string | null
        type?: string | null
        number?: string | null
        bankName?: string | null
        dueDate?: Date | string | null
    } | null
}

interface ConsolidatedInvoiceInput {
    id: string
    invoiceNumber: string
    opticianShopId: string | null
    opticianShop?: { id: string; name: string } | null
    totalAmount: Numeric
    paidAmount: Numeric
    status: string
    items?: ConsolidatedItemInput[]
    payments?: ConsolidatedPaymentInput[]
    notes?: string | null
    createdAt: Date
}

export function toConsolidatedInvoiceResponse(invoice: ConsolidatedInvoiceInput): ConsolidatedInvoiceResponse {
    const payments = (invoice.payments || []).map((p) => ({ amount: (p.amount || 0).toString(), method: p.method, cheque: p.cheque }))
    const paidAmount = effectivePaymentTotal(payments, 'client')
    const pendingAmount = pendingInstrumentTotal(payments, 'client')
    return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        opticianShopId: invoice.opticianShopId,
        opticianShop: invoice.opticianShop || null,
        totalAmount: (invoice.totalAmount || 0).toString(),
        paidAmount: paidAmount.toString(),
        pendingAmount: pendingAmount.toString(),
        status: paidAmount >= Number(invoice.totalAmount) ? 'paid' : paidAmount > 0 ? 'partiallyPaid' : 'unpaid',
        items: (invoice.items || []).map((item) => ({
            id: item.id,
            sourceBillId: item.sourceBillId,
            sourceBillNumber: item.sourceBillNumber,
            amount: (item.amount || 0).toString(),
        })),
        payments: (invoice.payments || []).map((p) => ({
            id: p.id,
            amount: (p.amount || 0).toString(),
            method: p.method,
            notes: p.notes || null,
            paidAt: p.paidAt,
            cheque: p.cheque
                ? {
                      status: p.cheque.status ?? null,
                      type: p.cheque.type ?? null,
                      number: p.cheque.number ?? null,
                      bankName: p.cheque.bankName ?? null,
                      dueDate: p.cheque.dueDate ?? null,
                  }
                : null,
        })),
        notes: invoice.notes || null,
        createdAt: invoice.createdAt,
    }
}
