import type { PurchaseInvoiceResponse } from '@/dtos/purchase-invoices/purchase-invoice.dto'

export function toPurchaseInvoiceResponse(invoice: any): PurchaseInvoiceResponse {
    const totalPaid = parseFloat(invoice.paidAmount?.toString() || '0')
    const total = parseFloat(invoice.totalAmount?.toString() || '0')
    return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        fournisseurId: invoice.fournisseurId,
        fournisseur: invoice.fournisseur,
        entity: invoice.entity,
        date: invoice.date,
        totalAmount: invoice.totalAmount.toString(),
        paidAmount: (invoice.paidAmount || '0').toString(),
        paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
        items: (invoice.items || []).map((item: any) => ({
            id: item.id,
            product: item.product || null,
            lensBlank: item.lensBlank || null,
            description: item.description || null,
            category: item.category || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
        })),
        payments: (invoice.payments || []).map((p: any) => ({
            id: p.id,
            amount: p.amount.toString(),
            method: p.method,
            paidAt: p.paidAt,
        })),
        notes: invoice.notes || null,
        createdAt: invoice.createdAt,
    }
}
