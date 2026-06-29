import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendRepairReadySms } from '@/lib/sms'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()

        if (body.status === 'completed') {
            const repair = await db.repair.update({
                where: { id },
                data: { status: 'completed' },
            })
            await sendRepairReadySms(id)
            return NextResponse.json(repair)
        }

        if (body.status) {
            const repair = await db.repair.update({
                where: { id },
                data: { status: body.status },
            })
            return NextResponse.json(repair)
        }

        return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    } catch (error) {
        console.error('PATCH /api/repairs/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update repair' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await db.repair.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/repairs/[id] error:', error)
        return NextResponse.json({ error: 'Failed to delete repair' }, { status: 500 })
    }
}
