import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { name } = await request.json()
        const existing = await db.lensBrand.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const item = await db.lensBrand.update({ where: { id }, data: { name } })
        return NextResponse.json(item)
    } catch (error) {
        console.error('PATCH /api/lens-brands/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const existing = await db.lensBrand.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        await db.lensBrand.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/lens-brands/[id] error:', error)
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
