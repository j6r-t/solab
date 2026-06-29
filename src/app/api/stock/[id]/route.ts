import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productSchema } from '@/lib/validators'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const parsed = productSchema.partial().safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const product = await db.product.update({
            where: { id },
            data: parsed.data,
        })

        return NextResponse.json(product)
    } catch (error) {
        console.error('PATCH /api/stock/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await db.product.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/stock/[id] error:', error)
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}
