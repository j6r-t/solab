import { db } from '@/lib/database/db'
import { lensBlankRepo, opticianShopRepo } from '@/lib/database/repositories'
import { LOW_STOCK_MAX_QTY } from '@/lib/constants/kpi'
import { avgTurnaroundDays, getPeriodRange } from '@/modules/system/reports/report-shared'

export interface AtelierDashboardData {
    /** Live work queue: pending + in-progress counts, overdue = past expectedCompletionDate and not yet completed/delivered. */
    queue: { pending: number; inProgress: number; overdue: number }
    /** Completed work orders awaiting delivery, with the per-partner-shop split (optician-source only). */
    readyToDeliver: { count: number; shops: { id: string; name: string; count: number }[] }
    /** Lens-blank references at or below the LOW_STOCK_MAX_QTY threshold. */
    lowStockLensBlanks: number
    /** Blanks broken during mounting this calendar month (same adjustments the atelier reports use). */
    breakageThisMonth: number
    /** Avg started → completed days over work orders completed this month (same definition as the atelier reports). */
    avgTurnaroundDays: number
}

/**
 * One compact call feeding the atelier dashboard widgets — counts and groupBy
 * only, no row-heavy finds. Metric definitions are shared with the atelier
 * reports (LOW_STOCK_MAX_QTY, getPeriodRange month window, avgTurnaroundDays)
 * so the dashboard and the reports page can never disagree.
 */
export async function getAtelierDashboard(now = new Date()): Promise<AtelierDashboardData> {
    const monthStart = getPeriodRange('month', now).current?.start
    // Overdue uses day granularity, matching the due-date badges on the work
    // orders page: due before today, not merely before "now".
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
        pending,
        inProgress,
        overdue,
        completedTotal,
        completedByShop,
        lowStockLensBlanks,
        breakageAgg,
        turnaroundRows,
    ] = await Promise.all([
        db.atelierWorkOrder.count({ where: { status: 'pending' } }),
        db.atelierWorkOrder.count({ where: { status: 'in_progress' } }),
        db.atelierWorkOrder.count({
            where: { status: { in: ['pending', 'in_progress'] }, expectedCompletionDate: { lt: startOfToday } },
        }),
        db.atelierWorkOrder.count({ where: { status: 'completed' } }),
        db.atelierWorkOrder.groupBy({
            by: ['opticianShopId'],
            where: { status: 'completed', source: 'optician', opticianShopId: { not: null } },
            _count: { _all: true },
        }),
        lensBlankRepo.count({ where: { quantity: { lte: LOW_STOCK_MAX_QTY } } }),
        db.lensBlankAdjustment.aggregate({
            where: { reason: 'broken_during_mounting', ...(monthStart ? { createdAt: { gte: monthStart } } : {}) },
            _sum: { quantity: true },
        }),
        db.atelierWorkOrder.findMany({
            where: {
                status: 'completed',
                startedAt: { not: null },
                ...(monthStart ? { completedAt: { gte: monthStart } } : { completedAt: { not: null } }),
            },
            select: { startedAt: true, completedAt: true },
        }),
    ])

    const shopCounts = new Map<string, number>()
    for (const g of completedByShop) {
        if (g.opticianShopId) shopCounts.set(g.opticianShopId, g._count._all)
    }
    const shops = shopCounts.size > 0
        ? await opticianShopRepo.findMany({
            where: { id: { in: [...shopCounts.keys()] } },
            select: { id: true, name: true },
        })
        : []

    return {
        queue: { pending, inProgress, overdue },
        readyToDeliver: {
            count: completedTotal,
            shops: shops
                .map((s) => ({ id: s.id, name: s.name, count: shopCounts.get(s.id) ?? 0 }))
                .sort((a, b) => b.count - a.count),
        },
        lowStockLensBlanks,
        breakageThisMonth: Math.abs(Number(breakageAgg._sum.quantity ?? 0)),
        avgTurnaroundDays: avgTurnaroundDays(turnaroundRows),
    }
}
