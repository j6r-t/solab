import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const period = searchParams.get('period') || 'month'

        const now = new Date()
        let startDate: Date
        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                break
            case 'week':
                startDate = new Date(now)
                startDate.setDate(now.getDate() - now.getDay())
                startDate.setHours(0, 0, 0, 0)
                break
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                break
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1)
                break
            default:
                startDate = new Date(0)
        }

        const dateFilter = period !== 'all' ? { createdAt: { gte: startDate } } : {}

        const [
            totalClients,
            totalProducts,
            lowStockCount,
            pendingRepairs,
            totalOrders,
            revenueAgg,
            revenueByType,
            ordersByStatus,
        ] = await Promise.all([
            db.client.count(),
            db.product.count(),
            db.product.count({ where: { quantity: { lte: 3 } } }),
            db.repair.count({ where: { status: 'pending' } }),
            db.order.count({ where: { ...dateFilter } }),
            db.order.aggregate({
                where: { status: 'completed', ...dateFilter },
                _sum: { totalAmount: true },
            }),
            Promise.all([
                db.order.aggregate({
                    where: { status: 'completed', orderType: 'standard', ...dateFilter },
                    _sum: { totalAmount: true },
                }),
                db.order.aggregate({
                    where: { status: 'completed', orderType: 'remounting', ...dateFilter },
                    _sum: { totalAmount: true },
                }),
                db.order.aggregate({
                    where: { status: 'completed', orderType: 'direct_sale', ...dateFilter },
                    _sum: { totalAmount: true },
                }),
            ]),
            (async () => {
                const pending = await db.order.count({ where: { status: 'pending', ...dateFilter } })
                const completed = await db.order.count({ where: { status: 'completed', ...dateFilter } })
                const cancelled = await db.order.count({ where: { status: 'cancelled', ...dateFilter } })
                return { pending, completed, cancelled }
            })(),
        ])

        const recentOrders = await db.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: period === 'all' ? {} : { createdAt: { gte: startDate } },
            include: {
                client: { select: { name: true, familyName: true } },
                payments: true,
            },
        })

        const ordersWithPaymentStatus = recentOrders.map((order) => {
            const totalPaid = order.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
            const total = parseFloat(order.totalAmount.toString())
            return {
                id: order.id,
                orderNumber: order.orderNumber,
                clientName: `${order.client.name} ${order.client.familyName}`,
                totalAmount: order.totalAmount.toString(),
                paidAmount: totalPaid.toString(),
                status: order.status,
                paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
                createdAt: order.createdAt,
            }
        })

        return NextResponse.json({
            totalClients,
            totalProducts,
            lowStockCount,
            totalOrders: period === 'all' ? totalOrders : totalOrders,
            todayOrders: totalOrders,
            pendingRepairs,
            totalRevenue: revenueAgg._sum.totalAmount?.toString() || '0',
            revenueByType: {
                standard: revenueByType[0]._sum.totalAmount?.toString() || '0',
                remounting: revenueByType[1]._sum.totalAmount?.toString() || '0',
                direct_sale: revenueByType[2]._sum.totalAmount?.toString() || '0',
            },
            ordersByStatus,
            recentOrders: ordersWithPaymentStatus,
            period,
        })
    } catch (error) {
        console.error('GET /api/reports error:', error)
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}
