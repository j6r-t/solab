import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const services = await db.repairService.findMany({ orderBy: { name: 'asc' } })
        return NextResponse.json(services)
    } catch (error) {
        console.error('GET /api/repair-services error:', error)
        return NextResponse.json({ error: 'Failed to fetch repair services' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, defaultPrice } = body

        if (!name || defaultPrice === undefined) {
            return NextResponse.json({ error: 'Name and default price are required' }, { status: 400 })
        }

        const service = await db.repairService.create({
            data: { name, defaultPrice: parseFloat(defaultPrice) },
        })

        return NextResponse.json(service, { status: 201 })
    } catch (error) {
        console.error('POST /api/repair-services error:', error)
        return NextResponse.json({ error: 'Failed to create repair service' }, { status: 500 })
    }
}
