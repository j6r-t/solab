import { clientRepo, productRepo, repairRepo, orderRepo, lensBlankRepo, opticianShopRepo, repairServiceRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'

function getDateRange(period: string) {
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
    return { startDate, now }
}

export async function getReports(period: string, entity: string) {
    const { startDate, now } = getDateRange(period)
    const dateFilter = period !== 'all' ? { createdAt: { gte: startDate } } : {}
    const completedDateFilter = period !== 'all' ? { createdAt: { gte: startDate } } : {}

    if (entity === 'atelier') {
        return getAtelierReports(period, startDate, dateFilter, now)
    }

    return getShopReports(period, startDate, dateFilter, completedDateFilter, now)
}

async function getAtelierReports(period: string, startDate: Date, dateFilter: any, now: Date) {
    const [
        totalLensBlanks,
        lowStockLensBlanks,
        totalWorkOrders,
        pendingWorkOrders,
        completedWorkOrders,
        totalOpticianShops,
        workOrdersByShop,
        monthlyWorkOrders,
        recentWorkOrders,
    ] = await Promise.all([
        lensBlankRepo.count(),
        lensBlankRepo.count({ where: { quantity: { lte: 5 } } }),
        repairRepo.count({ where: { ...dateFilter } }),
        repairRepo.count({ where: { status: 'pending', ...dateFilter } }),
        repairRepo.count({ where: { status: 'completed', ...dateFilter } }),
        opticianShopRepo.count(),
        (async () => {
            const workOrders = await db.atelierWorkOrder.findMany({
                where: { ...dateFilter },
                include: { opticianShop: { select: { name: true } } },
            })
            const map: Record<string, number> = {}
            for (const wo of workOrders) {
                const name = wo.opticianShop?.name || 'Unknown'
                map[name] = (map[name] || 0) + 1
            }
            return Object.entries(map)
                .map(([shopName, count]) => ({ shopName, count }))
                .sort((a, b) => b.count - a.count)
        })(),
        (async () => {
            const since = new Date(now.getFullYear(), now.getMonth() - 11, 1)
            const all = await db.atelierWorkOrder.findMany({
                where: { createdAt: { gte: since } },
                select: { createdAt: true },
            })
            const map: Record<string, number> = {}
            for (const wo of all) {
                const key = `${wo.createdAt.getFullYear()}-${String(wo.createdAt.getMonth() + 1).padStart(2, '0')}`
                map[key] = (map[key] || 0) + 1
            }
            const months: { month: string; count: number }[] = []
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                months.push({ month: key, count: map[key] || 0 })
            }
            return months
        })(),
        repairRepo.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: period === 'all' ? {} : { createdAt: { gte: startDate } },
            include: {
                opticianShop: { select: { name: true } },
                order: { select: { orderNumber: true } },
            },
        }),
    ])

    return {
        totalLensBlanks,
        lowStockLensBlanks,
        totalWorkOrders,
        pendingWorkOrders,
        completedWorkOrders,
        totalOpticianShops,
        workOrdersByShop,
        monthlyWorkOrders,
        recentWorkOrders: recentWorkOrders.map((wo: any) => ({
            id: wo.id,
            orderNumber: wo.order?.orderNumber || '—',
            opticianShop: wo.opticianShop?.name || '—',
            status: wo.status,
            source: wo.source,
            type: wo.type,
            createdAt: wo.createdAt,
        })),
        period,
    }
}

