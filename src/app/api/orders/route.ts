import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateOrderNumber(): Promise<number> {
    return db.$transaction(async (tx) => {
        const last = await tx.order.findFirst({ orderBy: { orderNumber: 'desc' } })
        return (last?.orderNumber ?? 0) + 1
    })
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const status = searchParams.get('status') || ''
        const search = searchParams.get('search') || ''

        const where: Record<string, unknown> = {}
        if (status) where.status = status
        if (search) {
            where.client = {
                OR: [
                    { name: { contains: search } },
                    { familyName: { contains: search } },
                ],
            }
        }

        const orders = await db.order.findMany({
            where,
            include: {
                client: { select: { id: true, name: true, familyName: true, phone: true } },
                items: { include: { product: { select: { name: true, brand: true } } } },
                payments: true,
                repairs: { include: { repairService: true } },
                prescription: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        const result = orders.map((order) => {
            const totalPaid = order.payments.reduce((s, p) => s + parseFloat(p.amount.toString()), 0)
            const total = parseFloat(order.totalAmount.toString())
            return {
                ...order,
                totalAmount: total.toString(),
                payments: order.payments.map((p) => ({ ...p, amount: p.amount.toString() })),
                totalPaid: totalPaid.toString(),
                paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('GET /api/orders error:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { clientId, orderType, items, payments, repairs, prescriptionId, turnaroundDays } = body

        if (!clientId) {
            return NextResponse.json({ error: 'Client is required' }, { status: 400 })
        }

        const client = await db.client.findUnique({ where: { id: clientId } })
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        let totalAmount = 0
        const orderItemsData: { productId: string; quantity: number; unitPrice: number }[] = []

        if (items && items.length > 0) {
            for (const item of items) {
                const product = await db.product.findUnique({ where: { id: item.productId } })
                if (!product) {
                    return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 })
                }
                if (product.quantity < item.quantity) {
                    return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 })
                }
                const price = item.unitPrice || parseFloat(product.price.toString())
                totalAmount += price * item.quantity
                orderItemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice: price })
            }
        }

        const orderNumber = await generateOrderNumber()

        let repairTotal = 0
        if (repairs && repairs.length > 0) {
            for (const r of repairs) {
                repairTotal += r.price || 0
            }
        }

        totalAmount += repairTotal

        const order = await db.order.create({
            data: {
                orderNumber,
                clientId,
                totalAmount,
                orderType: orderType || 'standard',
                status: orderType === 'direct_sale' ? 'completed' : 'pending',
                prescriptionId: prescriptionId || null,
                turnaroundDays: turnaroundDays || null,
                items: orderItemsData.length > 0 ? { create: orderItemsData } : undefined,
                payments: payments && payments.length > 0
                    ? { create: payments.map((p: { amount: number; type: string }) => ({ amount: p.amount, type: p.type })) }
                    : undefined,
                repairs: repairs && repairs.length > 0
                    ? {
                        create: repairs.map((r: { type: string; price: number; expectedCompletionDate: string; repairServiceId?: string }) => ({
                            type: r.type,
                            price: r.price,
                            status: 'pending',
                            expectedCompletionDate: new Date(r.expectedCompletionDate),
                            repairServiceId: r.repairServiceId || null,
                        })),
                    }
                    : undefined,
            },
            include: {
                client: { select: { id: true, name: true, familyName: true, phone: true } },
                items: { include: { product: { select: { name: true, brand: true } } } },
                payments: true,
                repairs: { include: { repairService: true } },
                prescription: true,
            },
        })

        if (items && items.length > 0) {
            for (const item of items) {
                await db.product.update({
                    where: { id: item.productId },
                    data: { quantity: { decrement: item.quantity } },
                })
                await db.stockAdjustment.create({
                    data: { productId: item.productId, quantity: -item.quantity, reason: 'sale' },
                })
            }
        }

        return NextResponse.json(order, { status: 201 })
    } catch (error) {
        console.error('POST /api/orders error:', error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}
