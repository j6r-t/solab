export interface UpdateRepairInput {
    status: 'pending' | 'completed' | 'cancelled'
}

export interface RepairResponse {
    id: string
    orderId: string
    type: string
    status: string
    price: string
    expectedCompletionDate: Date
    repairService: { id: string; name: string } | null
    createdAt: Date
}
