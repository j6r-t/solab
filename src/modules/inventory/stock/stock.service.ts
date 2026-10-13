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

/**
 * Build search conditions for product filtering
 */
function buildSearchConditions(params: StockQuery): Prisma.ProductWhereInput[] {
    const conditions: Prisma.ProductWhereInput[] = []

    if (params.search) {
        conditions.push(
            { name: { contains: params.search } },
            { brand: { contains: params.search } },
            { model: { contains: params.search } },
        )
    }

    if (params.brand) {
        conditions.push({ brand: { contains: params.brand } })
    }

    return conditions
}

/**
 * Build exact match conditions for product filtering
 */
function buildExactMatchConditions(params: StockQuery): Prisma.ProductWhereInput {
    const conditions: Prisma.ProductWhereInput = {}

    if (params.category && (PRODUCT_CATEGORIES as readonly string[]).includes(params.category)) {
        conditions.category = params.category as ProductCategory
    }
    if (params.excludeCategory) {
        conditions.category = { not: params.excludeCategory as ProductCategory }
    }
    if (params.fournisseurId) {
        conditions.fournisseurId = params.fournisseurId
    }

    if (params.lensType) {
        conditions.lensType = params.lensType as LensType
    }

    if (params.material) {
        conditions.material = params.material as LensMaterial
    }

    if (params.coating) {
        conditions.coating = params.coating as LensCoating
    }

    return conditions
}

/**
 * Build range conditions for product filtering (sph, cyl, add)
 */
function buildRangeConditions(params: StockQuery): Prisma.ProductWhereInput {
    const conditions: Prisma.ProductWhereInput = {}

    const sphGte = params.sphFrom ? parseFloat(params.sphFrom) : NaN
    const sphLte = params.sphTo ? parseFloat(params.sphTo) : NaN
    if (!isNaN(sphGte) || !isNaN(sphLte)) {
        conditions.sph = { ...(isNaN(sphGte) ? {} : { gte: sphGte }), ...(isNaN(sphLte) ? {} : { lte: sphLte }) }
    }

    const cylGte = params.cylFrom ? parseFloat(params.cylFrom) : NaN
    const cylLte = params.cylTo ? parseFloat(params.cylTo) : NaN
    if (!isNaN(cylGte) || !isNaN(cylLte)) {
        conditions.cyl = { ...(isNaN(cylGte) ? {} : { gte: cylGte }), ...(isNaN(cylLte) ? {} : { lte: cylLte }) }
    }

    const addGte = params.addFrom ? parseFloat(params.addFrom) : NaN
    const addLte = params.addTo ? parseFloat(params.addTo) : NaN
    if (!isNaN(addGte) || !isNaN(addLte)) {
        conditions.add = { ...(isNaN(addGte) ? {} : { gte: addGte }), ...(isNaN(addLte) ? {} : { lte: addLte }) }
    }

    return conditions
}

/**
 * Build thickness condition for product filtering
 */
function buildThicknessCondition(params: StockQuery): Prisma.ProductWhereInput | undefined {
    if (params.thickness) {
        return { thickness: { contains: params.thickness } }
    }
    return undefined
}

/**
 * Build stock status condition for product filtering
 */
function buildStockStatusCondition(params: StockQuery): Prisma.ProductWhereInput | undefined {
    if (params.stockStatus === 'outOfStock') {
        return { quantity: 0 }
    } else if (params.stockStatus === 'lowStock') {
        return { quantity: { gt: 0, lte: STOCK_THRESHOLDS.lowStock } }
    } else if (params.stockStatus === 'inStock') {
        return { quantity: { gt: STOCK_THRESHOLDS.lowStock } }
    }
    return undefined
}

/**
 * List products with filtering support
 * - Search: name, brand, model (OR conditions)
 * - Brand: partial match
 * - Category: exact match or exclude
 * - Fournisseur: exact match
 * - Lens specs: exact match (type, material, coating)
 * - Thickness: partial match
 * - Ranges: sph, cyl, add (gte/lte)
 * - Stock status: outOfStock, lowStock, inStock
 */
export async function listProducts(params?: StockQuery) {
    const where: Prisma.ProductWhereInput = {}

    // Build search conditions (OR logic)
    const searchConditions = buildSearchConditions(params || {})
    if (searchConditions.length > 0) {
        where.OR = searchConditions
    }

    // Build exact match conditions
    const exactMatchConditions = buildExactMatchConditions(params || {})
    Object.assign(where, exactMatchConditions)

    // Build range conditions
    const rangeConditions = buildRangeConditions(params || {})
    Object.assign(where, rangeConditions)

    // Build thickness condition
    const thicknessCondition = buildThicknessCondition(params || {})
    if (thicknessCondition) {
        where.thickness = thicknessCondition.thickness
    }

    // Build stock status condition
    const stockStatusCondition = buildStockStatusCondition(params || {})
    if (stockStatusCondition) {
        Object.assign(where, stockStatusCondition)
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
