export interface CreateLensBlankInput {
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sph: number
    cyl: number
    costPrice: number
    sellingPrice: number
    priceAfterTax?: number
    quantity?: number
    fournisseurId?: string
}

export interface UpdateLensBlankInput {
    brand?: string
    lensType?: string
    material?: string
    coating?: string
    thickness?: string
    sph?: number
    cyl?: number
    costPrice?: number
    sellingPrice?: number
    priceAfterTax?: number
    quantity?: number
    fournisseurId?: string
}

export interface LensBlankResponse {
    id: string
    brand: string
    lensType: string | null
    material: string | null
    coating: string | null
    thickness: string | null
    sph: string
    cyl: string
    costPrice: string
    sellingPrice: string
    priceAfterTax: string | null
    quantity: number
    fournisseur: { id: string; name: string } | null
    createdAt: Date
}
