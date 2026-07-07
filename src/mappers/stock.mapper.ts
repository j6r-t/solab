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
        costPrice: product.costPrice ? Number(product.costPrice.toString()) : null,
        thickness: product.thickness || null,
        material: product.material || null,
        coating: product.coating || null,
        sph: product.sph != null ? Number(product.sph.toString()) : null,
        cyl: product.cyl != null ? Number(product.cyl.toString()) : null,
        add: product.add != null ? Number(product.add.toString()) : null,
        fournisseur: product.fournisseur || null,
        _count: product._count || { orderItems: 0 },
        qrcode: product.qrcode || null,
    }
}
