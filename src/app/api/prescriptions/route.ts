import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { prescriptionSchema } from '@/lib/validators'

// GET /api/prescriptions?clientId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const clientId = searchParams.get('clientId') || ''

        const where: Record<string, unknown> = {}
        if (clientId) {
            where.clientId = clientId
        }

        const prescriptions = await db.prescription.findMany({
            where,
            include: { client: { select: { name: true, familyName: true, phone: true } } },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(prescriptions)
    } catch (error) {
        console.error('GET /api/prescriptions error:', error)
        return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 })
    }
}

// POST /api/prescriptions
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const parsed = prescriptionSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const prescription = await db.prescription.create({
            data: parsed.data,
        })

        return NextResponse.json(prescription, { status: 201 })
    } catch (error) {
        console.error('POST /api/prescriptions error:', error)
        return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 })
    }
}