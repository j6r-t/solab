import type { SupplierConsolidatedInvoiceResponse } from '@/modules/inventory/supplier-consolidated-invoices/dtos/supplier-consolidated-invoice.dto'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'

type Numeric = Prisma.Decimal | string | number | null

interface SupplierConsolidatedItemInput {
    id: string
    sourcePurchaseInvoiceId: string
    sourceInvoiceNumber: string
    amount: Numeric
}

interface SupplierConsolidatedPaymentInput {
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

interface SupplierConsolidatedInvoiceInput {
    id: string
    invoiceNumber: string
    fournisseurId: string
    fournisseur?: { id: string; name: string } | null
    entity: string
    totalAmount: Numeric
    paidAmount: Numeric
    status: string
    items?: SupplierConsolidatedItemInput[]
    payments?: SupplierConsolidatedPaymentInput[]
    notes?: string | null
    createdAt: Date
}

export function toSupplierConsolidatedInvoiceResponse(invoice: SupplierConsolidatedInvoiceInput): SupplierConsolidatedInvoiceResponse {
    const payments = (invoice.payments || []).map((p) => ({ amount: (p.amount || 0).toString(), method: p.method, cheque: p.cheque }))
    const paidAmount = effectivePaymentTotal(payments, 'supplier')
    const pendingAmount = pendingInstrumentTotal(payments, 'supplier')
    return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        fournisseurId: invoice.fournisseurId,
        fournisseur: invoice.fournisseur || null,
        entity: invoice.entity,
        totalAmount: (invoice.totalAmount || 0).toString(),
        paidAmount: paidAmount.toString(),
        pendingAmount: pendingAmount.toString(),
        status: paidAmount >= Number(invoice.totalAmount) ? 'paid' : paidAmount > 0 ? 'partiallyPaid' : 'unpaid',
        items: (invoice.items || []).map((item) => ({
            id: item.id,
            sourcePurchaseInvoiceId: item.sourcePurchaseInvoiceId,
            sourceInvoiceNumber: item.sourceInvoiceNumber,
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
