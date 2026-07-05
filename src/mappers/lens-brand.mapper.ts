import type { LensBrandResponse } from '@/dtos/lens-brands/lens-brand.dto'

export function toLensBrandResponse(item: { id: string; name: string; createdAt: Date }): LensBrandResponse {
    return {
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
    }
}
