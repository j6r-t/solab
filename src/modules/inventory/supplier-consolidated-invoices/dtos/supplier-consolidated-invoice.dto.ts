export interface SupplierConsolidatedInvoiceItemResponse {
    id: string
    sourcePurchaseInvoiceId: string
    sourceInvoiceNumber: string
    amount: string
}

export interface SupplierConsolidatedInvoicePaymentCheque {
    status: string | null
    type: string | null
    number: string | null
    bankName: string | null
    dueDate: Date | string | null
}

export interface SupplierConsolidatedInvoicePaymentResponse {
    id: string
    amount: string
    method: string | null
    notes: string | null
    paidAt: Date
    cheque: SupplierConsolidatedInvoicePaymentCheque | null
}

export interface SupplierConsolidatedInvoiceResponse {
    id: string
    invoiceNumber: string
    fournisseurId: string
    fournisseur: { id: string; name: string } | null
    entity: string
    totalAmount: string
    paidAmount: string
    pendingAmount?: string
    status: string
    items: SupplierConsolidatedInvoiceItemResponse[]
    payments: SupplierConsolidatedInvoicePaymentResponse[]
    notes: string | null
    createdAt: Date
}
