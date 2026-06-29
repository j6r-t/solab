import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const items = await db.lensCatalogue.findMany({ orderBy: { name: 'asc' } })
        return NextResponse.json(items)
    } catch (error) {
        console.error('GET /api/lens-catalogue error:', error)
        return NextResponse.json({ error: 'Failed to fetch lens types' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name } = await request.json()
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        const item = await db.lensCatalogue.create({ data: { name } })
        return NextResponse.json(item, { status: 201 })
    } catch (error) {
        console.error('POST /api/lens-catalogue error:', error)
        return NextResponse.json({ error: 'Failed to create lens type' }, { status: 500 })
    }
}
