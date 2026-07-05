export interface CreateProductInput {
    name: string
    brand?: string
    model?: string
    category?: string
    price: number
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
    quantity: number
    fournisseurId: string | null
    createdAt: Date
    fournisseur: { id: string; name: string } | null
    _count: { orderItems: number }
    qrcode: { code: string } | null
}
