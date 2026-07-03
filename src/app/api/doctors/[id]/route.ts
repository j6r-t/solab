import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { name, phone, address, specialization } = await request.json()
        const existing = await db.doctor.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
        const item = await db.doctor.update({ where: { id }, data: { name, phone, address, specialization } })
        return NextResponse.json(item)
    } catch (error) {
        console.error('PATCH /api/doctors/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update doctor' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const existing = await db.doctor.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
        await db.doctor.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/doctors/[id] error:', error)
        return NextResponse.json({ error: 'Failed to delete doctor' }, { status: 500 })
    }
}
