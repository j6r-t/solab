import type { ClientResponse } from '@/modules/partners/clients/dtos/client.dto'

export function toClientResponse(client: { id: string; name: string; familyName: string; phone: string; address: string | null; gender: string | null; birthDate: string | null; notes: string | null; organization: string | null; createdAt: Date; revenue?: string; balance?: string; lastVisitAt?: Date | string | null }): ClientResponse {
    return {
        id: client.id,
        name: client.name,
        familyName: client.familyName,
        phone: client.phone,
        address: client.address,
        gender: client.gender,
        birthDate: client.birthDate,
        notes: client.notes,
        organization: client.organization,
        createdAt: client.createdAt,
        revenue: client.revenue,
        balance: client.balance,
        lastVisitAt: client.lastVisitAt,
    }
}
