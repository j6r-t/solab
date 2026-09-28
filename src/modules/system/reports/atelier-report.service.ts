import { repairRepo, lensBlankRepo, opticianShopRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal } from '@/lib/utils/payments'
import {
    BACKLOG_AGING_BUCKETS_DAYS,
    DAY_MS,
    LOW_STOCK_MAX_QTY,
    MONTHLY_TREND_MONTHS,
    TOP_BLANKS_PER_SHOP,
    TOP_LIST_SIZE,
    TOP_USED_BLANKS_SIZE,
    WEEKLY_THROUGHPUT_WEEKS,
} from '@/lib/constants/kpi'
import {
    addDays,
    changePct,
    getPeriodRange,
    inWindow,
    lastNMonthStarts,
    monthKey,
    pad2,
    round1,
} from './report-shared'
import type { PeriodWindow } from './report-shared'

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
    groupedIntoId: string | null
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

// ───────────────────────────────
// Atelier
// ───────────────────────────────

export async function getAtelierDecisionStats(
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

export async function getAtelierReports(period: string, now: Date) {
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
        consolidatedInvoices,
        shops,
        lowStockBlanks,
        lowStockBlanksCount,
        usedGroups,
        brokenGroups,
        topBlankItems,
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
                groupedIntoId: true,
                createdAt: true,
                payments: { select: { amount: true, method: true, cheque: { select: { status: true } } } },
            },
        }),
        db.consolidatedInvoice.findMany({
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
        db.opticianShopBillItem.findMany({
            where: {
                itemType: 'lens_blank',
                bill: {
                    ...(current ? { createdAt: { gte: current.start } } : {}),
                    workOrder: { opticianShopId: { not: null } },
                },
            },
            select: {
                description: true,
                quantity: true,
                lensBlankId: true,
                bill: {
                    select: {
                        workOrder: {
                            select: {
                                opticianShopId: true,
                                opticianShop: { select: { name: true } },
                            },
                        },
                    },
                },
            },
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
        // Phase 3: a grouped source bill carries no debt of its own — its
        // outstanding moved into the consolidated invoice (counted below).
        if (!bill.groupedIntoId) {
            const paid = effectivePaymentTotal(
                bill.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
                'client'
            )
            s.debt += Math.max(0, Number(bill.totalAmount) - paid)
        }
        if (!s.lastActivity || bill.createdAt > s.lastActivity) s.lastActivity = bill.createdAt
    }
    for (const invoice of consolidatedInvoices) {
        const s = ensureShop(invoice.opticianShopId)
        const paid = effectivePaymentTotal(
            invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
            'client'
        )
        s.debt += Math.max(0, Number(invoice.totalAmount) - paid)
        if (!s.lastActivity || invoice.createdAt > s.lastActivity) s.lastActivity = invoice.createdAt
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

    // topBlanksByShop: most-consumed lens blanks per optician shop (bill items of shop work orders)
    const blanksByShop = new Map<string, { shopId: string; shopName: string; total: number; blanks: Map<string, { label: string; qty: number }> }>()
    for (const item of topBlankItems) {
        const wo = item.bill.workOrder
        const shopId = wo?.opticianShopId
        if (!shopId) continue
        let shop = blanksByShop.get(shopId)
        if (!shop) {
            shop = { shopId, shopName: wo.opticianShop?.name || '—', total: 0, blanks: new Map() }
            blanksByShop.set(shopId, shop)
        }
        const key = item.lensBlankId ?? `desc:${item.description}`
        const blank = shop.blanks.get(key) || { label: item.description, qty: 0 }
        blank.qty += item.quantity
        shop.blanks.set(key, blank)
        shop.total += item.quantity
    }
    const topBlanksByShop = [...blanksByShop.values()]
        .sort((a, b) => b.total - a.total)
        .map((s) => ({
            shopId: s.shopId,
            shopName: s.shopName,
            blanks: [...s.blanks.values()].sort((a, b) => b.qty - a.qty).slice(0, TOP_BLANKS_PER_SHOP),
        }))

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
        topBlanksByShop,
        period,
    }
}
