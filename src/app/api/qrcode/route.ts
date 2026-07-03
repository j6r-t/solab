import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const code = request.nextUrl.searchParams.get('code')
        if (!code) {
            return NextResponse.json({ error: 'QR code parameter is required' }, { status: 400 })
        }

        const qrcode = await db.qRCode.findUnique({
            where: { code },
            include: {
                product: {
                    include: {
                        fournisseur: { select: { id: true, name: true } },
                        _count: { select: { orderItems: true } },
                    },
                },
            },
        })

        if (!qrcode || !qrcode.product) {
            return NextResponse.json({ error: 'Product not found for this QR code' }, { status: 404 })
        }

        return NextResponse.json(qrcode.product)
    } catch (error) {
        console.error('GET /api/qrcode error:', error)
        return NextResponse.json({ error: 'Failed to look up QR code' }, { status: 500 })
    }
}
