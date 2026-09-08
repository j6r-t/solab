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

    // When Rx filter is present, lens specs are soft (AND only if provided)
    // When no Rx filter, lens specs are strict (for inventory browsing)
    const hasRxFilter = params?.sphRight != null || params?.cylRight != null || params?.sphLeft != null || params?.cylLeft != null

    if (hasRxFilter) {
        // Rx match: only match on sph/cyl (lens specs are informational, shown in SearchSelect)
        const conditions: Prisma.LensBlankWhereInput[] = []
        const sphR = params?.sphRight != null ? parseFloat(params.sphRight) : null
        const cylR = params?.cylRight != null ? parseFloat(params.cylRight) : null
        const sphL = params?.sphLeft != null ? parseFloat(params.sphLeft) : null
        const cylL = params?.cylLeft != null ? parseFloat(params.cylLeft) : null

        if (sphR != null && cylR != null) {
            conditions.push({ AND: [{ sph: sphR }, { cyl: cylR }] })
        } else if (sphR != null) {
            conditions.push({ sph: sphR })
        }
        if (sphL != null && cylL != null) {
            conditions.push({ AND: [{ sph: sphL }, { cyl: cylL }] })
        } else if (sphL != null) {
            conditions.push({ sph: sphL })
        }

        if (conditions.length > 0) {
            where.OR = [...(where.OR || []), ...conditions]
        }
    } else {
        // No Rx filter: strict lens specs for inventory browsing
        if (params?.lensType) where.lensType = params.lensType as LensType
        if (params?.material) where.material = params.material as LensMaterial
        if (params?.coating) where.coating = params.coating as LensCoating
        if (params?.thickness) where.thickness = params.thickness
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
