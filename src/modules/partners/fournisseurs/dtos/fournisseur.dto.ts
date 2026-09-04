export interface CreateFournisseurInput {
    name: string
    phone?: string
    address?: string | null
    email?: string | null
    taxId?: string | null
    entity?: string
}

export interface UpdateFournisseurInput {
    name?: string
    phone?: string
    address?: string | null
    email?: string | null
    taxId?: string | null
}

export interface FournisseurResponse {
    id: string
    name: string
    phone: string
    address: string | null
    email: string | null
    taxId: string | null
    createdAt: Date
    _count: { products: number }
}
