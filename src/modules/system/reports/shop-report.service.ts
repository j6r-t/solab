import { clientRepo, productRepo, repairRepo, orderRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'
import {
    COLLECTIONS_WINDOW_MONTHS,
    DAY_MS,
    DORMANT_CLIENT_MONTHS,
    LOW_STOCK_MAX_QTY,
    MONTHLY_TREND_MONTHS,
    ORDER_VALUE_BUCKETS,
    PARETO_TOP_DECILE,
    RECOMMENDED_TOP_LIST_SIZE,
    RESTOCK_LIST_MAX_QTY,
    RESTOCK_LIST_SIZE,
    REPEAT_CLIENT_MIN_ORDERS,
    SALES_VELOCITY_WEEKS,
    SALES_VELOCITY_WINDOW_DAYS,
    TOP_LIST_SIZE,
} from '@/lib/constants/kpi'
import {
    addDays,
    changePct,
    getPeriodRange,
    inWindow,
    lastNMonthStarts,
    monthKey,
    round1,
} from './report-shared'
import type { PeriodWindow } from './report-shared'

const SPH_BANDS = ['≤ −6', '−6..−4', '−4..−2', '−2..0', '0..+2', '+2..+4', '≥ +4']
const CYL_BANDS = ['0..−1', '−1..−2', '< −2']

interface ProductStockRow {
    id: string
    quantity: number
    category: string | null
    costPrice: Prisma.Decimal | null
}

function round2(n: number): number {
    return Math.round(n * 100) / 100
}

function sphBandIndex(v: number): number {
    if (v <= -6) return 0
    if (v <= -4) return 1
    if (v <= -2) return 2
    if (v <= 0) return 3
    if (v <= 2) return 4
    if (v <= 4) return 5
    return 6
}

function cylBandIndex(v: number): number {
    const m = Math.abs(v)
    if (m <= 1) return 0
    if (m <= 2) return 1
    return 2
}

function itemsCost(items: { quantity: number; product: { costPrice: Prisma.Decimal | null } | null }[]): number {
    let cost = 0
    for (const it of items) {
        if (it.product?.costPrice) cost += Number(it.product.costPrice) * it.quantity
    }
    return cost
}

// ───────────────────────────────
// Shop
// ───────────────────────────────

export async function getShopDecisionStats(
    current: PeriodWindow | null,
    startDate: Date,
    now: Date,
    outstandingBalance: string,
    totalOrders: number,
    products: ProductStockRow[],
    soldUnitsByProduct: Map<string, number>,
) {
    const dateFilter: Prisma.OrderWhereInput = current ? { createdAt: { gte: current.start } } : {}
    const periodCompletedWhere: Prisma.OrderWhereInput = { status: 'completed', ...dateFilter }
    const pendingInstrumentWhere: Prisma.ChequeWhereInput = {
        entityType: 'client_payment',
        status: { in: ['pending', 'deposited', 'overdue'] },
        payments: { some: {} },
    }
    const sinceCollections = new Date(now.getFullYear(), now.getMonth() - (COLLECTIONS_WINDOW_MONTHS - 1), 1)

    const [
        clientGroups,
        periodPayments,
        pendingChequesAgg,
        overdueChequesAgg,
        earliestOrder,
        collectionCheques,
        supplierInvoices,
        supplierConsolidatedInvoices,
        fournisseurs,
        dormantGroups,
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
        current
            ? Promise.resolve([] as { createdAt: Date }[])
            : db.order.findMany({ orderBy: { createdAt: 'asc' }, take: 1, select: { createdAt: true } }),
        db.cheque.findMany({
            where: { entityType: 'client_payment', status: { in: ['cashed', 'bounced'] }, createdAt: { gte: sinceCollections } },
            select: { status: true, createdAt: true, updatedAt: true },
        }),
        db.purchaseInvoice.findMany({
            select: {
                fournisseurId: true,
                date: true,
                totalAmount: true,
                groupedIntoId: true,
                payments: { select: { amount: true, method: true, cheque: { select: { status: true } } } },
            },
        }),
        db.supplierConsolidatedInvoice.findMany({
            select: {
                fournisseurId: true,
                totalAmount: true,
                payments: { select: { amount: true, method: true, cheque: { select: { status: true } } } },
            },
        }),
        db.fournisseur.findMany({ select: { id: true, name: true } }),
        db.order.groupBy({
            by: ['clientId'],
            where: { status: 'completed' },
            _max: { createdAt: true },
            _sum: { totalAmount: true },
            _count: { _all: true },
        }),
    ])

    const sortedClientGroups = [...clientGroups]
        .sort((a, b) => Number(b._sum.totalAmount ?? 0) - Number(a._sum.totalAmount ?? 0))
        .slice(0, TOP_LIST_SIZE)
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

    const dormantSince = new Date(now.getFullYear(), now.getMonth() - DORMANT_CLIENT_MONTHS, now.getDate())
    const dormantEligible = dormantGroups
        .filter((g) => g._max.createdAt !== null && g._max.createdAt < dormantSince)
        .map((g) => ({
            clientId: g.clientId,
            lastOrderAt: g._max.createdAt as Date,
            totalSpent: Number(g._sum.totalAmount ?? 0),
            ordersCount: g._count?._all ?? 0,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, RECOMMENDED_TOP_LIST_SIZE)
    const dormantRecords = dormantEligible.length > 0
        ? await clientRepo.findMany({
            where: { id: { in: dormantEligible.map((g) => g.clientId) } },
            select: { id: true, name: true, familyName: true, phone: true },
        })
        : []
    const dormantClientById = new Map(dormantRecords.map((c) => [c.id, c]))
    const dormantClients = dormantEligible.map((g) => {
        const c = dormantClientById.get(g.clientId)
        return {
            clientId: g.clientId,
            name: c ? `${c.name} ${c.familyName}` : '—',
            phone: c?.phone || '—',
            lastOrderDate: g.lastOrderAt.toISOString(),
            totalSpent: g.totalSpent.toString(),
            ordersCount: g.ordersCount,
        }
    })

    let cash = 0
    let card = 0
    let instruments = 0
    for (const p of periodPayments) {
        if (!p.method || p.method === 'cash') cash += Number(p.amount)
        else if (p.method === 'card') card += Number(p.amount)
        else if (p.cheque?.status === 'cashed') instruments += Number(p.amount)
    }

    const activeClients = clientGroups.length
    const repeatCount = clientGroups.filter((g) => (g._count?._all ?? 0) >= REPEAT_CLIENT_MIN_ORDERS).length
    const repeatClients = activeClients > 0 ? Math.round((repeatCount / activeClients) * 1000) / 10 : 0

    let deadStock = 0
    let stockValue = 0
    for (const p of products) {
        stockValue += p.quantity * (p.costPrice ? Number(p.costPrice) : 0)
        if (p.quantity > 0 && !soldUnitsByProduct.has(p.id)) deadStock++
    }

    const windowStart = current ? current.start : (earliestOrder[0]?.createdAt ?? now)
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - windowStart.getTime()) / DAY_MS))
    const dailyAvgSales = Math.round((totalOrders / daysElapsed) * 10) / 10

    const spendRanking = clientGroups.map((g) => Number(g._sum.totalAmount ?? 0)).sort((a, b) => b - a)
    const totalSpend = spendRanking.reduce((s, v) => s + v, 0)
    const topCount = Math.max(1, Math.floor(spendRanking.length * PARETO_TOP_DECILE))
    const topSpend = spendRanking.slice(0, topCount).reduce((s, v) => s + v, 0)
    const pareto = {
        topDecileSharePct: totalSpend > 0 ? round1((topSpend / totalSpend) * 100) : 0,
        activeClients,
    }

    let cashedCount = 0
    let bouncedCount = 0
    let cashedDaysSum = 0
    for (const ch of collectionCheques) {
        if (ch.status === 'cashed') {
            cashedCount++
            cashedDaysSum += (ch.updatedAt.getTime() - ch.createdAt.getTime()) / DAY_MS
        } else {
            bouncedCount++
        }
    }
    const collections = {
        avgDaysToCash: cashedCount > 0 ? round1(cashedDaysSum / cashedCount) : 0,
        bounceRate: cashedCount + bouncedCount > 0 ? round1((bouncedCount / (cashedCount + bouncedCount)) * 100) : 0,
        cashedCount,
        bouncedCount,
    }

    const supplierAgg = new Map<string, { purchases: number; outstanding: number }>()
    for (const inv of supplierInvoices) {
        const s = supplierAgg.get(inv.fournisseurId) || { purchases: 0, outstanding: 0 }
        // Phase 4: a grouped source invoice carries no debt of its own — its
        // outstanding moved into the supplier consolidated invoice (counted
        // below). Purchases totals are unchanged by grouping.
        if (!inv.groupedIntoId) {
            const paid = effectivePaymentTotal(
                inv.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
                'supplier'
            )
            s.outstanding += Math.max(0, Number(inv.totalAmount) - paid)
        }
        if (inWindow(inv.date, current)) s.purchases += Number(inv.totalAmount)
        supplierAgg.set(inv.fournisseurId, s)
    }
    for (const invoice of supplierConsolidatedInvoices) {
        const s = supplierAgg.get(invoice.fournisseurId) || { purchases: 0, outstanding: 0 }
        const paid = effectivePaymentTotal(
            invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
            'supplier'
        )
        s.outstanding += Math.max(0, Number(invoice.totalAmount) - paid)
        supplierAgg.set(invoice.fournisseurId, s)
    }
    const fournisseurNameById = new Map(fournisseurs.map((f) => [f.id, f.name]))
    const supplierBalances = [...supplierAgg.entries()]
        .map(([fournisseurId, s]) => ({
            fournisseurId,
            name: fournisseurNameById.get(fournisseurId) || '—',
            purchases: s.purchases.toString(),
            outstanding: s.outstanding.toString(),
        }))
        .sort((a, b) => Number(b.outstanding) - Number(a.outstanding) || Number(b.purchases) - Number(a.purchases))
        .slice(0, RECOMMENDED_TOP_LIST_SIZE)

    return {
        topClients,
        dormantClients,
        salesByPaymentMethod: { cash: cash.toString(), card: card.toString(), instruments: instruments.toString() },
        receivables: {
            outstanding: outstandingBalance,
            pendingInstruments: Number(pendingChequesAgg._sum.amount ?? 0).toString(),
            overdueInstruments: Number(overdueChequesAgg._sum.amount ?? 0).toString(),
        },
        stockHealth: {
            outOfStock: products.filter((p) => p.quantity <= 0).length,
            lowStock: products.filter((p) => p.quantity > 0 && p.quantity <= LOW_STOCK_MAX_QTY).length,
            deadStock,
            stockValue: stockValue.toString(),
        },
        repeatClients,
        dailyAvgSales,
        pareto,
        collections,
        supplierBalances,
    }
}