async function getShopReports(period: string, startDate: Date, dateFilter: any, completedDateFilter: any, now: Date) {
    const [
        totalClients,
        totalProducts,
        lowStockCount,
        pendingRepairs,
        totalOrders,
        revenueAgg,
        revenueByType,
        ordersByStatus,
        newClients,
    ] = await Promise.all([
        clientRepo.count(),
        productRepo.count(),
        productRepo.count({ where: { quantity: { lte: 3 } } }),
        repairRepo.count({ where: { status: 'pending' } }),
        orderRepo.count({ where: { ...dateFilter } }),
        orderRepo.aggregate({
            where: { status: 'completed', ...completedDateFilter },
            _sum: { totalAmount: true },
        }),
        Promise.all([
            orderRepo.aggregate({ where: { status: 'completed', orderType: 'standard', ...completedDateFilter }, _sum: { totalAmount: true } }),
            orderRepo.aggregate({ where: { status: 'completed', orderType: 'remounting', ...completedDateFilter }, _sum: { totalAmount: true } }),
            orderRepo.aggregate({ where: { status: 'completed', orderType: 'direct_sale', ...completedDateFilter }, _sum: { totalAmount: true } }),
        ]),
        (async () => {
            const [pending, completed, cancelled] = await Promise.all([
                orderRepo.count({ where: { status: 'pending', ...dateFilter } }),
                orderRepo.count({ where: { status: 'completed', ...dateFilter } }),
                orderRepo.count({ where: { status: 'cancelled', ...dateFilter } }),
            ])
            return { pending, completed, cancelled }
        })(),
        clientRepo.count({ where: { createdAt: { gte: startDate } } }),
    ])

    const totalRevenue = Number(revenueAgg._sum?.totalAmount || 0)
    const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0

    const [orderItems, nonCompletedOrders, recentOrders, topProductsData, monthlyData] = await Promise.all([
        db.orderItem.findMany({
            where: { order: { status: 'completed', ...completedDateFilter } },
            include: { product: { select: { costPrice: true, name: true, brand: true, model: true } } },
        }),
        db.order.findMany({
            where: { status: { not: 'completed' }, ...dateFilter },
            include: { payments: true },
        }),
        orderRepo.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: period === 'all' ? {} : { createdAt: { gte: startDate } },
            include: {
                client: { select: { name: true, familyName: true } },
                payments: true,
            },
        }),
        (async () => {
            const raw = await db.orderItem.groupBy({
                by: ['productId'],
                where: { order: { status: 'completed', ...completedDateFilter } },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
            })
            const ids = raw.map(r => r.productId).filter((id): id is string => id != null)
            if (ids.length === 0) return {}
            const products = await db.product.findMany({
                where: { id: { in: ids } },
                select: { id: true, name: true, brand: true, model: true, category: true, costPrice: true, price: true },
            })
            const productMap = new Map(products.map(p => [p.id, p]))
            const byCategory: Record<string, { productId: string; name: string; brand: string; model: string; quantity: number; price: string; costPrice: string | null }[]> = {}
            for (const r of raw) {
                const p = productMap.get(r.productId)
                if (!p) continue
                const cat = p.category || 'uncategorized'
                if (!byCategory[cat]) byCategory[cat] = []
                byCategory[cat].push({
                    productId: r.productId,
                    name: p.name || '',
                    brand: p.brand || '',
                    model: p.model || '',
                    quantity: r._sum.quantity || 0,
                    price: p.price?.toString() || '0',
                    costPrice: p.costPrice?.toString() || null,
                })
            }
            for (const cat of Object.keys(byCategory)) {
                byCategory[cat].sort((a, b) => b.quantity - a.quantity)
                byCategory[cat] = byCategory[cat].slice(0, 5)
            }
            return byCategory
        })(),
        (async () => {
            const since = new Date(now.getFullYear(), now.getMonth() - 11, 1)
            const all = await db.order.findMany({
                where: { status: 'completed', createdAt: { gte: since } },
                select: { totalAmount: true, createdAt: true },
            })
            const map: Record<string, number> = {}
            for (const o of all) {
                const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`
                map[key] = (map[key] || 0) + Number(o.totalAmount)
            }
            const months: { month: string; revenue: number }[] = []
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                months.push({ month: key, revenue: map[key] || 0 })
            }
            return months
        })(),
    ])

    const totalCost = orderItems.reduce((sum, item) => {
        const cost = item.product?.costPrice
        if (cost) return sum + Number(cost) * item.quantity
        return sum
    }, 0)
    const totalProfit = totalRevenue - totalCost

    const outstandingBalance = nonCompletedOrders.reduce((sum, order) => {
        const paid = order.payments.reduce((s, p) => s + Number(p.amount), 0)
        return sum + (Number(order.totalAmount) - paid)
    }, 0)

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
        totalRevenue: totalRevenue.toString(),
        revenueByType: {
            standard: revenueByType[0]._sum.totalAmount?.toString() || '0',
            remounting: revenueByType[1]._sum.totalAmount?.toString() || '0',
            direct_sale: revenueByType[2]._sum.totalAmount?.toString() || '0',
        },
        ordersByStatus,
        recentOrders: ordersWithPaymentStatus,
        period,
        newClients,
        avgOrderValue: avgOrderValue.toString(),
        totalProfit: totalProfit.toString(),
        totalCost: totalCost.toString(),
        outstandingBalance: outstandingBalance.toString(),
        topProductsByCategory: topProductsData,
        monthlyRevenue: monthlyData,
    }
}
