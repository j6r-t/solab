import { api } from '@/lib/api/client'

export interface ConsolidatedInvoicePayment {
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

export interface ConsolidatedInvoice {
    id: string
    invoiceNumber: string
    opticianShopId: string
    opticianShop: { id: string; name: string } | null
    totalAmount: string
    paidAmount: string
    pendingAmount?: string
    status: string
    items: {
        id: string
        sourceBillId: string
        sourceBillNumber: string
        amount: string
    }[]
    payments: ConsolidatedInvoicePayment[]
    notes: string | null
    createdAt: string
}

export async function fetchConsolidatedInvoices(params?: { opticianShopId?: string; status?: string; search?: string }): Promise<ConsolidatedInvoice[]> {
    const qs = new URLSearchParams()
    if (params?.opticianShopId) qs.set('opticianShopId', params.opticianShopId)
    if (params?.status) qs.set('status', params.status)
    if (params?.search) qs.set('search', params.search)
    const query = qs.toString()
    return api.get(`/api/consolidated-invoices${query ? `?${query}` : ''}`)
}

export async function fetchConsolidatedInvoice(id: string): Promise<ConsolidatedInvoice> {
    return api.get(`/api/consolidated-invoices/${id}`)
}

export interface GroupBillsPayload {
    opticianShopId: string
    billIds: string[]
}

export async function groupOpticianShopBills(data: GroupBillsPayload): Promise<ConsolidatedInvoice> {
    return api.post('/api/consolidated-invoices', data)
}

export interface RecordConsolidatedPaymentPayload {
    amount: number
    method: 'cash' | 'card' | 'cheque' | 'traite'
    chequeNumber?: string
    chequeBankName?: string
    chequeDueDate?: string
    chequeType?: 'standard' | 'traite'
    notes?: string
}

export async function recordConsolidatedPayment(id: string, data: RecordConsolidatedPaymentPayload): Promise<ConsolidatedInvoice> {
    return api.patch(`/api/consolidated-invoices/${id}?action=record-payment`, data)
}
