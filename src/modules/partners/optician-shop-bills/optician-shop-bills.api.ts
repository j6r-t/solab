import { api } from '@/lib/api/client'

export interface OpticianShopBillPaymentCheque {
    status: string | null
    type: string | null
    number: string | null
    bankName: string | null
    dueDate: string | null
}

export interface OpticianShopBillPayment {
    id: string
    amount: string
    method: string
    notes: string | null
    paidAt: string
    cheque: OpticianShopBillPaymentCheque | null
}

export interface OpticianShopBill {
    id: string
    billNumber: string
    opticianShopId: string
    opticianShop: { id: string; name: string } | null
    workOrderId: string | null
    totalAmount: string
    paidAmount: string
    pendingAmount?: string
    status: string
    items: {
        id: string
        description: string
        quantity: number
        unitPrice: string
        itemType: string
        lensBlank: { id: string; brand: string; thickness: string } | null
    }[]
    payments: OpticianShopBillPayment[]
    groupedIntoId: string | null
    groupedInvoiceNumber: string | null
    notes: string | null
    createdAt: string
}

export async function fetchOpticianShopBills(params?: { opticianShopId?: string; status?: string; search?: string }): Promise<OpticianShopBill[]> {
    const qs = new URLSearchParams()
    if (params?.opticianShopId) qs.set('opticianShopId', params.opticianShopId)
    if (params?.status) qs.set('status', params.status)
    if (params?.search) qs.set('search', params.search)
    const query = qs.toString()
    return api.get(`/api/optician-shop-bills${query ? `?${query}` : ''}`)
}

export interface OpticianShopBillShopSummary {
    shopId: string
    shopName: string
    invoiceCount: number
    totalOutstanding: number
}

export async function fetchOpticianShopBillsSummary(): Promise<OpticianShopBillShopSummary[]> {
    return api.get('/api/optician-shop-bills?summary=per-shop')
}

export async function fetchOpticianShopBill(id: string): Promise<OpticianShopBill> {
    return api.get(`/api/optician-shop-bills/${id}`)
}

export interface RecordBillPaymentPayload {
    amount: number
    method: 'cash' | 'card' | 'cheque' | 'traite'
    chequeNumber?: string
    chequeBankName?: string
    chequeDueDate?: string
    chequeType?: 'standard' | 'traite'
    notes?: string
}

export async function recordBillPayment(billId: string, data: RecordBillPaymentPayload): Promise<OpticianShopBill> {
    return api.patch(`/api/optician-shop-bills/${billId}?action=record-payment`, data)
}
