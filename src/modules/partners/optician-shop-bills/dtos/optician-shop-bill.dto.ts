export interface OpticianShopBillResponse {
    id: string
    billNumber: string
    opticianShopId: string | null
    opticianShop: { id: string; name: string } | null
    workOrderId: string | null
    totalAmount: string
    paidAmount: string
    pendingAmount?: string
    status: string
    items: {
        id: string
        description: string | null
        quantity: number
        unitPrice: string
        itemType: string
        lensBlank: { id: string; brand: string | null; thickness: string | null } | null
    }[]
    payments: {
        id: string
        amount: string
        method: string | null
        notes: string | null
        paidAt: Date
    }[]
    notes: string | null
    createdAt: Date
}

export interface RecordBillPaymentInput {
    amount: number
    method: 'cash' | 'cheque' | 'card'
    chequeId?: string
    notes?: string
}
