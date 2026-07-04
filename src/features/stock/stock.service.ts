import { productRepo } from '@/lib/database/repositories'
import { Prisma } from '@prisma/client'
import { PRODUCT_CATEGORIES, QR_CODE_PREFIX, STOCK_THRESHOLDS } from '@/lib/constants'

interface StockQuery {
    search?: string
    category?: string
    fournisseurId?: string
    stockStatus?: string
    brand?: string
    lensType?: string
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
        where.category = params.category as any
    }
    if (params?.fournisseurId) {
        where.fournisseurId = params.fournisseurId
    }

    if (params?.lensType) {
        where.lensType = params.lensType as any
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

    return productRepo.create({
        data: {
            ...data,
            category: data.category || 'lunette',
            brand: data.brand || '—',
            model: data.model || '—',
            qrcode: { create: { code } },
        } as any,
    })
}

export async function updateProduct(id: string, data: Partial<{
    name: string
    price: number
    quantity: number
    category: string
    brand: string
    model: string
    lensType: string
    fournisseurId: string
}>) {
    return productRepo.update({ where: { id }, data: data as any })
}

export async function deleteProduct(id: string) {
    await productRepo.delete({ where: { id } })
}
