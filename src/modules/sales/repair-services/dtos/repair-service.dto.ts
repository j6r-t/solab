export interface CreateRepairServiceInput {
    name: string
    defaultPrice: number
}

export interface UpdateRepairServiceInput {
    name?: string
    defaultPrice?: number
}

export interface RepairServiceResponse {
    id: string
    name: string
    defaultPrice: number
    createdAt: Date
}
