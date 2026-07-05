import type { RepairServiceResponse } from '@/dtos/repair-services/repair-service.dto'

export function toRepairServiceResponse(service: { id: string; name: string; defaultPrice: { toString: () => string } | number; createdAt: Date }): RepairServiceResponse {
    return {
        id: service.id,
        name: service.name,
        defaultPrice: typeof service.defaultPrice === 'number' ? service.defaultPrice : Number(service.defaultPrice.toString()),
        createdAt: service.createdAt,
    }
}