export async function getShopReports(period: string, now: Date) {
    const range = getPeriodRange(period, now)
    const current = range.current
    const startDate = current?.start ?? new Date(0)
    const dateFilter: Prisma.OrderWhereInput = current ? { createdAt: { gte: current.start } } : {}
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    // Sold-units window shared by dead-stock detection and weeks-of-cover velocity (SALES_VELOCITY_WINDOW_DAYS = DEAD_STOCK_WINDOW_DAYS = 90)
    const since90 = addDays(now, -SALES_VELOCITY_WINDOW_DAYS)
    const todayWindow: Prisma.OrderWhereInput = { createdAt: { gte: todayStart } }
    const prevCreatedAt = range.previous ? { gte: range.previous.start, lt: range.previous.end ?? now } : null

    const [
        totalClients,
        totalProducts,
        lowStockCount,
        pendingRepairs,
        totalOrders,
        todayOrders,
        revenueTypeGroups,
        ordersByStatus,
        newClients,
        periodCompletedOrders,
        heatmapOrders,
        firstCompletedGroups,
        marginItems,
        soldSince90Groups,
        products,
        monthlyRows,
        restockProducts,
    ] = await Promise.all([
        clientRepo.count(),
        productRepo.count(),
        productRepo.count({ where: { quantity: { lte: LOW_STOCK_MAX_QTY } } }),
        repairRepo.count({ where: { status: 'pending' } }),
        orderRepo.count({ where: dateFilter }),
        orderRepo.count({ where: todayWindow }),
        db.order.groupBy({
            by: ['orderType'],
            where: { status: 'completed', ...dateFilter },
            _sum: { totalAmount: true },
        }),
        (async () => {
            const [pending, completed, cancelled] = await Promise.all([
                orderRepo.count({ where: { status: 'pending', ...dateFilter } }),
                orderRepo.count({ where: { status: 'completed', ...dateFilter } }),
                orderRepo.count({ where: { status: 'cancelled', ...dateFilter } }),
            ])
            return { pending, completed, cancelled }
        })(),
        current ? clientRepo.count({ where: { createdAt: { gte: current.start } } }) : clientRepo.count(),
        db.order.findMany({
            where: { status: 'completed', ...dateFilter },
            select: {
                clientId: true,
                totalAmount: true,
                createdAt: true,
                prescription: {
                    select: {
                        doctorId: true,
                        sphRight: true,
                        cylRight: true,
                        sphLeft: true,
                        cylLeft: true,
                        doctor: { select: { name: true } },
                    },
                },
            },
        }),
        db.order.findMany({
            where: { status: { not: 'cancelled' }, ...dateFilter },
            select: { createdAt: true },
        }),
        db.order.groupBy({
            by: ['clientId'],
            where: { status: 'completed' },
            _min: { createdAt: true },
        }),
        db.orderItem.findMany({
            where: { order: { status: 'completed', ...dateFilter } },
            select: {
                quantity: true,
                unitPrice: true,
                product: { select: { category: true, costPrice: true } },
            },
        }),
        db.orderItem.groupBy({
            by: ['productId'],
            where: { order: { status: 'completed', createdAt: { gte: since90 } }, productId: { not: null } },
            _sum: { quantity: true },
        }),
        productRepo.findMany({ select: { id: true, quantity: true, category: true, costPrice: true } }),
        (async () => {
            const since = new Date(now.getFullYear(), now.getMonth() - (MONTHLY_TREND_MONTHS - 1), 1)
            return db.order.findMany({
                where: { status: 'completed', createdAt: { gte: since } },
                select: {
                    totalAmount: true,
                    createdAt: true,
                    items: { select: { quantity: true, product: { select: { costPrice: true } } } },
                },
            })
        })(),
        productRepo.findMany({
            where: { quantity: { lte: RESTOCK_LIST_MAX_QTY } },
            orderBy: { quantity: 'asc' },
            take: RESTOCK_LIST_SIZE,
            select: {
                id: true,
                name: true,
                brand: true,
                category: true,
                quantity: true,
                fournisseur: { select: { name: true } },
            },
        }),
    ])

    // Previous-period data for deltas (empty for 'all')
    type PrevCompletedOrderRow = {
        clientId: string
        totalAmount: Prisma.Decimal
        items: { quantity: number; product: { costPrice: Prisma.Decimal | null } | null }[]
    }
    const [prevCompletedOrders, prevOrdersCount, prevNewClients] = prevCreatedAt
        ? await Promise.all([
            db.order.findMany({
                where: { status: 'completed', createdAt: prevCreatedAt },
                select: {
                    clientId: true,
                    totalAmount: true,
                    items: { select: { quantity: true, product: { select: { costPrice: true } } } },
                },
            }),
            orderRepo.count({ where: { createdAt: prevCreatedAt } }),
            clientRepo.count({ where: { createdAt: prevCreatedAt } }),
        ])
        : [[] as PrevCompletedOrderRow[], 0, 0] as const

    // ── period KPIs from completed orders
    let totalRevenue = 0
    const bucketCounts = { lt200: 0, '200to500': 0, '500to1000': 0, gt1000: 0 }
    const ordersByClient = new Map<string, { total: number; createdAt: Date }[]>()
    const doctorStats = new Map<string, { name: string; orders: number; revenue: number }>()
    const sphCounts = [0, 0, 0, 0, 0, 0, 0]
    const cylCounts = [0, 0, 0]

    for (const order of periodCompletedOrders) {
        const amount = Number(order.totalAmount)
        totalRevenue += amount
        if (amount < ORDER_VALUE_BUCKETS[0]) bucketCounts.lt200++
        else if (amount < ORDER_VALUE_BUCKETS[1]) bucketCounts['200to500']++
        else if (amount < ORDER_VALUE_BUCKETS[2]) bucketCounts['500to1000']++
        else bucketCounts.gt1000++
        const list = ordersByClient.get(order.clientId) || []
        list.push({ total: amount, createdAt: order.createdAt })
        ordersByClient.set(order.clientId, list)
        const rx = order.prescription
        if (rx?.doctorId && rx.doctor) {
            const d = doctorStats.get(rx.doctorId) || { name: rx.doctor.name, orders: 0, revenue: 0 }
            d.orders++
            d.revenue += amount
            doctorStats.set(rx.doctorId, d)
        }
        if (rx) {
            sphCounts[sphBandIndex(Number(rx.sphRight))]++
            sphCounts[sphBandIndex(Number(rx.sphLeft))]++
            cylCounts[cylBandIndex(Number(rx.cylRight))]++
            cylCounts[cylBandIndex(Number(rx.cylLeft))]++
        }
    }

    const orderValueBuckets = [
        { bucket: 'lt200' as const, count: bucketCounts.lt200 },
        { bucket: '200to500' as const, count: bucketCounts['200to500'] },
        { bucket: '500to1000' as const, count: bucketCounts['500to1000'] },
        { bucket: 'gt1000' as const, count: bucketCounts.gt1000 },
    ]

    const doctorRanking = [...doctorStats.entries()]
        .map(([doctorId, d]) => ({ doctorId, name: d.name, orders: d.orders, revenue: d.revenue.toString() }))
        .sort((a, b) => Number(b.revenue) - Number(a.revenue))
        .slice(0, RECOMMENDED_TOP_LIST_SIZE)

    const powerDemand = {
        sphBands: SPH_BANDS.map((band, i) => ({ band, count: sphCounts[i] })),
        cylBands: CYL_BANDS.map((band, i) => ({ band, count: cylCounts[i] })),
    }

    // revenueSplit: an order is 'new' if it is the client's first completed order ever
    const firstCompletedAt = new Map(firstCompletedGroups.map((g) => [g.clientId, g._min.createdAt]))
    let newClientsRevenue = 0
    let returningClientsRevenue = 0
    for (const [clientId, orders] of ordersByClient) {
        const sorted = [...orders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        const firstEver = firstCompletedAt.get(clientId)
        const isNewClient = !firstEver || firstEver >= startDate
        sorted.forEach((o, idx) => {
            if (isNewClient && idx === 0) newClientsRevenue += o.total
            else returningClientsRevenue += o.total
        })
    }

    // cost + margin by category
    let totalCost = 0
    const marginByCategoryMap = new Map<string, { revenue: number; cost: number }>()
    for (const item of marginItems) {
        const cost = item.product?.costPrice ? Number(item.product.costPrice) * item.quantity : 0
        totalCost += cost
        const category = item.product?.category || 'uncategorized'
        const m = marginByCategoryMap.get(category) || { revenue: 0, cost: 0 }
        m.revenue += Number(item.unitPrice) * item.quantity
        m.cost += cost
        marginByCategoryMap.set(category, m)
    }
    const marginByCategory = [...marginByCategoryMap.entries()]
        .map(([category, m]) => ({
            category,
            revenue: m.revenue.toString(),
            cost: m.cost.toString(),
            marginPct: m.revenue > 0 ? round1(((m.revenue - m.cost) / m.revenue) * 100) : 0,
        }))
        .sort((a, b) => Number(b.revenue) - Number(a.revenue))

    const totalProfit = totalRevenue - totalCost
    const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0

    // weeksOfCover (live stock vs last-90-days sales velocity)
    const soldUnitsByProduct = new Map<string, number>()
    for (const g of soldSince90Groups) {
        if (g.productId != null) soldUnitsByProduct.set(g.productId, g._sum.quantity ?? 0)
    }
    const coverByCategory = new Map<string, { onHand: number; sold: number }>()
    for (const p of products) {
        const category = p.category || 'uncategorized'
        const c = coverByCategory.get(category) || { onHand: 0, sold: 0 }
        c.onHand += p.quantity
        c.sold += soldUnitsByProduct.get(p.id) ?? 0
        coverByCategory.set(category, c)
    }
    const weeksOfCover = [...coverByCategory.entries()]
        .map(([category, c]) => {
            const weeklyRate = c.sold / SALES_VELOCITY_WEEKS
            return {
                category,
                onHand: c.onHand,
                weeklyRate: round2(weeklyRate),
                weeks: weeklyRate > 0 ? round1(c.onHand / weeklyRate) : null,
            }
        })
        .sort((a, b) => b.onHand - a.onHand)

    // salesHeatmap
    const byWeekday = [0, 0, 0, 0, 0, 0, 0]
    const byHour: number[] = new Array(24).fill(0)
    for (const o of heatmapOrders) {
        byWeekday[o.createdAt.getDay()]++
        byHour[o.createdAt.getHours()]++
    }

    // monthlyTrend (12 months ending current month)
    const monthlyMap = new Map<string, { revenue: number; profit: number; orders: number }>()
    for (const o of monthlyRows) {
        const key = monthKey(o.createdAt)
        const m = monthlyMap.get(key) || { revenue: 0, profit: 0, orders: 0 }
        const amount = Number(o.totalAmount)
        m.revenue += amount
        m.profit += amount - itemsCost(o.items)
        m.orders++
        monthlyMap.set(key, m)
    }
    const monthlyRevenue = lastNMonthStarts(MONTHLY_TREND_MONTHS, now).map((d) => {
        const key = monthKey(d)
        const m = monthlyMap.get(key)
        return { month: key, revenue: m?.revenue ?? 0, profit: m?.profit ?? 0, orders: m?.orders ?? 0 }
    })

    // deltas vs previous period (null when no previous data / prev is 0)
    let prevRevenue = 0
    let prevCost = 0
    for (const o of prevCompletedOrders) {
        prevRevenue += Number(o.totalAmount)
        prevCost += itemsCost(o.items)
    }
    const prevAvgOrderValue = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0
    const deltas = {
        revenue: changePct(totalRevenue, prevRevenue),
        orders: changePct(totalOrders, prevOrdersCount),
        avgOrderValue: changePct(avgOrderValue, prevAvgOrderValue),
        newClients: changePct(newClients, prevNewClients),
        profit: changePct(totalProfit, prevRevenue - prevCost),
    }

    const [nonCompletedOrders, recentOrders, topProductsData, cancelAgg] = await Promise.all([
        db.order.findMany({
            where: { status: { not: 'completed' }, ...dateFilter },
            include: { payments: { include: { cheque: true } } },
        }),
        orderRepo.findMany({
            take: TOP_LIST_SIZE,
            orderBy: { createdAt: 'desc' },
            where: dateFilter,
            include: {
                client: { select: { name: true, familyName: true } },
                payments: { include: { cheque: true } },
            },
        }),
        (async () => {
            const raw = await db.orderItem.groupBy({
                by: ['productId'],
                where: { order: { status: 'completed', ...dateFilter } },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
            })
            const ids = raw.map((r) => r.productId).filter((id): id is string => id != null)
            if (ids.length === 0) return {}
            const fetchedProducts = await db.product.findMany({
                where: { id: { in: ids } },
                select: { id: true, name: true, brand: true, model: true, category: true, costPrice: true, price: true },
            })
            const productMap = new Map(fetchedProducts.map((p) => [p.id, p]))
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
                byCategory[cat] = byCategory[cat].slice(0, TOP_LIST_SIZE)
            }
            return byCategory
        })(),
        db.order.aggregate({ where: { status: 'cancelled', ...dateFilter }, _sum: { totalAmount: true } }),
    ])

    const outstandingBalance = nonCompletedOrders.reduce((sum, order) => {
        const paid = effectivePaymentTotal(order.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })), 'client')
        return sum + (Number(order.totalAmount) - paid)
    }, 0)

    const decisionStats = await getShopDecisionStats(current, startDate, now, outstandingBalance.toString(), totalOrders, products, soldUnitsByProduct)

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

    const cancellations = {
        count: ordersByStatus.cancelled,
        revenueLost: (cancelAgg._sum.totalAmount ?? 0).toString(),
    }

    const restockList = restockProducts.map((p) => ({
        productId: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        quantity: p.quantity,
        supplierName: p.fournisseur?.name ?? null,
    }))

    return {
        totalClients,
        totalProducts,
        lowStockCount,
        totalOrders,
        todayOrders,
        pendingRepairs,
        totalRevenue: totalRevenue.toString(),
        revenueByType: {
            standard: revenueTypeGroups.find((g) => g.orderType === 'standard')?._sum.totalAmount?.toString() || '0',
            remounting: revenueTypeGroups.find((g) => g.orderType === 'remounting')?._sum.totalAmount?.toString() || '0',
            direct_sale: revenueTypeGroups.find((g) => g.orderType === 'direct_sale')?._sum.totalAmount?.toString() || '0',
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
        monthlyRevenue,
        deltas,
        salesHeatmap: { byWeekday, byHour },
        revenueSplit: {
            newClientsRevenue: newClientsRevenue.toString(),
            returningClientsRevenue: returningClientsRevenue.toString(),
        },
        orderValueBuckets,
        doctorRanking,
        powerDemand,
        marginByCategory,
        weeksOfCover,
        restockList,
        cancellations,
        ...decisionStats,
    }
}
