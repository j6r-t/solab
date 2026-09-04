export interface BillingItemResponse {
    productName: string
    brand: string
    quantity: number
    unitPrice: string
}

export interface BillingChequeResponse {
    number: string
    bankName: string | null
    status: string
    dueDate: Date | null
}

export interface BillingPaymentResponse {
    amount: string
    type: string
    method?: string
    createdAt: Date
    cheque: BillingChequeResponse | null
}

export interface BillingRepairResponse {
    type: string
    price: string
}

export interface BillingPrescriptionResponse {
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
    dateWritten: Date | null
    doctorName: string | null
}

export interface BillingResponse {
    id: string
    orderNumber: number
    client: { name: string; familyName: string; phone: string; address: string | null }
    totalAmount: string
    totalPaid: string
    pendingAmount?: string
    balance: string
    paymentStatus: string
    status: string
    orderType: string
    createdAt: Date
    items: BillingItemResponse[]
    payments: BillingPaymentResponse[]
    repairs: BillingRepairResponse[]
    turnaroundDays: number | null
    prescription: BillingPrescriptionResponse | null
}
