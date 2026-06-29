import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clientSchema } from '@/lib/validators'

// GET /api/clients?search=term
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const search = searchParams.get('search') || ''
        const gender = searchParams.get('gender') || ''

        const where: Record<string, unknown> = {}
        if (gender) where.gender = gender
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { familyName: { contains: search } },
                { phone: { contains: search } },
            ]
        }

        const clients = await db.client.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(clients)
    } catch (error) {
        console.error('GET /api/clients error:', error)
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }
}

// POST /api/clients
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const parsed = clientSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        // Check if phone already exists
        const existing = await db.client.findUnique({
            where: { phone: parsed.data.phone },
        })

        if (existing) {
            return NextResponse.json(
                { error: { phone: ['A client with this phone number already exists'] } },
                { status: 409 }
            )
        }

        const client = await db.client.create({
            data: parsed.data,
        })

        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        console.error('POST /api/clients error:', error)
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }
}