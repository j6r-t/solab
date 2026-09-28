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
        cheque: {
            status: string | null
            type: string | null
            number: string | null
            bankName: string | null
            dueDate: Date | string | null
        } | null
    }[]
    groupedIntoId: string | null
    groupedInvoiceNumber: string | null
    notes: string | null
    createdAt: Date
}

export interface RecordBillPaymentInput {
    amount: number
    method: 'cash' | 'card' | 'cheque' | 'traite'
    chequeId?: string
    chequeNumber?: string
    chequeBankName?: string
    chequeDueDate?: string
    chequeType?: 'standard' | 'traite'
    notes?: string
}
