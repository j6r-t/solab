import type { ClientResponse } from '@/dtos/clients/client.dto'

export function toClientResponse(client: { id: string; name: string; familyName: string; phone: string; address: string | null; gender: string | null; createdAt: Date }): ClientResponse {
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
