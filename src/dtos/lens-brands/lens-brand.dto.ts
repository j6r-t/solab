export interface CreateLensBrandInput {
    name: string
}

export interface UpdateLensBrandInput {
    name?: string
}

export interface LensBrandResponse {
    id: string
    name: string
    createdAt: Date
}
