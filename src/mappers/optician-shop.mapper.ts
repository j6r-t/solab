import type { OpticianShopResponse } from '@/dtos/optician-shops/optician-shop.dto'

export function toOpticianShopResponse(shop: { id: string; name: string; phone: string; address: string | null; notes: string | null; createdAt: Date }): OpticianShopResponse {
    return {
        id: shop.id,
        name: shop.name,
        phone: shop.phone,
        address: shop.address,
        notes: shop.notes,
        createdAt: shop.createdAt,
    }
}
