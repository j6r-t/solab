import type { LensBlankResponse } from '@/modules/inventory/lens-blanks/dtos/lens-blank.dto'
import type { Prisma } from '@prisma/client'

type Numeric = Prisma.Decimal | string | number | null

interface LensBlankInput {
    id: string
    brand: string
    lensType: string | null
    material: string | null
    coating: string | null
    thickness: string | null
    sph: Numeric
    cyl: Numeric
    costPrice: Numeric
    sellingPrice: Numeric
    priceAfterTax: Numeric | null
    quantity: number
    fournisseur?: { id: string; name: string } | null
    createdAt: Date
}

function toStr(val: Numeric): string {
    if (val == null) return '0'
    if (typeof val === 'string') return val
    if (typeof val === 'number') return val.toString()
    return String(val)
}

export function toLensBlankResponse(blank: LensBlankInput): LensBlankResponse {
    return {
        id: blank.id,
        brand: blank.brand,
        lensType: blank.lensType,
        material: blank.material,
        coating: blank.coating,
        thickness: blank.thickness,
        sph: toStr(blank.sph),
        cyl: toStr(blank.cyl),
        costPrice: toStr(blank.costPrice),
        sellingPrice: toStr(blank.sellingPrice),
        priceAfterTax: blank.priceAfterTax != null ? toStr(blank.priceAfterTax) : null,
        quantity: blank.quantity,
        fournisseur: blank.fournisseur || null,
        createdAt: blank.createdAt,
    }
}
