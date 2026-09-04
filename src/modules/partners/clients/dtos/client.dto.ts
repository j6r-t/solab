export interface CreateClientInput {
    name: string
    familyName: string
    phone: string
    address?: string | null
    gender?: 'male' | 'female' | null
    birthDate?: string | null
    notes?: string | null
    organization?: string | null
}

export interface UpdateClientInput {
    name?: string
    familyName?: string
    phone?: string
    address?: string | null
    gender?: 'male' | 'female' | null
    birthDate?: string | null
    notes?: string | null
    organization?: string | null
}

export interface ClientResponse {
    id: string
    name: string
    familyName: string
    phone: string
    address: string | null
    gender: string | null
    birthDate: string | null
    notes: string | null
    organization: string | null
    createdAt: Date
}
