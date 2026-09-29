export interface CreateProductInput {
    name: string
    brand?: string
    model?: string
    category?: string
    price: number
    priceAfterTax?: number
    costPrice?: number
    quantity: number
    thickness?: string
    lensType?: string
    material?: string
    coating?: string
    sph?: number
    cyl?: number
    add?: number
    fournisseurId?: string
}

export interface UpdateProductInput {
    name?: string
    brand?: string
    model?: string
    category?: string
    price?: number
    priceAfterTax?: number
    costPrice?: number
    quantity?: number
    thickness?: string
    lensType?: string
    material?: string
    coating?: string
    sph?: number
    cyl?: number
    add?: number
    fournisseurId?: string
}

export interface ProductResponse {
    id: string
    name: string
    brand: string | null
    model: string | null
    category: string
    lensType: string | null
    price: number
    priceAfterTax: number | null
    quantity: number
    fournisseurId: string | null
    createdAt: Date
    fournisseur: { id: string; name: string } | null
    costPrice: number | null
    thickness: string | null
    material: string | null
    coating: string | null
    sph: number | null
    cyl: number | null
    add: number | null
    _count: { orderItems: number }
    qrcode: { code: string } | null
}
