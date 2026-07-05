export interface CreateFournisseurInput {
    name: string
    phone?: string
    address?: string | null
}

export interface UpdateFournisseurInput {
    name?: string
    phone?: string
    address?: string | null
}

export interface FournisseurResponse {
    id: string
    name: string
    phone: string
    address: string | null
    createdAt: Date
    _count: { products: number }
}
