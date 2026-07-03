import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const status = searchParams.get('status') || ''
        const search = searchParams.get('search') || ''
        const start = searchParams.get('start') || ''
        const end = searchParams.get('end') || ''

        const where: Record<string, unknown> = {}
        if (status) where.status = status
        if (start && end) {
            where.createdAt = { gte: new Date(start), lte: new Date(end) }
        }
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
                client: { select: { id: true, name: true, familyName: true, phone: true, address: true } },
                items: { include: { product: { select: { id: true, name: true, brand: true, model: true, category: true } } } },
                payments: { orderBy: { createdAt: 'asc' } },
                repairs: { include: { repairService: true } },
                prescription: { include: { doctor: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        })

        const result = orders.map((order) => {
            const totalPaid = order.payments.reduce((s, p) => s + parseFloat(p.amount.toString()), 0)
            const total = parseFloat(order.totalAmount.toString())
            return {
                id: order.id,
                orderNumber: order.orderNumber,
                client: order.client,
                totalAmount: total.toString(),
                totalPaid: totalPaid.toString(),
                balance: (total - totalPaid).toFixed(3),
                paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
                status: order.status,
                orderType: order.orderType,
                createdAt: order.createdAt,
                items: order.items.map((i) => ({
                    productName: i.product.name,
                    brand: i.product.brand,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice.toString(),
                })),
                payments: order.payments.map((p) => ({
                    amount: p.amount.toString(),
                    type: p.type,
                    createdAt: p.createdAt,
                })),
                repairs: order.repairs.map((r) => ({
                    type: r.type,
                    price: r.price.toString(),
                })),
                turnaroundDays: order.turnaroundDays,
                prescription: order.prescription
                    ? {
                          sphRight: order.prescription.sphRight.toString(),
                          cylRight: order.prescription.cylRight.toString(),
                          axisRight: order.prescription.axisRight,
                          addRight: order.prescription.addRight.toString(),
                          pdRight: order.prescription.pdRight,
                          sphLeft: order.prescription.sphLeft.toString(),
                          cylLeft: order.prescription.cylLeft.toString(),
                          axisLeft: order.prescription.axisLeft,
                          addLeft: order.prescription.addLeft.toString(),
                          pdLeft: order.prescription.pdLeft,
                          dateWritten: order.prescription.dateWritten,
                          doctorName: order.prescription.doctor?.name || null,
                      }
                    : null,
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('GET /api/billing error:', error)
        return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 })
    }
}
