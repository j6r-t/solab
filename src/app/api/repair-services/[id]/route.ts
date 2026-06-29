import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, defaultPrice } = body

        const existing = await db.repairService.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Repair service not found' }, { status: 404 })
        }

        const service = await db.repairService.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(defaultPrice !== undefined && { defaultPrice: parseFloat(defaultPrice) }),
            },
        })

        return NextResponse.json(service)
    } catch (error) {
        console.error('PATCH /api/repair-services/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update repair service' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params

        const existing = await db.repairService.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Repair service not found' }, { status: 404 })
        }

        const repairs = await db.repair.findFirst({ where: { repairServiceId: id } })
        if (repairs) {
            return NextResponse.json({ error: 'Cannot delete: service is linked to existing repairs' }, { status: 409 })
        }

        await db.repairService.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/repair-services/[id] error:', error)
        return NextResponse.json({ error: 'Failed to delete repair service' }, { status: 500 })
    }
}
