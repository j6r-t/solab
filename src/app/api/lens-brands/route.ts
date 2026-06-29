import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const items = await db.lensBrand.findMany({ orderBy: { name: 'asc' } })
        return NextResponse.json(items)
    } catch (error) {
        console.error('GET /api/lens-brands error:', error)
        return NextResponse.json({ error: 'Failed to fetch lens brands' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name } = await request.json()
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        const item = await db.lensBrand.create({ data: { name } })
        return NextResponse.json(item, { status: 201 })
    } catch (error) {
        console.error('POST /api/lens-brands error:', error)
        return NextResponse.json({ error: 'Failed to create lens brand' }, { status: 500 })
    }
}
