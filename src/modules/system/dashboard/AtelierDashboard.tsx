'use client'

import { useTranslation } from '@/lib/hooks/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, EyeOff, Loader2, Wrench } from 'lucide-react'
import { useViewStore } from '@/stores/view-store'
import { useAtelierDashboard } from './useAtelierDashboard'

/**
 * Atelier dashboard widgets, in priority order for "what should I work on now?":
 * 1. File d'attente — live queue (pending / in progress, overdue flagged)
 * 2. Prêts à livrer — completed but not yet delivered
 * 3. Verres en stock bas — blank references at or below the low-stock threshold
 * 4. Muted strip — breakage this month + average turnaround
 * Every count deep-links into the pre-filtered view it belongs to.
 */
export function AtelierDashboard() {
    const { t } = useTranslation()
    const { setView } = useViewStore()
    const { data, isLoading } = useAtelierDashboard()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t('common.loading')}
            </div>
        )
    }
    if (!data) return null

    const { queue, readyToDeliver, lowStockLensBlanks, breakageThisMonth, avgTurnaroundDays } = data
    const queueTotal = queue.pending + queue.inProgress

    const shopsLabel = readyToDeliver.shops
        .map((s) => `${s.name} (${s.count})`)
        .join(', ')

    return (
        <section aria-label={t('navGroups.atelier')} className="space-y-3">
            {/* 1 · File d'attente */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('dashboard.atelier.queue')}
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-950/30">
                        <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {queueTotal === 0 ? (
                        <div className="flex items-center gap-3 py-1">
                            <CheckCircle2 className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium">{t('dashboard.atelier.queueEmpty')}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.atelier.queueEmptyHint')}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setView('atelier-work-orders', { status: 'pending' })}
                                    aria-label={`${t('workOrders.status.pending')} : ${queue.pending}`}
                                    className="min-h-11 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <span className="block text-2xl font-bold leading-tight tracking-tight">{queue.pending}</span>
                                    <span className="block text-xs text-muted-foreground">{t('workOrders.status.pending')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setView('atelier-work-orders', { status: 'in_progress' })}
                                    aria-label={`${t('workOrders.status.in_progress')} : ${queue.inProgress}`}
                                    className="min-h-11 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <span className="block text-2xl font-bold leading-tight tracking-tight">{queue.inProgress}</span>
                                    <span className="block text-xs text-muted-foreground">{t('workOrders.status.in_progress')}</span>
                                </button>
                            </div>
                            {queue.overdue > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setView('atelier-work-orders')}
                                    aria-label={t('dashboard.atelier.overdue', { n: queue.overdue })}
                                    className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-sm font-medium text-destructive transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                                    {t('dashboard.atelier.overdue', { n: queue.overdue })}
                                </button>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 2 · Prêts à livrer (hidden when nothing is waiting for delivery) */}
            {readyToDeliver.count > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('dashboard.atelier.readyToDeliver')}
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10">
                            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <button
                            type="button"
                            onClick={() => setView('atelier-work-orders', { status: 'completed' })}
                            aria-label={`${t('dashboard.atelier.readyToDeliver')} : ${readyToDeliver.count}`}
                            className="flex min-h-11 w-full items-center gap-4 rounded-lg px-1 py-1 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <span className="text-2xl font-bold leading-tight tracking-tight text-primary">{readyToDeliver.count}</span>
                            <span className="min-w-0 text-sm text-muted-foreground">
                                {shopsLabel || t('workOrders.status.completed')}
                            </span>
                        </button>
                    </CardContent>
                </Card>
            )}

            {/* 3 · Verres en stock bas (hidden when stock is healthy) */}
            {lowStockLensBlanks > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('dashboard.atelier.lowStockBlanks')}
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-950/30">
                            <EyeOff className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <button
                            type="button"
                            onClick={() => setView('lens-blanks', { lowStock: 'true' })}
                            aria-label={`${t('dashboard.atelier.lowStockBlanks')} : ${lowStockLensBlanks}`}
                            className="flex min-h-11 w-full items-center gap-4 rounded-lg px-1 py-1 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <span className="text-2xl font-bold leading-tight tracking-tight text-destructive">{lowStockLensBlanks}</span>
                            <span className="min-w-0 text-sm text-muted-foreground">{t('dashboard.atelier.lowStockHint')}</span>
                        </button>
                    </CardContent>
                </Card>
            )}

            {/* 4 · Quiet month strip */}
            <p className="px-1 text-sm text-muted-foreground">
                {t('dashboard.atelier.breakageMonth')}{' '}
                <span className="font-medium text-foreground">{breakageThisMonth}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                {t('dashboard.atelier.avgTurnaround')}{' '}
                <span className="font-medium text-foreground">
                    {avgTurnaroundDays} {t('dashboard.atelier.days')}
                </span>
            </p>
        </section>
    )
}
