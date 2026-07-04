import type { Client } from '@prisma/client'

export interface ClientResponse {
    id: string
    name: string
    familyName: string
    phone: string
    address: string | null
    gender: string | null
    createdAt: Date
}

export function toClientResponse(client: any): ClientResponse {
    return {
        id: client.id,
        name: client.name,
        familyName: client.familyName,
        phone: client.phone,
        address: client.address,
        gender: client.gender,
        createdAt: client.createdAt,
    }
}
