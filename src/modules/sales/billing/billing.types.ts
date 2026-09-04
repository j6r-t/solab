export interface InvoiceItem {
    productName: string
    brand: string
    quantity: number
    unitPrice: string
    sellingPrice?: string | null
}

export interface InvoicePayment {
    amount: string
    type: string
    method?: string
    createdAt: string
    cheque?: { number: string; bankName?: string | null; status: string; dueDate: string | null } | null
}

export interface InvoiceRepair {
    type: string
    price: string
}

export interface InvoicePrescription {
    sphRight: string
    cylRight: string
    axisRight: number
    addRight: string
    pdRight: number
    sphLeft: string
    cylLeft: string
    axisLeft: number
    addLeft: string
    pdLeft: number
    dateWritten: string | null
    doctorName: string | null
}

export interface BillingRecord {
    id: string
    orderNumber: number
    client: { name: string; familyName: string; phone: string; address?: string | null }
    totalAmount: string
    totalPaid: string
    pendingAmount?: string
    balance: string
    paymentStatus: string
    status: string
    orderType: string
    createdAt: string
    items: InvoiceItem[]
    payments: InvoicePayment[]
    repairs: InvoiceRepair[]
    turnaroundDays: number | null
    prescription: InvoicePrescription | null
}
