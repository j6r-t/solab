import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productSchema } from '@/lib/validators'

// GET /api/stock?search=term&category=eyewear
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category') || ''

        const where: Record<string, unknown> = {}

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { brand: { contains: search } },
                { model: { contains: search } },
            ]
        }

        if (category) {
            where.category = category
        }

        const products = await db.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
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