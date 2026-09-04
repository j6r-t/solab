import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

interface InvoiceItem {
    id: string
    product: { id: string; name: string; brand: string } | null
    lensBlank: { id: string; brand: string; thickness: string } | null
    description: string | null
    category: string | null
    quantity: number
    unitPrice: string
}

interface InvoicePayment {
    id: string
    amount: string
    method: string
    paidAt: string
}

export interface PurchaseInvoice {
    id: string
    invoiceNumber: string
    fournisseur: { id: string; name: string; phone: string }
    entity: string
    date: string
    totalAmount: string
    paidAmount: string
    paymentStatus: 'unpaid' | 'partiallyPaid' | 'fullyPaid'
    items: InvoiceItem[]
    payments: InvoicePayment[]
    notes: string | null
    createdAt: string
}

export function usePurchaseInvoices(params: { entity: string; paymentStatus?: string }) {
    return useQuery({
        queryKey: ['purchase-invoices', params],
        queryFn: () => api.get<PurchaseInvoice[]>('/api/purchase-invoices', { entity: params.entity, paymentStatus: params.paymentStatus }),
    })
}
