export interface CreateOpticianShopInput {
    name: string
    phone: string
    address?: string | null
    notes?: string | null
}

export interface UpdateOpticianShopInput {
    name?: string
    phone?: string
    address?: string | null
    notes?: string | null
}

export interface OpticianShopResponse {
    id: string
    name: string
    phone: string
    address: string | null
    notes: string | null
    createdAt: Date
}
