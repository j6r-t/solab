export interface CreateOrderItemInput {
    productId?: string
    lensBlankId?: string
    name?: string
    quantity: number
    unitPrice?: number
}

export interface CreateOrderPaymentInput {
    amount: number
    type: 'deposit' | 'balance' | 'full'
    method?: 'cash' | 'cheque' | 'traite' | 'card' | 'transfer'
    chequeId?: string
    dueDate?: string
}

export interface CreateOrderRepairInput {
    type: string
    price: number
    expectedCompletionDate?: string
    repairServiceId?: string
}

export interface CreateOrderInput {
    clientId: string
    orderType?: 'standard' | 'remounting' | 'direct_sale'
    items?: CreateOrderItemInput[]
    payments?: CreateOrderPaymentInput[]
    repairs?: CreateOrderRepairInput[]
    prescriptionId?: string
    turnaroundDays?: number
}

export interface UpdateOrderStatusInput {
    status: 'ready' | 'completed' | 'cancelled'
}

export interface AddOrderPaymentsInput {
    payments: {
        amount: number
        type: string
        method?: 'cash' | 'cheque' | 'traite' | 'card' | 'transfer'
        chequeId?: string
        dueDate?: string
    }[]
}

export interface OrderListItemDto {
    id: string
    orderNumber: number
    clientId: string
    totalAmount: string
    totalPaid: string
    paymentStatus: 'unpaid' | 'partiallyPaid' | 'fullyPaid'
    status: string
    orderType: string
    createdAt: Date
    client: { id: string; name: string; familyName: string; phone: string }
}

export interface OrderDetailItemDto {
    id: string
    productId: string | null
    lensBlankId: string | null
    name: string | null
    quantity: number
    unitPrice: string
    sellingPrice: string | null
    product: { id: string; name: string; brand: string; model: string; category: string } | null
    lensBlank: { id: string; brand: string; lensType: string; material: string; thickness: string } | null
}

export interface OrderDetailPaymentDto {
    id: string
    amount: string
    type: string
    createdAt: Date
}

export interface OrderDetailRepairDto {
    id: string
    type: string
    price: string
    status: string
    expectedCompletionDate: Date
    repairService: { id: string; name: string } | null
}

export interface OrderDetailPrescriptionDto {
    id: string
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
    doctor: { id: string; name: string } | null
}

export interface OrderDetailDto {
    id: string
    orderNumber: number
    clientId: string
    totalAmount: string
    totalPaid: string
    paymentStatus: 'unpaid' | 'partiallyPaid' | 'fullyPaid'
    orderType: string
    status: string
    createdAt: Date
    client: { id: string; name: string; familyName: string; phone: string; address: string | null }
    items: OrderDetailItemDto[]
    payments: OrderDetailPaymentDto[]
    repairs: OrderDetailRepairDto[]
    prescription: OrderDetailPrescriptionDto | null
    turnaroundDays: number | null
}
