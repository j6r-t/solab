import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { prescriptionSchema } from '@/lib/validators'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const parsed = prescriptionSchema.partial().safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const prescription = await db.prescription.update({
            where: { id },
            data: parsed.data,
        })

        return NextResponse.json(prescription)
    } catch (error) {
        console.error('PATCH /api/prescriptions/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await db.prescription.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/prescriptions/[id] error:', error)
        return NextResponse.json({ error: 'Failed to delete prescription' }, { status: 500 })
    }
}
