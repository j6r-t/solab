import { Prisma, LensType, LensMaterial, LensCoating, LensBlankAdjustmentReason } from '@prisma/client'
import { lensBlankRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { NotFoundError } from '@/lib/errors'
import { LOW_STOCK_MAX_QTY } from '@/lib/constants/kpi'

export async function listLensBlanks(params?: { search?: string; brand?: string; lensType?: string; material?: string; coating?: string; thickness?: string; lowStock?: string; sphRight?: string; cylRight?: string; sphLeft?: string; cylLeft?: string }) {
    const where: Prisma.LensBlankWhereInput = {}
    if (params?.search) {
        where.OR = [
            { brand: { contains: params.search } },
            { thickness: { contains: params.search } },
        ]
    }
    if (params?.brand) where.brand = params.brand
    if (params?.lowStock === 'true') where.quantity = { lte: LOW_STOCK_MAX_QTY }

    // Per-eye Rx match: exact sph/cyl equality per eye, OR-combined across eyes.
    const rxConditions: Prisma.LensBlankWhereInput[] = []
    const sphR = params?.sphRight != null ? parseFloat(params.sphRight) : null
    const cylR = params?.cylRight != null ? parseFloat(params.cylRight) : null
    const sphL = params?.sphLeft != null ? parseFloat(params.sphLeft) : null
    const cylL = params?.cylLeft != null ? parseFloat(params.cylLeft) : null

    if (sphR != null && cylR != null) {
        rxConditions.push({ AND: [{ sph: sphR }, { cyl: cylR }] })
    } else if (sphR != null) {
        rxConditions.push({ sph: sphR })
    }
    if (sphL != null && cylL != null) {
        rxConditions.push({ AND: [{ sph: sphL }, { cyl: cylL }] })
    } else if (sphL != null) {
        rxConditions.push({ sph: sphL })
    }

    // Attribute filters (type/material/coating/thickness) AND over the eye matches:
    // (eye1 matches OR eye2 matches) AND lensType AND material AND coating AND thickness.
    const attributeConditions: Prisma.LensBlankWhereInput[] = []
    if (params?.lensType) attributeConditions.push({ lensType: params.lensType as LensType })
    if (params?.material) attributeConditions.push({ material: params.material as LensMaterial })
    if (params?.coating) attributeConditions.push({ coating: params.coating as LensCoating })
    if (params?.thickness) attributeConditions.push({ thickness: params.thickness })

    if (rxConditions.length > 0) {
        // Rx mode (order form): attributes filter the Rx-matching blanks instead of being ignored.
        where.AND = [{ OR: rxConditions }, ...attributeConditions]
    } else {
        // No Rx filter: strict lens specs for inventory browsing.
        for (const cond of attributeConditions) {
            Object.assign(where, cond)
        }
    }

    return lensBlankRepo.findMany({
        where,
        include: { fournisseur: { select: { id: true, name: true } } },
        orderBy: [{ brand: 'asc' }, { thickness: 'asc' }],
    })
}

export async function getLensBlank(id: string) {
    const blank = await lensBlankRepo.findUnique({
        where: { id },
        include: { fournisseur: { select: { id: true, name: true } } },
    })
    if (!blank) throw new NotFoundError('Lens blank not found')
    return blank
}

export async function createLensBlank(data: {
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sph: number
    cyl: number
    costPrice: number
    sellingPrice: number
    priceAfterTax?: number | null
    quantity?: number
    fournisseurId?: string
}) {
    return lensBlankRepo.create({
        data: {
            brand: data.brand,
            lensType: data.lensType as LensType,
            material: data.material as LensMaterial,
            coating: data.coating as LensCoating,
            thickness: data.thickness,
            sph: data.sph,
            cyl: data.cyl,
            costPrice: data.costPrice,
            sellingPrice: data.sellingPrice,
            priceAfterTax: data.priceAfterTax ?? null,
            quantity: data.quantity || 0,
            fournisseurId: data.fournisseurId || null,
        },
        include: { fournisseur: { select: { id: true, name: true } } },
    })
}

export async function updateLensBlank(id: string, data: Partial<{
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sph: number
    cyl: number
    costPrice: number
    sellingPrice: number
    priceAfterTax: number | null
    quantity: number
    fournisseurId: string | null
}>) {
    const existing = await lensBlankRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Lens blank not found')
    const updateData: Prisma.LensBlankUncheckedUpdateInput = {}
    if (data.brand !== undefined) updateData.brand = data.brand
    if (data.lensType !== undefined) updateData.lensType = data.lensType as LensType
    if (data.material !== undefined) updateData.material = data.material as LensMaterial
    if (data.coating !== undefined) updateData.coating = data.coating as LensCoating
    if (data.thickness !== undefined) updateData.thickness = data.thickness
    if (data.sph !== undefined) updateData.sph = data.sph
    if (data.cyl !== undefined) updateData.cyl = data.cyl
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice
    if (data.sellingPrice !== undefined) updateData.sellingPrice = data.sellingPrice
    if (data.priceAfterTax !== undefined) updateData.priceAfterTax = data.priceAfterTax
    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.fournisseurId !== undefined) updateData.fournisseurId = data.fournisseurId
    return lensBlankRepo.update({
        where: { id },
        data: updateData,
        include: { fournisseur: { select: { id: true, name: true } } },
    })
}

export async function adjustLensBlankStock(id: string, quantity: number, reason: string, workOrderId?: string) {
    const blank = await lensBlankRepo.findUnique({ where: { id } })
    if (!blank) throw new NotFoundError('Lens blank not found')
    const newQty = blank.quantity + quantity
    if (newQty < 0) throw new Error('Insufficient stock')

    await db.lensBlankAdjustment.create({
        data: {
            lensBlankId: id,
            quantity,
            reason: reason as LensBlankAdjustmentReason,
            workOrderId: workOrderId || null,
        },
    })
    return lensBlankRepo.update({
        where: { id },
        data: { quantity: newQty },
        include: { fournisseur: { select: { id: true, name: true } } },
    })
}

export async function deleteLensBlank(id: string) {
    await lensBlankRepo.delete({ where: { id } })
}
