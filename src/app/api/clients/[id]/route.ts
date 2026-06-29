import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clientSchema } from '@/lib/validators'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const parsed = clientSchema.partial().safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const client = await db.client.update({
            where: { id },
            data: parsed.data,
        })

        return NextResponse.json(client)
    } catch (error) {
        console.error('PATCH /api/clients/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await db.client.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/clients/[id] error:', error)
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }
}
