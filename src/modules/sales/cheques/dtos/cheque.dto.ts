export interface ChequeRelatedOrderResponse {
    id: string
    orderNumber: number
    client: { id: string; name: string; familyName: string }
}

export interface ChequeRelatedInvoiceResponse {
    id: string
    invoiceNumber: string
    fournisseur: { id: string; name: string }
}

export interface ChequeRelatedBillResponse {
    id: string
    billNumber: string
    opticianShop: { id: string; name: string }
}

export interface ChequeRelatedConsolidatedInvoiceResponse {
    id: string
    invoiceNumber: string
    opticianShop: { id: string; name: string }
}

export interface ChequeRelatedSupplierConsolidatedInvoiceResponse {
    id: string
    invoiceNumber: string
    fournisseur: { id: string; name: string }
}

export interface ChequeResponse {
    id: string
    number: string
    type: string
    bankName: string | null
    amount: string
    issueDate: Date
    dueDate: Date
    status: string
    entityType: string
    notes: string | null
    order: ChequeRelatedOrderResponse | null
    invoice: ChequeRelatedInvoiceResponse | null
    opticianBill: ChequeRelatedBillResponse | null
    consolidatedInvoice: ChequeRelatedConsolidatedInvoiceResponse | null
    supplierConsolidated: ChequeRelatedSupplierConsolidatedInvoiceResponse | null
}
