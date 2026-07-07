import type { LensBlankResponse } from '@/dtos/lens-blanks/lens-blank.dto'

export function toLensBlankResponse(blank: any): LensBlankResponse {
    return {
        id: blank.id,
        brand: blank.brand,
        lensType: blank.lensType,
        material: blank.material,
        coating: blank.coating,
        thickness: blank.thickness,
        sphMin: blank.sphMin.toString(),
        sphMax: blank.sphMax.toString(),
        cylMin: blank.cylMin.toString(),
        cylMax: blank.cylMax.toString(),
        costPrice: blank.costPrice.toString(),
        sellingPrice: blank.sellingPrice.toString(),
        quantity: blank.quantity,
        fournisseur: blank.fournisseur || null,
        createdAt: blank.createdAt,
    }
}
