import { clientRepo, productRepo, repairRepo, orderRepo } from '@/lib/database/repositories'

export async function getReports(period: string) {
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
        clientRepo.count(),
        productRepo.count(),
        productRepo.count({ where: { quantity: { lte: 3 } } }),
        repairRepo.count({ where: { status: 'pending' } }),
        orderRepo.count({ where: { ...dateFilter } }),
        orderRepo.aggregate({
            where: { status: 'completed', ...dateFilter },
            _sum: { totalAmount: true },
        }),
        Promise.all([
            orderRepo.aggregate({ where: { status: 'completed', orderType: 'standard', ...dateFilter }, _sum: { totalAmount: true } }),
            orderRepo.aggregate({ where: { status: 'completed', orderType: 'remounting', ...dateFilter }, _sum: { totalAmount: true } }),
            orderRepo.aggregate({ where: { status: 'completed', orderType: 'direct_sale', ...dateFilter }, _sum: { totalAmount: true } }),
        ]),
        (async () => {
            const [pending, completed, cancelled] = await Promise.all([
                orderRepo.count({ where: { status: 'pending', ...dateFilter } }),
                orderRepo.count({ where: { status: 'completed', ...dateFilter } }),
                orderRepo.count({ where: { status: 'cancelled', ...dateFilter } }),
            ])
            return { pending, completed, cancelled }
        })(),
    ])

    const recentOrders: any[] = await orderRepo.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: period === 'all' ? {} : { createdAt: { gte: startDate } },
        include: {
            client: { select: { name: true, familyName: true } },
            payments: true,
        },
    })

    const ordersWithPaymentStatus = recentOrders.map((order: any) => {
        const totalPaid = order.payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0)
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

    return {
        totalClients,
        totalProducts,
        lowStockCount,
        totalOrders,
        todayOrders: totalOrders,
        pendingRepairs,
        totalRevenue: revenueAgg._sum?.totalAmount?.toString() || '0',
        revenueByType: {
            standard: revenueByType[0]._sum.totalAmount?.toString() || '0',
            remounting: revenueByType[1]._sum.totalAmount?.toString() || '0',
            direct_sale: revenueByType[2]._sum.totalAmount?.toString() || '0',
        },
        ordersByStatus,
        recentOrders: ordersWithPaymentStatus,
        period,
    }
}
