import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { name, phone, address } = await request.json()
        const existing = await db.fournisseur.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: 'Fournisseur not found' }, { status: 404 })
        const item = await db.fournisseur.update({ where: { id }, data: { name, phone, address } })
        return NextResponse.json(item)
    } catch (error) {
        console.error('PATCH /api/fournisseurs/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update fournisseur' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const existing = await db.fournisseur.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: 'Fournisseur not found' }, { status: 404 })
        await db.fournisseur.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/fournisseurs/[id] error:', error)
        return NextResponse.json({ error: 'Failed to delete fournisseur' }, { status: 500 })
    }
}
