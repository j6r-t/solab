import { api } from '@/lib/api/client'

export interface SupplierConsolidatedInvoicePayment {
    id: string
    amount: string
    method: string
    notes: string | null
    paidAt: string
    cheque: {
        status: string | null
        type: string | null
        number: string | null
        bankName: string | null
        dueDate: string | null
    } | null
}

export interface SupplierConsolidatedInvoice {
    id: string
    invoiceNumber: string
    fournisseurId: string
    fournisseur: { id: string; name: string } | null
    entity: string
    totalAmount: string
    paidAmount: string
    pendingAmount?: string
    status: string
    items: {
        id: string
        sourcePurchaseInvoiceId: string
        sourceInvoiceNumber: string
        amount: string
    }[]
    payments: SupplierConsolidatedInvoicePayment[]
    notes: string | null
    createdAt: string
}

export async function fetchSupplierConsolidatedInvoices(params?: { fournisseurId?: string; entity?: string; status?: string; search?: string }): Promise<SupplierConsolidatedInvoice[]> {
    const qs = new URLSearchParams()
    if (params?.fournisseurId) qs.set('fournisseurId', params.fournisseurId)
    if (params?.entity) qs.set('entity', params.entity)
    if (params?.status) qs.set('status', params.status)
    if (params?.search) qs.set('search', params.search)
    const query = qs.toString()
    return api.get(`/api/supplier-consolidated-invoices${query ? `?${query}` : ''}`)
}

export async function fetchSupplierConsolidatedInvoice(id: string): Promise<SupplierConsolidatedInvoice> {
    return api.get(`/api/supplier-consolidated-invoices/${id}`)
}

export interface GroupSupplierInvoicesPayload {
    fournisseurId: string
    invoiceIds: string[]
}

export async function groupPurchaseInvoices(data: GroupSupplierInvoicesPayload): Promise<SupplierConsolidatedInvoice> {
    return api.post('/api/supplier-consolidated-invoices', data)
}

export interface RecordSupplierConsolidatedPaymentPayload {
    amount: number
    method: 'cash' | 'cheque' | 'traite'
    chequeNumber?: string
    chequeBankName?: string
    chequeDueDate?: string
    chequeType?: 'standard' | 'traite'
    notes?: string
}

export async function recordSupplierConsolidatedPayment(id: string, data: RecordSupplierConsolidatedPaymentPayload): Promise<SupplierConsolidatedInvoice> {
    return api.patch(`/api/supplier-consolidated-invoices/${id}?action=record-payment`, data)
}
