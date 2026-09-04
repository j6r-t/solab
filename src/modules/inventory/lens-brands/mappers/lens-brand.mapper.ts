import type { LensBrandResponse } from '@/modules/inventory/lens-brands/dtos/lens-brand.dto'

export function toLensBrandResponse(item: { id: string; name: string; createdAt: Date }): LensBrandResponse {
    return {
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
    }
}
