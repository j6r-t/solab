import type { PurchaseInvoiceResponse } from '@/modules/inventory/purchase-invoices/dtos/purchase-invoice.dto'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'

type Numeric = Prisma.Decimal | string | number | null

interface InvoiceItemInput {
    id: string
    quantity: number
    unitPrice: Numeric
    description?: string | null
    category?: string | null
    product?: { id: string; name: string | null; brand: string | null } | null
    lensBlank?: { id: string; brand: string | null; thickness: string | null } | null
}

interface InvoicePaymentInput {
    id: string
    amount: Numeric
    method: string | null
    paidAt: Date
    cheque?: { status?: string | null } | null
}

interface InvoiceInput {
    id: string
    invoiceNumber: string
    fournisseurId: string | null
    fournisseur?: { id: string; name: string; phone: string } | null
    entity: string
    date: Date
    totalAmount: Numeric
    paidAmount: Numeric
    items?: InvoiceItemInput[]
    payments?: InvoicePaymentInput[]
    notes?: string | null
    createdAt: Date
}

function toStr(val: Numeric): string {
    if (val == null) return '0'
    if (typeof val === 'string') return val
    if (typeof val === 'number') return val.toString()
    return String(val)
}

export function toPurchaseInvoiceResponse(invoice: InvoiceInput): PurchaseInvoiceResponse {
    const payments = (invoice.payments || []).map((p) => ({
        amount: toStr(p.amount),
        method: p.method,
        cheque: p.cheque,
    }))
    const totalPaid = effectivePaymentTotal(payments, 'supplier')
    const pendingAmount = pendingInstrumentTotal(payments, 'supplier')
    const total = parseFloat(toStr(invoice.totalAmount))
    return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        fournisseurId: invoice.fournisseurId,
        fournisseur: invoice.fournisseur || null,
        entity: invoice.entity,
        date: invoice.date,
        totalAmount: toStr(invoice.totalAmount),
        paidAmount: totalPaid.toString(),
        pendingAmount: pendingAmount.toString(),
        paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
        items: (invoice.items || []).map((item) => ({
            id: item.id,
            product: item.product || null,
            lensBlank: item.lensBlank || null,
            description: item.description || null,
            category: item.category || null,
            quantity: item.quantity,
            unitPrice: toStr(item.unitPrice),
        })),
        payments: (invoice.payments || []).map((p) => ({
            id: p.id,
            amount: toStr(p.amount),
            method: p.method,
            paidAt: p.paidAt,
            cheque: p.cheque ? { status: p.cheque.status || '' } : null,
        })),
        notes: invoice.notes || null,
        createdAt: invoice.createdAt,
    }
}
