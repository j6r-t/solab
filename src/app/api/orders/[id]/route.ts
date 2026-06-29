import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const order = await db.order.findUnique({
            where: { id },
            include: {
                client: { select: { id: true, name: true, familyName: true, phone: true, address: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, brand: true, model: true, category: true } },
                    },
                },
                payments: { orderBy: { createdAt: 'asc' } },
                repairs: { include: { repairService: true } },
                prescription: true,
            },
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('GET /api/orders/[id] error:', error)
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()

        if (body.status === 'ready') {
            const order = await db.order.update({
                where: { id },
                data: { status: 'ready' },
            })
            return NextResponse.json(order)
        }

        if (body.status === 'completed') {
            const order = await db.order.update({
                where: { id },
                data: { status: 'completed' },
            })
            return NextResponse.json(order)
        }

        if (body.status === 'cancelled') {
            const order = await db.order.findUnique({
                where: { id },
                include: { items: true },
            })
            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 })
            }
            for (const item of order.items) {
                await db.product.update({
                    where: { id: item.productId },
                    data: { quantity: { increment: item.quantity } },
                })
            }
            const updated = await db.order.update({
                where: { id },
                data: { status: 'cancelled' },
            })
            return NextResponse.json(updated)
        }

        const { payments } = body
        if (payments && payments.length > 0) {
            for (const payment of payments) {
                await db.payment.create({
                    data: {
                        orderId: id,
                        amount: payment.amount,
                        type: payment.type,
                    },
                })
            }
            const order = await db.order.findUnique({
                where: { id },
                include: { payments: true },
            })
            if (order) {
                const totalPaid = order.payments.reduce((s, p) => s + parseFloat(p.amount.toString()), 0)
                if (totalPaid >= parseFloat(order.totalAmount.toString())) {
                    await db.order.update({ where: { id }, data: { status: 'completed', totalAmount: order.totalAmount } })
                }
            }
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'No valid updates' }, { status: 400 })
    } catch (error) {
        console.error('PATCH /api/orders/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const order = await db.order.findUnique({ where: { id }, include: { items: true } })
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
        for (const item of order.items) {
            await db.product.update({
                where: { id: item.productId },
                data: { quantity: { increment: item.quantity } },
            })
        }
        await db.order.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/orders/[id] error:', error)
        return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
    }
}
