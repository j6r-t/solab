import { clientRepo, productRepo, repairRepo, orderRepo, lensBlankRepo, opticianShopRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'

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

async function getAtelierDecisionStats(period: string, startDate: Date, dateFilter: Prisma.AtelierWorkOrderWhereInput, now: Date) {
    const completedTurnaroundWhere: Prisma.AtelierWorkOrderWhereInput = {
        status: 'completed',
        startedAt: { not: null },
        ...(period === 'all' ? { completedAt: { not: null } } : { completedAt: { gte: startDate } }),
    }
    const adjustmentDateFilter = period === 'all' ? {} : { createdAt: { gte: startDate } }

    const [
        backlogOrders,
        completedWorkOrders,
        adjustmentGroups,
        billGroups,
        lowStockBlanks,
        lowStockBlanksCount,
    ] = await Promise.all([
        db.atelierWorkOrder.findMany({
            where: { status: { in: ['pending', 'in_progress'] }, ...dateFilter },
            select: { status: true, createdAt: true },
        }),
        db.atelierWorkOrder.findMany({
            where: completedTurnaroundWhere,
            select: { startedAt: true, completedAt: true },
        }),
        db.lensBlankAdjustment.groupBy({
            by: ['reason'],
            where: {
                reason: { in: ['used_in_mounting', 'broken_during_mounting'] },
                ...adjustmentDateFilter,
            },
            _sum: { quantity: true },
        }),
        db.opticianShopBill.groupBy({
            by: ['opticianShopId'],
            where: period === 'all' ? {} : { createdAt: { gte: startDate } },
            _sum: { totalAmount: true },
        }),
        lensBlankRepo.findMany({
            where: { quantity: { lte: 3 } },
            orderBy: { quantity: 'asc' },
            take: 5,
            select: { id: true, brand: true, thickness: true, sph: true, cyl: true, quantity: true },
        }),
        lensBlankRepo.count({ where: { quantity: { lte: 3 } } }),
    ])

    let pending = 0
    let inProgress = 0
    let backlogAgeMs = 0
    for (const wo of backlogOrders) {
        if (wo.status === 'pending') pending++
        else inProgress++
        backlogAgeMs += now.getTime() - wo.createdAt.getTime()
    }
    const workload = {
        pending,
        inProgress,
        avgAgeDays: backlogOrders.length > 0 ? Math.round((backlogAgeMs / backlogOrders.length / 86400000) * 10) / 10 : 0,
    }

    let turnaroundMs = 0
    let turnaroundCount = 0
    for (const wo of completedWorkOrders) {
        if (wo.startedAt && wo.completedAt) {
            turnaroundMs += wo.completedAt.getTime() - wo.startedAt.getTime()
            turnaroundCount++
        }
    }
    const avgTurnaroundDays = turnaroundCount > 0 ? Math.round((turnaroundMs / turnaroundCount / 86400000) * 10) / 10 : 0

    const usedInMounting = Math.abs(Number(adjustmentGroups.find((g) => g.reason === 'used_in_mounting')?._sum.quantity ?? 0))
    const brokenDuringMounting = Math.abs(Number(adjustmentGroups.find((g) => g.reason === 'broken_during_mounting')?._sum.quantity ?? 0))
    const breakageRate = usedInMounting + brokenDuringMounting > 0
        ? Math.round((brokenDuringMounting / (usedInMounting + brokenDuringMounting)) * 1000) / 10
        : 0

    const sortedBillGroups = [...billGroups]
        .sort((a, b) => Number(b._sum.totalAmount ?? 0) - Number(a._sum.totalAmount ?? 0))
        .slice(0, 5)
    const billShops = sortedBillGroups.length > 0
        ? await opticianShopRepo.findMany({
            where: { id: { in: sortedBillGroups.map((g) => g.opticianShopId) } },
            select: { id: true, name: true },
        })
        : []
    const shopNameById = new Map(billShops.map((s) => [s.id, s.name]))
    const revenueByOptician = sortedBillGroups.map((g) => ({
        shopId: g.opticianShopId,
        shopName: shopNameById.get(g.opticianShopId) || '—',
        total: Number(g._sum.totalAmount ?? 0).toString(),
    }))

    const lensBlanksLowStock = {
        count: lowStockBlanksCount,
        items: lowStockBlanks.map((b) => ({
            id: b.id,
            label: `${b.brand} ${b.thickness} (${Number(b.sph)}/${Number(b.cyl)})`,
            quantity: b.quantity,
        })),
    }

    return { workload, avgTurnaroundDays, breakageRate, revenueByOptician, lensBlanksLowStock }
}

async function getAtelierReports(period: string, startDate: Date, dateFilter: Prisma.AtelierWorkOrderWhereInput, now: Date) {
    const [
        totalLensBlanks,
        lowStockLensBlanks,
        totalWorkOrders,
        pendingWorkOrders,
        completedWorkOrders,
        totalOpticianShops,
        totalRevenue,
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
            const result = await db.atelierWorkOrder.aggregate({
                where: { status: 'completed', ...dateFilter },
                _sum: { servicePrice: true, lensBlankPrice: true },
            })
            const service = result._sum.servicePrice ? parseFloat(result._sum.servicePrice.toString()) : 0
            const blanks = result._sum.lensBlankPrice ? parseFloat(result._sum.lensBlankPrice.toString()) : 0
            return service + blanks
        })(),
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

    const decisionStats = await getAtelierDecisionStats(period, startDate, dateFilter, now)

    return {
        totalLensBlanks,
        lowStockLensBlanks,
        totalWorkOrders,
        pendingWorkOrders,
        completedWorkOrders,
        totalOpticianShops,
        totalRevenue,
        workOrdersByShop,
        monthlyWorkOrders,
        recentWorkOrders: recentWorkOrders.map((wo) => ({
            id: wo.id,
            orderNumber: wo.order?.orderNumber || '—',
            opticianShop: wo.opticianShop?.name || '—',
            status: wo.status,
            source: wo.source,
            createdAt: wo.createdAt,
        })),
        ...decisionStats,
        period,
    }
}

