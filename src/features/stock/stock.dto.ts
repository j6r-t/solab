export interface ProductResponse {
    id: string
    name: string
    brand: string | null
    model: string | null
    category: string
    lensType: string | null
    price: number
    quantity: number
    fournisseurId: string | null
    createdAt: Date
    fournisseur: { id: string; name: string } | null
    _count: { orderItems: number }
    qrcode: { code: string } | null
}

export function toProductResponse(product: any): ProductResponse {
    return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        model: product.model,
        category: product.category,
        lensType: product.lensType,
        price: product.price,
        quantity: product.quantity,
        fournisseurId: product.fournisseurId,
        createdAt: product.createdAt,
        fournisseur: product.fournisseur || null,
        _count: product._count || { orderItems: 0 },
        qrcode: product.qrcode || null,
    }
}
