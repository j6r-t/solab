import { api } from '@/lib/api/client'

export interface OpticianShopBill {
    id: string
    billNumber: string
    opticianShopId: string
    opticianShop: { id: string; name: string } | null
    workOrderId: string | null
    totalAmount: string
    paidAmount: string
    status: string
    items: {
        id: string
        description: string
        quantity: number
        unitPrice: string
        itemType: string
        lensBlank: { id: string; brand: string; thickness: string } | null
    }[]
    payments: {
        id: string
        amount: string
        method: string
        notes: string | null
        paidAt: string
    }[]
    notes: string | null
    createdAt: string
}

export async function fetchOpticianShopBills(params?: { opticianShopId?: string; status?: string }): Promise<OpticianShopBill[]> {
    const qs = new URLSearchParams()
    if (params?.opticianShopId) qs.set('opticianShopId', params.opticianShopId)
    if (params?.status) qs.set('status', params.status)
    const query = qs.toString()
    return api.get(`/api/optician-shop-bills${query ? `?${query}` : ''}`)
}

export async function fetchOpticianShopBill(id: string): Promise<OpticianShopBill> {
    return api.get(`/api/optician-shop-bills?id=${id}`)
}

export async function recordBillPayment(data: { billId: string; amount: number; method: string; chequeId?: string; notes?: string }): Promise<OpticianShopBill> {
    return api.post('/api/optician-shop-bills?action=record-payment', data)
}