async function getShopDecisionStats(period: string, startDate: Date, dateFilter: Prisma.OrderWhereInput, now: Date, outstandingBalance: string) {
    const since90 = new Date(now)
    since90.setDate(since90.getDate() - 90)
    const periodCompletedWhere: Prisma.OrderWhereInput = { status: 'completed', ...dateFilter }
    const pendingInstrumentWhere: Prisma.ChequeWhereInput = {
        entityType: 'client_payment',
        status: { in: ['pending', 'deposited', 'overdue'] },
        payments: { some: {} },
    }

    const [
        clientGroups,
        periodPayments,
        pendingChequesAgg,
        overdueChequesAgg,
        outOfStockCount,
        lowStockExact,
        recentlySoldItems,
        productStock,
        periodOrderCount,
        earliestOrder,
    ] = await Promise.all([
        db.order.groupBy({
            by: ['clientId'],
            where: periodCompletedWhere,
            _sum: { totalAmount: true },
            _count: { _all: true },
        }),
        db.payment.findMany({
            where: { order: periodCompletedWhere },
            select: { amount: true, method: true, cheque: { select: { status: true } } },
        }),
        db.cheque.aggregate({ where: pendingInstrumentWhere, _sum: { amount: true } }),
        db.cheque.aggregate({ where: { ...pendingInstrumentWhere, dueDate: { lt: now } }, _sum: { amount: true } }),
        productRepo.count({ where: { quantity: { lte: 0 } } }),
        productRepo.count({ where: { quantity: { gt: 0, lte: 3 } } }),
        db.orderItem.findMany({
            where: { order: { status: 'completed', createdAt: { gte: since90 } }, productId: { not: null } },
            distinct: ['productId'],
            select: { productId: true },
        }),
        productRepo.findMany({ select: { id: true, quantity: true, costPrice: true } }),
        orderRepo.count({ where: { ...dateFilter } }),
        period === 'all'
            ? db.order.findMany({ orderBy: { createdAt: 'asc' }, take: 1, select: { createdAt: true } })
            : Promise.resolve([] as { createdAt: Date }[]),
    ])

    const sortedClientGroups = [...clientGroups]
        .sort((a, b) => Number(b._sum.totalAmount ?? 0) - Number(a._sum.totalAmount ?? 0))
        .slice(0, 5)
    const topClientRecords = sortedClientGroups.length > 0
        ? await clientRepo.findMany({
            where: { id: { in: sortedClientGroups.map((g) => g.clientId) } },
            select: { id: true, name: true, familyName: true },
        })
        : []
    const clientNameById = new Map(topClientRecords.map((c) => [c.id, `${c.name} ${c.familyName}`]))
    const topClients = sortedClientGroups.map((g) => ({
        clientId: g.clientId,
        name: clientNameById.get(g.clientId) || '—',
        totalSpent: Number(g._sum.totalAmount ?? 0).toString(),
        ordersCount: g._count?._all ?? 0,
    }))

    let cash = 0
    let card = 0
    let instruments = 0
    for (const p of periodPayments) {
        if (!p.method || p.method === 'cash') cash += Number(p.amount)
        else if (p.method === 'card') card += Number(p.amount)
        else if (p.cheque?.status === 'cashed') instruments += Number(p.amount)
    }

    const activeClients = clientGroups.length
    const repeatCount = clientGroups.filter((g) => (g._count?._all ?? 0) >= 2).length
    const repeatClients = activeClients > 0 ? Math.round((repeatCount / activeClients) * 1000) / 10 : 0

    const soldProductIds = new Set(recentlySoldItems.map((r) => r.productId))
    let deadStock = 0
    let stockValue = 0
    for (const p of productStock) {
        stockValue += p.quantity * (p.costPrice ? Number(p.costPrice) : 0)
        if (p.quantity > 0 && !soldProductIds.has(p.id)) deadStock++
    }

    const windowStart = period === 'all' ? (earliestOrder[0]?.createdAt ?? now) : startDate
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - windowStart.getTime()) / 86400000))
    const dailyAvgSales = Math.round((periodOrderCount / daysElapsed) * 10) / 10

    return {
        topClients,
        salesByPaymentMethod: { cash: cash.toString(), card: card.toString(), instruments: instruments.toString() },
        receivables: {
            outstanding: outstandingBalance,
            pendingInstruments: Number(pendingChequesAgg._sum.amount ?? 0).toString(),
            overdueInstruments: Number(overdueChequesAgg._sum.amount ?? 0).toString(),
        },
        stockHealth: { outOfStock: outOfStockCount, lowStock: lowStockExact, deadStock, stockValue: stockValue.toString() },
        repeatClients,
        dailyAvgSales,
    }
}

