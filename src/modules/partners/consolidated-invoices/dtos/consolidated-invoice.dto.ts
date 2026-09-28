export interface ConsolidatedInvoiceItemResponse {
    id: string
    sourceBillId: string
    sourceBillNumber: string
    amount: string
}

export interface ConsolidatedInvoicePaymentCheque {
    status: string | null
    type: string | null
    number: string | null
    bankName: string | null
    dueDate: Date | string | null
}

export interface ConsolidatedInvoicePaymentResponse {
    id: string
    amount: string
    method: string | null
    notes: string | null
    paidAt: Date
    cheque: ConsolidatedInvoicePaymentCheque | null
}

export interface ConsolidatedInvoiceResponse {
    id: string
    invoiceNumber: string
    opticianShopId: string | null
    opticianShop: { id: string; name: string } | null
    totalAmount: string
    paidAmount: string
    pendingAmount?: string
    status: string
    items: ConsolidatedInvoiceItemResponse[]
    payments: ConsolidatedInvoicePaymentResponse[]
    notes: string | null
    createdAt: Date
}
