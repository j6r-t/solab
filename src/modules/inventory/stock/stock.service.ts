import { productRepo } from '@/lib/database/repositories'
import { Prisma, ProductCategory, LensType, LensMaterial, LensCoating } from '@prisma/client'
import { PRODUCT_CATEGORIES, QR_CODE_PREFIX, STOCK_THRESHOLDS } from '@/lib/constants'
import { auditService } from '@/modules/system/audit'

interface StockQuery {
    search?: string
    category?: string
    fournisseurId?: string
    stockStatus?: string
    brand?: string
    lensType?: string
    material?: string
    coating?: string
    thickness?: string
    sphFrom?: string
    sphTo?: string
    cylFrom?: string
    cylTo?: string
    addFrom?: string
    addTo?: string
    excludeCategory?: string
}

export async function listProducts(params?: StockQuery) {
    const where: Prisma.ProductWhereInput = {}
    const orConditions: Prisma.ProductWhereInput[] = []

    if (params?.search) {
        orConditions.push(
            { name: { contains: params.search } },
            { brand: { contains: params.search } },
            { model: { contains: params.search } },
        )
    }

    if (params?.brand) {
        orConditions.push({ brand: { contains: params.brand } })
    }

    if (orConditions.length > 0) {
        where.OR = orConditions
    }

    if (params?.category && (PRODUCT_CATEGORIES as readonly string[]).includes(params.category)) {
        where.category = params.category as ProductCategory
    }
    if (params?.excludeCategory) {
        where.category = { not: params.excludeCategory as ProductCategory }
    }
    if (params?.fournisseurId) {
        where.fournisseurId = params.fournisseurId
    }

    if (params?.lensType) {
        where.lensType = params.lensType as LensType
    }

    if (params?.material) {
        where.material = params.material as LensMaterial
    }

    if (params?.coating) {
        where.coating = params.coating as LensCoating
    }

    if (params?.thickness) {
        where.thickness = { contains: params.thickness }
    }

    const sphGte = params?.sphFrom ? parseFloat(params.sphFrom) : NaN
    const sphLte = params?.sphTo ? parseFloat(params.sphTo) : NaN
    if (!isNaN(sphGte) || !isNaN(sphLte)) {
        where.sph = { ...(isNaN(sphGte) ? {} : { gte: sphGte }), ...(isNaN(sphLte) ? {} : { lte: sphLte }) }
    }

    const cylGte = params?.cylFrom ? parseFloat(params.cylFrom) : NaN
    const cylLte = params?.cylTo ? parseFloat(params.cylTo) : NaN
    if (!isNaN(cylGte) || !isNaN(cylLte)) {
        where.cyl = { ...(isNaN(cylGte) ? {} : { gte: cylGte }), ...(isNaN(cylLte) ? {} : { lte: cylLte }) }
    }

    const addGte = params?.addFrom ? parseFloat(params.addFrom) : NaN
    const addLte = params?.addTo ? parseFloat(params.addTo) : NaN
    if (!isNaN(addGte) || !isNaN(addLte)) {
        where.add = { ...(isNaN(addGte) ? {} : { gte: addGte }), ...(isNaN(addLte) ? {} : { lte: addLte }) }
    }

    if (params?.stockStatus === 'outOfStock') {
        where.quantity = 0
    } else if (params?.stockStatus === 'lowStock') {
        where.quantity = { gt: 0, lte: STOCK_THRESHOLDS.lowStock }
    } else if (params?.stockStatus === 'inStock') {
        where.quantity = { gt: STOCK_THRESHOLDS.lowStock }
    }

    return productRepo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            fournisseur: { select: { id: true, name: true } },
            _count: { select: { orderItems: true } },
            qrcode: { select: { code: true } },
        },
    })
}

export async function createProduct(data: {
    name: string
    price: number
    quantity: number
    category?: string
    brand?: string | null
    model?: string | null
    lensType?: string | null
    fournisseurId?: string | null
}) {
    const code = `${QR_CODE_PREFIX}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const product = await productRepo.create({
        data: {
            name: data.name,
            price: data.price,
            quantity: data.quantity,
            category: (data.category || 'lunette') as ProductCategory,
            brand: data.brand || '—',
            model: data.model || '—',
            lensType: data.lensType as LensType | null,
            fournisseurId: data.fournisseurId || null,
            qrcode: { create: { code } },
        },
    })
    await auditService.log({ action: 'PRODUCT_CREATED', entityType: 'PRODUCT', entityId: product.id, metadata: { name: data.name, quantity: data.quantity } })
    return product
}

export async function updateProduct(id: string, data: Partial<{
    name: string
    price: number
    quantity: number
    category: ProductCategory
    brand: string
    model: string
    lensType: LensType
    fournisseurId: string
}>) {
    const result = await productRepo.update({ where: { id }, data })
    await auditService.log({ action: 'PRODUCT_UPDATED', entityType: 'PRODUCT', entityId: id })
    return result
}

export async function deleteProduct(id: string) {
    await productRepo.delete({ where: { id } })
    await auditService.log({ action: 'PRODUCT_DELETED', entityType: 'PRODUCT', entityId: id })
}
