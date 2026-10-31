export interface CreateBankInput {
    name: string
}

export interface UpdateBankInput {
    name?: string
}

export interface BankResponse {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
}
