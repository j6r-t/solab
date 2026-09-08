import { clientRepo, productRepo, repairRepo, orderRepo, lensBlankRepo, opticianShopRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'
import {
    BACKLOG_AGING_BUCKETS_DAYS,
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
    TOP_USED_BLANKS_SIZE,
    WEEKLY_THROUGHPUT_WEEKS,
} from '@/lib/constants/kpi'

const SPH_BANDS = ['≤ −6', '−6..−4', '−4..−2', '−2..0', '0..+2', '+2..+4', '≥ +4']
const CYL_BANDS = ['0..−1', '−1..−2', '< −2']

interface PeriodWindow {
    start: Date
    end: Date | null
}

interface PeriodRange {
    current: PeriodWindow | null
    previous: PeriodWindow | null
}

interface WorkOrderRow {
    source: string
    status: string
    servicePrice: Prisma.Decimal | null
    lensBlankPrice: Prisma.Decimal | null
    opticianShopId: string | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date
}

interface BillRow {
    opticianShopId: string
    totalAmount: Prisma.Decimal
    createdAt: Date
    payments: { amount: Prisma.Decimal; method: string; cheque: { status: string | null } | null }[]
}

interface LowStockBlankRow {
    id: string
    brand: string
    thickness: string
    sph: Prisma.Decimal
    cyl: Prisma.Decimal
    quantity: number
}

interface ProductStockRow {
    id: string
    quantity: number
    category: string | null
    costPrice: Prisma.Decimal | null
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

function pad2(n: number): string {
    return String(n).padStart(2, '0')
}

function monthKey(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

function round1(n: number): number {
    return Math.round(n * 10) / 10
}

function round2(n: number): number {
    return Math.round(n * 100) / 100
}

/**
 * Current + previous windows for a period.
 * today → previous = yesterday; week → previous 7 days starting same weekday (weeks start Sunday);
 * month → previous calendar month; year → previous calendar year; all → null (no deltas).
 * Current end is always null (open, up to `now`); previous end is always bounded.
 */
function getPeriodRange(period: string, now: Date): PeriodRange {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    switch (period) {
        case 'today':
            return {
                current: { start: startOfToday, end: null },
                previous: { start: addDays(startOfToday, -1), end: startOfToday },
            }
        case 'week': {
            const weekStart = addDays(startOfToday, -now.getDay())
            return {
                current: { start: weekStart, end: null },
                previous: { start: addDays(weekStart, -7), end: weekStart },
            }
        }
        case 'month': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            return {
                current: { start: monthStart, end: null },
                previous: { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: monthStart },
            }
        }
        case 'year': {
            const yearStart = new Date(now.getFullYear(), 0, 1)
            return {
                current: { start: yearStart, end: null },
                previous: { start: new Date(now.getFullYear() - 1, 0, 1), end: yearStart },
            }
        }
        default:
            return { current: null, previous: null }
    }
}

function inWindow(date: Date, range: PeriodWindow | null): boolean {
    if (!range) return true
    return date >= range.start && (range.end === null || date < range.end)
}

function changePct(value: number, previous: number): number | null {
    if (!previous) return null
    return round1(((value - previous) / previous) * 100)
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

function lastNMonthStarts(n: number, now: Date): Date[] {
    const out: Date[] = []
    for (let i = n - 1; i >= 0; i--) out.push(new Date(now.getFullYear(), now.getMonth() - i, 1))
    return out
}

function itemsCost(items: { quantity: number; product: { costPrice: Prisma.Decimal | null } | null }[]): number {
    let cost = 0
    for (const it of items) {
        if (it.product?.costPrice) cost += Number(it.product.costPrice) * it.quantity
    }
    return cost
}

export async function getReports(period: string, entity: string) {
    const now = new Date()
    if (entity === 'atelier') return getAtelierReports(period, now)
    return getShopReports(period, now)
}

// ───────────────────────────────
// Shop
// ───────────────────────────────

async function getShopDecisionStats(
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
        const paid = effectivePaymentTotal(
            inv.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
            'supplier'
        )
        s.outstanding += Number(inv.totalAmount) - paid
        if (inWindow(inv.date, current)) s.purchases += Number(inv.totalAmount)
        supplierAgg.set(inv.fournisseurId, s)
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

async function getShopReports(period: string, now: Date) {
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

// ───────────────────────────────
// Atelier
// ───────────────────────────────

async function getAtelierDecisionStats(
    current: PeriodWindow | null,
    previous: PeriodWindow | null,
    now: Date,
    allWorkOrders: WorkOrderRow[],
    bills: BillRow[],
    shopNameById: Map<string, string>,
    lowStockBlanks: LowStockBlankRow[],
    lowStockBlanksCount: number,
) {
    const dateFilter: Prisma.AtelierWorkOrderWhereInput = current ? { createdAt: { gte: current.start } } : {}

    const [
        backlogOrders,
        completedTurnaround,
        prevCompletedTurnaround,
        adjustmentGroups,
        prevAdjustmentGroups,
    ] = await Promise.all([
        db.atelierWorkOrder.findMany({
            where: { status: { in: ['pending', 'in_progress'] }, ...dateFilter },
            select: { status: true, createdAt: true },
        }),
        db.atelierWorkOrder.findMany({
            where: {
                status: 'completed',
                startedAt: { not: null },
                ...(current ? { completedAt: { gte: current.start } } : { completedAt: { not: null } }),
            },
            select: { startedAt: true, completedAt: true },
        }),
        previous
            ? db.atelierWorkOrder.findMany({
                where: {
                    status: 'completed',
                    startedAt: { not: null },
                    completedAt: { gte: previous.start, lt: previous.end ?? now },
                },
                select: { startedAt: true, completedAt: true },
            })
            : Promise.resolve([] as { startedAt: Date | null; completedAt: Date | null }[]),
        db.lensBlankAdjustment.groupBy({
            by: ['reason'],
            where: {
                reason: { in: ['used_in_mounting', 'broken_during_mounting'] },
                ...(current ? { createdAt: { gte: current.start } } : {}),
            },
            _sum: { quantity: true },
        }),
        previous
            ? db.lensBlankAdjustment.groupBy({
                by: ['reason'],
                where: {
                    reason: { in: ['used_in_mounting', 'broken_during_mounting'] },
                    createdAt: { gte: previous.start, lt: previous.end ?? now },
                },
                _sum: { quantity: true },
            })
            : Promise.resolve([] as { reason: string; _sum: { quantity: number | null } | null }[]),
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
        avgAgeDays: backlogOrders.length > 0 ? round1(backlogAgeMs / backlogOrders.length / DAY_MS) : 0,
    }

    // agingBuckets: live pending/in_progress work orders by age since createdAt
    const agingCounts = { '0to3': 0, '4to7': 0, '8to14': 0, gt14: 0 }
    for (const wo of allWorkOrders) {
        if (wo.status !== 'pending' && wo.status !== 'in_progress') continue
        const ageDays = Math.floor((now.getTime() - wo.createdAt.getTime()) / DAY_MS)
        if (ageDays <= BACKLOG_AGING_BUCKETS_DAYS[0]) agingCounts['0to3']++
        else if (ageDays <= BACKLOG_AGING_BUCKETS_DAYS[1]) agingCounts['4to7']++
        else if (ageDays <= BACKLOG_AGING_BUCKETS_DAYS[2]) agingCounts['8to14']++
        else agingCounts.gt14++
    }
    const agingBuckets = [
        { bucket: '0to3' as const, count: agingCounts['0to3'] },
        { bucket: '4to7' as const, count: agingCounts['4to7'] },
        { bucket: '8to14' as const, count: agingCounts['8to14'] },
        { bucket: 'gt14' as const, count: agingCounts.gt14 },
    ]

    const avgTurnaround = (rows: { startedAt: Date | null; completedAt: Date | null }[]) => {
        let ms = 0
        let count = 0
        for (const wo of rows) {
            if (wo.startedAt && wo.completedAt) {
                ms += wo.completedAt.getTime() - wo.startedAt.getTime()
                count++
            }
        }
        return count > 0 ? round1(ms / count / DAY_MS) : 0
    }
    const avgTurnaroundDays = avgTurnaround(completedTurnaround)
    const prevAvgTurnaroundDays = avgTurnaround(prevCompletedTurnaround)

    const countReason = (groups: { reason: string; _sum: { quantity: number | null } | null }[], reason: string) =>
        Math.abs(Number(groups.find((g) => g.reason === reason)?._sum?.quantity ?? 0))
    const breakageRate = (used: number, broken: number) =>
        used + broken > 0 ? round1((broken / (used + broken)) * 100) : 0
    const usedInMounting = countReason(adjustmentGroups, 'used_in_mounting')
    const brokenDuringMounting = countReason(adjustmentGroups, 'broken_during_mounting')

    const billSums = new Map<string, number>()
    for (const bill of bills) {
        if (!inWindow(bill.createdAt, current)) continue
        billSums.set(bill.opticianShopId, (billSums.get(bill.opticianShopId) || 0) + Number(bill.totalAmount))
    }
    const revenueByOptician = [...billSums.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_LIST_SIZE)
        .map(([shopId, total]) => ({
            shopId,
            shopName: shopNameById.get(shopId) || '—',
            total: total.toString(),
        }))

    const lensBlanksLowStock = {
        count: lowStockBlanksCount,
        items: lowStockBlanks.map((b) => ({
            id: b.id,
            label: `${b.brand} ${b.thickness} (${Number(b.sph)}/${Number(b.cyl)})`,
            quantity: b.quantity,
        })),
    }

    return {
        workload,
        agingBuckets,
        avgTurnaroundDays,
        prevAvgTurnaroundDays,
        breakageRate: breakageRate(usedInMounting, brokenDuringMounting),
        prevBreakageRate: breakageRate(countReason(prevAdjustmentGroups, 'used_in_mounting'), countReason(prevAdjustmentGroups, 'broken_during_mounting')),
        revenueByOptician,
        lensBlanksLowStock,
    }
}

async function getAtelierReports(period: string, now: Date) {
    const range = getPeriodRange(period, now)
    const current = range.current
    const dateFilter: Prisma.AtelierWorkOrderWhereInput = current ? { createdAt: { gte: current.start } } : {}
    const prevCreatedAt = range.previous ? { gte: range.previous.start, lt: range.previous.end ?? now } : null
    const currentWeekStart = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -now.getDay())

    const [
        totalLensBlanks,
        lowStockLensBlanks,
        totalWorkOrders,
        pendingWorkOrders,
        completedWorkOrders,
        totalOpticianShops,
        revenueAgg,
        recentWorkOrders,
        allWorkOrders,
        bills,
        shops,
        lowStockBlanks,
        lowStockBlanksCount,
        usedGroups,
        brokenGroups,
    ] = await Promise.all([
        lensBlankRepo.count(),
        lensBlankRepo.count({ where: { quantity: { lte: LOW_STOCK_MAX_QTY } } }),
        repairRepo.count({ where: dateFilter }),
        repairRepo.count({ where: { status: 'pending', ...dateFilter } }),
        repairRepo.count({ where: { status: 'completed', ...dateFilter } }),
        opticianShopRepo.count(),
        db.atelierWorkOrder.aggregate({
            where: { status: 'completed', ...dateFilter },
            _sum: { servicePrice: true, lensBlankPrice: true },
        }),
        repairRepo.findMany({
            take: TOP_LIST_SIZE,
            orderBy: { createdAt: 'desc' },
            where: dateFilter,
            include: {
                opticianShop: { select: { name: true } },
                order: { select: { orderNumber: true } },
            },
        }),
        db.atelierWorkOrder.findMany({
            select: {
                source: true,
                status: true,
                servicePrice: true,
                lensBlankPrice: true,
                opticianShopId: true,
                startedAt: true,
                completedAt: true,
                createdAt: true,
            },
        }),
        db.opticianShopBill.findMany({
            select: {
                opticianShopId: true,
                totalAmount: true,
                createdAt: true,
                payments: { select: { amount: true, method: true, cheque: { select: { status: true } } } },
            },
        }),
        opticianShopRepo.findMany({ select: { id: true, name: true } }),
        lensBlankRepo.findMany({
            where: { quantity: { lte: LOW_STOCK_MAX_QTY } },
            orderBy: { quantity: 'asc' },
            take: TOP_LIST_SIZE,
            select: { id: true, brand: true, thickness: true, sph: true, cyl: true, quantity: true },
        }),
        lensBlankRepo.count({ where: { quantity: { lte: LOW_STOCK_MAX_QTY } } }),
        db.lensBlankAdjustment.groupBy({
            by: ['lensBlankId'],
            where: { reason: 'used_in_mounting', ...(current ? { createdAt: { gte: current.start } } : {}) },
            _sum: { quantity: true },
        }),
        db.lensBlankAdjustment.groupBy({
            by: ['lensBlankId'],
            where: { reason: 'broken_during_mounting', ...(current ? { createdAt: { gte: current.start } } : {}) },
            _sum: { quantity: true },
        }),
    ])

    const prevWorkOrders = prevCreatedAt
        ? await db.atelierWorkOrder.findMany({
            where: { createdAt: prevCreatedAt },
            select: { status: true, servicePrice: true, lensBlankPrice: true },
        })
        : []

    const woRevenue = (wo: { status: string; servicePrice: Prisma.Decimal | null; lensBlankPrice: Prisma.Decimal | null }) =>
        wo.status === 'completed' ? Number(wo.servicePrice ?? 0) + Number(wo.lensBlankPrice ?? 0) : 0

    const service = revenueAgg._sum.servicePrice ? parseFloat(revenueAgg._sum.servicePrice.toString()) : 0
    const blanksSum = revenueAgg._sum.lensBlankPrice ? parseFloat(revenueAgg._sum.lensBlankPrice.toString()) : 0
    const totalRevenue = service + blanksSum

    const avgTicket = completedWorkOrders > 0 ? round1(totalRevenue / completedWorkOrders) : 0

    const shopNameById = new Map(shops.map((s) => [s.id, s.name]))
    const periodWorkOrders = allWorkOrders.filter((wo) => inWindow(wo.createdAt, current))

    // workOrdersByShop (period, by shop name)
    const byShopName = new Map<string, number>()
    for (const wo of periodWorkOrders) {
        const name = (wo.opticianShopId && shopNameById.get(wo.opticianShopId)) || 'Unknown'
        byShopName.set(name, (byShopName.get(name) || 0) + 1)
    }
    const workOrdersByShop = [...byShopName.entries()]
        .map(([shopName, count]) => ({ shopName, count }))
        .sort((a, b) => b.count - a.count)

    // monthlyWorkOrders: { month, count, revenue } (revenue = completed work orders that month)
    const monthlyStart = new Date(now.getFullYear(), now.getMonth() - (MONTHLY_TREND_MONTHS - 1), 1)
    const monthlyMap = new Map<string, { count: number; revenue: number }>()
    for (const wo of allWorkOrders) {
        if (!inWindow(wo.createdAt, { start: monthlyStart, end: null })) continue
        const key = monthKey(wo.createdAt)
        const m = monthlyMap.get(key) || { count: 0, revenue: 0 }
        m.count++
        m.revenue += woRevenue(wo)
        monthlyMap.set(key, m)
    }
    const monthlyWorkOrders = lastNMonthStarts(MONTHLY_TREND_MONTHS, now).map((d) => {
        const key = monthKey(d)
        const m = monthlyMap.get(key)
        return { month: key, count: m?.count ?? 0, revenue: m?.revenue ?? 0 }
    })

    // weeklyThroughput: last 12 weeks (weeks start Sunday)
    const weeklyThroughput: { weekStart: string; created: number; completed: number }[] = []
    for (let i = WEEKLY_THROUGHPUT_WEEKS - 1; i >= 0; i--) {
        const weekStart = addDays(currentWeekStart, -7 * i)
        const weekEnd = addDays(weekStart, 7)
        let created = 0
        let completed = 0
        for (const wo of allWorkOrders) {
            if (wo.createdAt >= weekStart && wo.createdAt < weekEnd) created++
            if (wo.completedAt && wo.completedAt >= weekStart && wo.completedAt < weekEnd) completed++
        }
        weeklyThroughput.push({
            weekStart: `${weekStart.getFullYear()}-${pad2(weekStart.getMonth() + 1)}-${pad2(weekStart.getDate())}`,
            created,
            completed,
        })
    }

    // sourceSplit (WorkOrderSource)
    const sourceSplit = [
        { source: 'internal', count: periodWorkOrders.filter((w) => w.source === 'internal').length },
        { source: 'optician', count: periodWorkOrders.filter((w) => w.source === 'optician').length },
    ]

    // partnerScorecard
    const scorecard = new Map<string, { orders: number; revenue: number; turnaroundMs: number; turnaroundCount: number; debt: number; lastActivity: Date | null }>()
    const ensureShop = (shopId: string) => {
        let s = scorecard.get(shopId)
        if (!s) {
            s = { orders: 0, revenue: 0, turnaroundMs: 0, turnaroundCount: 0, debt: 0, lastActivity: null }
            scorecard.set(shopId, s)
        }
        return s
    }
    for (const wo of allWorkOrders) {
        if (!wo.opticianShopId) continue
        const s = ensureShop(wo.opticianShopId)
        if (inWindow(wo.createdAt, current)) {
            s.orders++
            s.revenue += woRevenue(wo)
        }
        if (wo.startedAt && wo.completedAt) {
            s.turnaroundMs += wo.completedAt.getTime() - wo.startedAt.getTime()
            s.turnaroundCount++
        }
        if (!s.lastActivity || wo.createdAt > s.lastActivity) s.lastActivity = wo.createdAt
    }
    for (const bill of bills) {
        const s = ensureShop(bill.opticianShopId)
        const paid = effectivePaymentTotal(
            bill.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
            'client'
        )
        s.debt += Number(bill.totalAmount) - paid
        if (!s.lastActivity || bill.createdAt > s.lastActivity) s.lastActivity = bill.createdAt
    }
    const partnerScorecard = [...scorecard.entries()]
        .map(([shopId, s]) => ({
            shopId,
            name: shopNameById.get(shopId) || '—',
            orders: s.orders,
            revenue: s.revenue.toString(),
            avgTurnaroundDays: s.turnaroundCount > 0 ? round1(s.turnaroundMs / s.turnaroundCount / DAY_MS) : 0,
            debt: s.debt.toString(),
            lastActivity: (s.lastActivity ?? now).toISOString(),
        }))
        .sort((a, b) => Number(b.revenue) - Number(a.revenue))

    // lensUsage + breakageByLens (need blank labels + current stock)
    const topUsed = usedGroups
        .map((g) => ({ blankId: g.lensBlankId, usedQty: Math.abs(g._sum.quantity ?? 0) }))
        .sort((a, b) => b.usedQty - a.usedQty)
        .slice(0, TOP_USED_BLANKS_SIZE)
    const topBroken = brokenGroups
        .map((g) => ({ blankId: g.lensBlankId, brokenQty: Math.abs(g._sum.quantity ?? 0) }))
        .sort((a, b) => b.brokenQty - a.brokenQty)
        .slice(0, TOP_LIST_SIZE)
    const blankIds = [...new Set([...topUsed.map((g) => g.blankId), ...topBroken.map((g) => g.blankId)])]
    const blanks = blankIds.length > 0
        ? await lensBlankRepo.findMany({
            where: { id: { in: blankIds } },
            select: { id: true, brand: true, thickness: true, sph: true, cyl: true, quantity: true },
        })
        : []
    const blankById = new Map(blanks.map((b) => [b.id, b]))
    const blankLabel = (b: { brand: string; thickness: string; sph: Prisma.Decimal; cyl: Prisma.Decimal }) =>
        `${b.brand} ${b.thickness} (${Number(b.sph)}/${Number(b.cyl)})`
    const lensUsage = topUsed
        .filter((g) => blankById.has(g.blankId))
        .map((g) => {
            const b = blankById.get(g.blankId)!
            return { blankId: g.blankId, label: blankLabel(b), usedQty: g.usedQty, inStock: b.quantity }
        })
    const breakageByLens = topBroken
        .filter((g) => blankById.has(g.blankId))
        .map((g) => {
            const b = blankById.get(g.blankId)!
            return { blankId: g.blankId, label: blankLabel(b), brokenQty: g.brokenQty }
        })

    const decisionStats = await getAtelierDecisionStats(current, range.previous, now, allWorkOrders, bills, shopNameById, lowStockBlanks, lowStockBlanksCount)
    const { prevAvgTurnaroundDays, prevBreakageRate, ...decisionPublic } = decisionStats

    // deltas vs previous period (null when no previous data / prev is 0)
    let prevRevenue = 0
    let prevCompleted = 0
    for (const wo of prevWorkOrders) {
        prevRevenue += woRevenue(wo)
        if (wo.status === 'completed') prevCompleted++
    }
    const prevAvgTicket = prevCompleted > 0 ? round1(prevRevenue / prevCompleted) : 0
    const deltas = {
        revenue: changePct(totalRevenue, prevRevenue),
        completed: changePct(completedWorkOrders, prevCompleted),
        avgTurnaround: changePct(decisionStats.avgTurnaroundDays, prevAvgTurnaroundDays),
        breakage: changePct(decisionStats.breakageRate, prevBreakageRate),
        avgTicket: changePct(avgTicket, prevAvgTicket),
    }

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
        ...decisionPublic,
        deltas,
        avgTicket,
        weeklyThroughput,
        partnerScorecard,
        sourceSplit,
        lensUsage,
        breakageByLens,
        period,
    }
}
