import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const search = searchParams.get('search') || ''
        const where: Record<string, unknown> = {}
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { phone: { contains: search } },
            ]
        }
        const items = await db.fournisseur.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { products: true } } },
        })
        return NextResponse.json(items)
    } catch (error) {
        console.error('GET /api/fournisseurs error:', error)
        return NextResponse.json({ error: 'Failed to fetch fournisseurs' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, phone, address } = await request.json()
        const item = await db.fournisseur.create({ data: { name, phone: phone || '', address } })
        return NextResponse.json(item, { status: 201 })
    } catch (error) {
        console.error('POST /api/fournisseurs error:', error)
        return NextResponse.json({ error: 'Failed to create fournisseur' }, { status: 500 })
    }
}
