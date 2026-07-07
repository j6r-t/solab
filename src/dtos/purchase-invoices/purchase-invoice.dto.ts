export interface CreatePurchaseInvoiceInput {
    invoiceNumber: string
    fournisseurId: string
    entity: 'shop' | 'atelier'
    date?: string
    items: { description?: string; category?: string; quantity: number; unitPrice: number }[]
    payments?: { amount: number; method: 'cash' | 'cheque' | 'traite' | 'transfer'; chequeNumber?: string; chequeBank?: string; chequeDueDate?: string }[]
    notes?: string
}

export interface AddSupplierPaymentInput {
    amount: number
    method: 'cash' | 'cheque' | 'traite' | 'transfer'
    chequeNumber?: string
    chequeBank?: string
    chequeDueDate?: string
}

export interface PurchaseInvoiceResponse {
    id: string
    invoiceNumber: string
    fournisseurId: string
    fournisseur: { id: string; name: string; phone: string }
    entity: string
    date: Date
    totalAmount: string
    paidAmount: string
    paymentStatus: 'unpaid' | 'partiallyPaid' | 'fullyPaid'
    items: {
        id: string
        product: { id: string; name: string; brand: string } | null
        lensBlank: { id: string; brand: string; thickness: string } | null
        description: string | null
        category: string | null
        quantity: number
        unitPrice: string
    }[]
    payments: {
        id: string
        amount: string
        method: string
        paidAt: Date
    }[]
    notes: string | null
    createdAt: Date
}
