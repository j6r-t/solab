import type { ProductResponse } from '@/dtos/stock/stock.dto'

export function toProductResponse(product: any): ProductResponse {
    return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        model: product.model,
        category: product.category,
        lensType: product.lensType,
        price: typeof product.price === 'number' ? product.price : Number(product.price.toString()),
        quantity: product.quantity,
        fournisseurId: product.fournisseurId,
        createdAt: product.createdAt,
        fournisseur: product.fournisseur || null,
        _count: product._count || { orderItems: 0 },
        qrcode: product.qrcode || null,
    }
}
