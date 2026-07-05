export interface CreateClientInput {
    name: string
    familyName: string
    phone: string
    address?: string | null
    gender?: 'male' | 'female' | null
}

export interface UpdateClientInput {
    name?: string
    familyName?: string
    phone?: string
    address?: string | null
    gender?: 'male' | 'female' | null
}

export interface ClientResponse {
    id: string
    name: string
    familyName: string
    phone: string
    address: string | null
    gender: string | null
    createdAt: Date
}