async function getShopReports(period: string, startDate: Date, dateFilter: Prisma.OrderWhereInput, completedDateFilter: Prisma.OrderWhereInput, now: Date) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthWindow: Prisma.OrderWhereInput = { createdAt: { gte: monthStart } }
    const todayWindow: Prisma.OrderWhereInput = { createdAt: { gte: todayStart } }
    const monthRevenueWindow: Prisma.OrderWhereInput = { status: 'completed', ...monthWindow }

    const [
        totalClients,
        totalProducts,
        lowStockCount,
        pendingRepairs,
        totalOrders,
        todayOrders,
        revenueAgg,
        revenueByType,
        ordersByStatus,
        newClients,
    ] = await Promise.all([
        clientRepo.count(),
        productRepo.count(),
        productRepo.count({ where: { quantity: { lte: 3 } } }),
        repairRepo.count({ where: { status: 'pending' } }),
        orderRepo.count({ where: { ...monthWindow } }),
        orderRepo.count({ where: { ...todayWindow } }),
        orderRepo.aggregate({
            where: { ...monthRevenueWindow },
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
            where: { order: { status: 'completed', ...monthWindow } },
            include: { product: { select: { costPrice: true, name: true, brand: true, model: true } } },
        }),
        db.order.findMany({
            where: { status: { not: 'completed' }, ...dateFilter },
            include: { payments: { include: { cheque: true } } },
        }),
        orderRepo.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: period === 'all' ? {} : { createdAt: { gte: startDate } },
            include: {
                client: { select: { name: true, familyName: true } },
                payments: { include: { cheque: true } },
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
                if (!r.productId) continue
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
        const paid = effectivePaymentTotal(order.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })), 'client')
        return sum + (Number(order.totalAmount) - paid)
    }, 0)

    const decisionStats = await getShopDecisionStats(period, startDate, dateFilter, now, outstandingBalance.toString())

    const ordersWithPaymentStatus = recentOrders.map((order) => {
        const payments = order.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque }))
        const totalPaid = effectivePaymentTotal(payments, 'client')
        const pendingAmount = pendingInstrumentTotal(payments, 'client')
        const total = parseFloat(order.totalAmount.toString())
        return {
            id: order.id,
            orderNumber: order.orderNumber,
            clientName: `${order.client.name} ${order.client.familyName}`,
            totalAmount: order.totalAmount.toString(),
            paidAmount: totalPaid.toString(),
            pendingAmount: pendingAmount.toString(),
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
        todayOrders,
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
        ...decisionStats,
    }
}
