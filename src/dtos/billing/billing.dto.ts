export interface BillingItemResponse {
    productName: string
    brand: string
    quantity: number
    unitPrice: string
}

export interface BillingPaymentResponse {
    amount: string
    type: string
    createdAt: Date
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
    clientName: string
    clientPhone: string
    totalAmount: string
    totalPaid: string
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
