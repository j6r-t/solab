import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const status = searchParams.get('status') || ''
        const search = searchParams.get('search') || ''

        const where: Record<string, unknown> = { repairServiceId: { not: null } }
        if (status) where.status = status
        if (search) {
            where.order = {
                client: {
                    OR: [
                        { name: { contains: search } },
                        { familyName: { contains: search } },
                    ],
                },
            }
        }

        const repairs = await db.repair.findMany({
            where,
            include: {
                repairService: true,
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        client: { select: { id: true, name: true, familyName: true, phone: true } },
                    },
                },
            },
            orderBy: { expectedCompletionDate: 'asc' },
        })

        return NextResponse.json(repairs)
    } catch (error) {
        console.error('GET /api/repairs error:', error)
        return NextResponse.json({ error: 'Failed to fetch repairs' }, { status: 500 })
    }
}
