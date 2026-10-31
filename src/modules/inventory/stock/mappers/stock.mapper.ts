import type { ProductResponse } from '@/modules/inventory/stock/dtos/stock.dto'
import type { Prisma } from '@prisma/client'

type Numeric = Prisma.Decimal | string | number | null

interface ProductInput {
    id: string
    name: string
    brand: string | null
    model: string | null
    category: string | null
    lensType: string | null
    price: Numeric
    priceAfterTax: Numeric | null
    quantity: number
    fournisseurId: string | null
    createdAt: Date
    costPrice: Numeric | null
    thickness: string | null
    material: string | null
    coating: string | null
    sph: Numeric | null
    cyl: Numeric | null
    add: Numeric | null
    fournisseur?: { id: string; name: string } | null
    _count?: { orderItems: number } | null
    qrcode?: { code: string } | null
}

function toNumber(val: Numeric): number {
    if (val == null) return 0
    if (typeof val === 'number') return val
    return Number(val.toString())
}

export function toProductResponse(product: ProductInput): ProductResponse {
    return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        model: product.model,
        category: product.category || '',
        lensType: product.lensType,
        price: toNumber(product.price),
        priceAfterTax: product.priceAfterTax != null ? toNumber(product.priceAfterTax) : null,
        quantity: product.quantity,
        fournisseurId: product.fournisseurId,
        createdAt: product.createdAt,
        costPrice: product.costPrice != null ? toNumber(product.costPrice) : null,
        thickness: product.thickness || null,
        material: product.material || null,
        coating: product.coating || null,
        sph: product.sph != null ? toNumber(product.sph) : null,
        cyl: product.cyl != null ? toNumber(product.cyl) : null,
        add: product.add != null ? toNumber(product.add) : null,
        fournisseur: product.fournisseur || null,
        _count: product._count || { orderItems: 0 },
        qrcode: product.qrcode || null,
    }
}
