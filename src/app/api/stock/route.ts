import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productSchema } from '@/lib/validators'

const VALID_CATEGORIES = ['lunette', 'lentille', 'verre', 'accessory', 'nettoyant_lentilles', 'nettoyant_monture'] as const

// GET /api/stock?search=term&category=lunette&fournisseurId=xxx&stockStatus=inStock|lowStock|outOfStock&brand=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category') || ''
        const fournisseurId = searchParams.get('fournisseurId') || ''
        const stockStatus = searchParams.get('stockStatus') || ''
        const brand = searchParams.get('brand') || ''
        const lensType = searchParams.get('lensType') || ''

        const where: Record<string, unknown> = {}

        const orConditions: Record<string, unknown>[] = []

        if (search) {
            orConditions.push(
                { name: { contains: search } },
                { brand: { contains: search } },
                { model: { contains: search } },
            )
        }

        if (brand) {
            orConditions.push({ brand: { contains: brand } })
        }

        if (orConditions.length > 0) {
            where.OR = orConditions
        }

        if (category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
            where.category = category
        }

        if (fournisseurId) {
            where.fournisseurId = fournisseurId
        }

        if (lensType) {
            where.lensType = lensType
        }

        if (stockStatus === 'outOfStock') {
            where.quantity = 0
        } else if (stockStatus === 'lowStock') {
            where.quantity = { gt: 0, lte: 3 }
        } else if (stockStatus === 'inStock') {
            where.quantity = { gt: 3 }
        }

        const products = await db.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                fournisseur: { select: { id: true, name: true } },
                _count: { select: { orderItems: true } },
                qrcode: { select: { code: true } },
            },
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error('GET /api/stock error:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}

// POST /api/stock
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const parsed = productSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const product = await db.product.create({
            data: {
                ...parsed.data,
                brand: parsed.data.brand || '—',
                model: parsed.data.model || '—',
                qrcode: {
                    create: {
                        code: `SOPT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    },
                },
            },
        })

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        console.error('POST /api/stock error:', error)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}