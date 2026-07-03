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
                { specialization: { contains: search } },
            ]
        }
        const items = await db.doctor.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { prescriptions: true } } },
        })
        return NextResponse.json(items)
    } catch (error) {
        console.error('GET /api/doctors error:', error)
        return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, phone, address, specialization } = await request.json()
        const item = await db.doctor.create({ data: { name, phone: phone || '', address, specialization } })
        return NextResponse.json(item, { status: 201 })
    } catch (error) {
        console.error('POST /api/doctors error:', error)
        return NextResponse.json({ error: 'Failed to create doctor' }, { status: 500 })
    }
}
