export interface CreateLensBlankInput {
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sphMin: number
    sphMax: number
    cylMin: number
    cylMax: number
    costPrice: number
    sellingPrice: number
    quantity?: number
    fournisseurId?: string
}

export interface UpdateLensBlankInput {
    brand?: string
    lensType?: string
    material?: string
    coating?: string
    thickness?: string
    sphMin?: number
    sphMax?: number
    cylMin?: number
    cylMax?: number
    costPrice?: number
    sellingPrice?: number
    quantity?: number
    fournisseurId?: string
}

export interface LensBlankResponse {
    id: string
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sphMin: string
    sphMax: string
    cylMin: string
    cylMax: string
    costPrice: string
    sellingPrice: string
    quantity: number
    fournisseur: { id: string; name: string } | null
    createdAt: Date
}
