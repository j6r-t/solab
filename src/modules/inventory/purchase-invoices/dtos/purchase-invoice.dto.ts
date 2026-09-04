export interface CreatePurchaseInvoiceInput {
    invoiceNumber: string
    fournisseurId: string
    entity: 'shop' | 'atelier'
    date?: string
    items: { description?: string; category?: string; quantity: number; unitPrice: number }[]
    payments?: { amount: number; method: 'cash' | 'cheque' | 'traite'; chequeNumber?: string; chequeBank?: string; chequeDueDate?: string }[]
    notes?: string
}

export interface AddSupplierPaymentInput {
    amount: number
    method: 'cash' | 'cheque' | 'traite'
    chequeNumber?: string
    chequeBank?: string
    chequeDueDate?: string
}

export interface PurchaseInvoiceResponse {
    id: string
    invoiceNumber: string
    fournisseurId: string | null
    fournisseur: { id: string; name: string; phone: string } | null
    entity: string
    date: Date
    totalAmount: string
    paidAmount: string
    pendingAmount?: string
    paymentStatus: 'unpaid' | 'partiallyPaid' | 'fullyPaid'
    items: {
        id: string
        product: { id: string; name: string | null; brand: string | null } | null
        lensBlank: { id: string; brand: string | null; thickness: string | null } | null
        description: string | null
        category: string | null
        quantity: number
        unitPrice: string
    }[]
    payments: {
        id: string
        amount: string
        method: string | null
        paidAt: Date
        cheque: { status: string } | null
    }[]
    notes: string | null
    createdAt: Date
}
