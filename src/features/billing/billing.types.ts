export interface InvoiceItem {
    productName: string
    brand: string
    quantity: number
    unitPrice: string
}

export interface InvoicePayment {
    amount: string
    type: string
    createdAt: string
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
