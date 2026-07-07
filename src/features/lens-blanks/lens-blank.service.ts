import { lensBlankRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { NotFoundError } from '@/errors'

export async function listLensBlanks(params?: { search?: string; brand?: string; lensType?: string; material?: string; coating?: string; thickness?: string; lowStock?: string }) {
    const where: any = {}
    if (params?.search) {
        where.OR = [
            { brand: { contains: params.search } },
            { thickness: { contains: params.search } },
        ]
    }
    if (params?.brand) where.brand = params.brand
    if (params?.lensType) where.lensType = params.lensType
    if (params?.material) where.material = params.material
    if (params?.coating) where.coating = params.coating
    if (params?.thickness) where.thickness = params.thickness
    if (params?.lowStock === 'true') where.quantity = { lte: 3 }

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
    sphMin: number
    sphMax: number
    cylMin: number
    cylMax: number
    costPrice: number
    sellingPrice: number
    quantity?: number
    fournisseurId?: string
}) {
    return lensBlankRepo.create({
        data: {
            brand: data.brand,
            lensType: data.lensType as any,
            material: data.material as any,
            coating: data.coating as any,
            thickness: data.thickness,
            sphMin: data.sphMin,
            sphMax: data.sphMax,
            cylMin: data.cylMin,
            cylMax: data.cylMax,
            costPrice: data.costPrice,
            sellingPrice: data.sellingPrice,
            quantity: data.quantity || 0,
            fournisseurId: data.fournisseurId || null,
        },
        include: { fournisseur: { select: { id: true, name: true } } },
    })
}

export async function updateLensBlank(id: string, data: any) {
    const existing = await lensBlankRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Lens blank not found')
    const updateData: any = {}
    if (data.brand !== undefined) updateData.brand = data.brand
    if (data.lensType !== undefined) updateData.lensType = data.lensType
    if (data.material !== undefined) updateData.material = data.material
    if (data.coating !== undefined) updateData.coating = data.coating
    if (data.thickness !== undefined) updateData.thickness = data.thickness
    if (data.sphMin !== undefined) updateData.sphMin = data.sphMin
    if (data.sphMax !== undefined) updateData.sphMax = data.sphMax
    if (data.cylMin !== undefined) updateData.cylMin = data.cylMin
    if (data.cylMax !== undefined) updateData.cylMax = data.cylMax
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
            reason: reason as any,
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
