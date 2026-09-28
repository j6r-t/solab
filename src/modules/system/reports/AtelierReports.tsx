'use client'

import { useTranslation } from '@/lib/hooks/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart3, TrendingUp, Award, Wrench, Building2, Layers, Timer, Flame, Store,
    AlertTriangle, DollarSign, Clock, Hourglass, Activity,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import type { AtelierReportData } from './useReports'
import { EmptyState, Header, KpiCard, StatRow, monthLabel, weekLabel } from './report-widgets'
import { BucketBars, DonutCard, LineChart, MiniBars } from './report-charts'

export function AtelierReports({ data, period, setPeriod }: { data: AtelierReportData | null; period: string; setPeriod: (v: string) => void }) {
    const { t, locale } = useTranslation()
    const periodSuffix = t(`reports.periodLabel.${period}`)
    const vsLabel = t('reports.vsPrevPeriod')
    const noData = t('reports.noData')
    const withSuffix = (label: string) => `${label} — ${periodSuffix}`

    const kpis = data
        ? [
            { label: withSuffix(t('reports.kpiRevenue')), value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'text-green-600', delta: data.deltas.revenue, deltaGoodUp: true, subtitle: undefined as string | undefined },
            { label: withSuffix(t('reports.kpiCompleted')), value: data.completedWorkOrders.toString(), icon: Award, color: 'text-emerald-600', delta: data.deltas.completed, deltaGoodUp: true, subtitle: undefined },
            { label: withSuffix(t('reports.avgTurnaroundDays')), value: `${data.avgTurnaroundDays ?? 0} ${t('orders.days')}`, icon: Timer, color: 'text-blue-600', delta: data.deltas.avgTurnaround, deltaGoodUp: false, subtitle: undefined },
            { label: withSuffix(t('reports.breakageRate')), value: `${data.breakageRate ?? 0} %`, icon: Flame, color: 'text-red-600', delta: data.deltas.breakage, deltaGoodUp: false, subtitle: undefined },
            {
                label: withSuffix(t('reports.backlog')),
                value: ((data.workload?.pending ?? 0) + (data.workload?.inProgress ?? 0)).toString(),
                icon: Clock,
                color: 'text-amber-600',
                delta: null,
                deltaGoodUp: true,
                subtitle: `${t('reports.workloadAvgAge')} : ${data.workload?.avgAgeDays ?? 0} ${t('orders.days')}`,
            },
            { label: withSuffix(t('reports.avgOrderValue')), value: formatCurrency(data.avgTicket), icon: TrendingUp, color: 'text-indigo-600', delta: data.deltas.avgTicket, deltaGoodUp: true, subtitle: undefined },
        ]
        : []

    const monthLabels = data ? data.monthlyWorkOrders.map((m) => monthLabel(m.month, locale)) : []

    const sourceItems = data
        ? data.sourceSplit.map((s) => ({
            label: s.source === 'internal' ? t('reports.sourceInternal') : t('reports.sourceOptician'),
            value: s.count,
            fill: s.source === 'internal' ? 'fill-indigo-500' : 'fill-purple-500',
            dot: s.source === 'internal' ? 'bg-indigo-500' : 'bg-purple-500',
        }))
        : []
    const sourceTotal = sourceItems.reduce((s, i) => s + i.value, 0)

    const agingLabels: Record<string, string> = {
        '0to3': t('reports.aging0to3'),
        '4to7': t('reports.aging4to7'),
        '8to14': t('reports.aging8to14'),
        gt14: t('reports.agingGt14'),
    }

    return (
        <div className="space-y-6 max-w-6xl">
            <Header setPeriod={setPeriod} period={period} />
            {!data ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {kpis.map((kpi) => (
                            <KpiCard
                                key={kpi.label}
                                label={kpi.label}
                                value={kpi.value}
                                icon={kpi.icon}
                                color={kpi.color}
                                delta={kpi.delta}
                                deltaGoodUp={kpi.deltaGoodUp}
                                subtitle={kpi.subtitle}
                                vsLabel={vsLabel}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.monthlyTrend')}</CardTitle>
                                <BarChart3 className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                {data.monthlyWorkOrders.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    <LineChart
                                        labels={monthLabels}
                                        formatValue={(v) => formatCurrency(Math.round(v))}
                                        series={[
                                            { label: t('reports.revenue'), strokeClass: 'stroke-emerald-500', dotClass: 'fill-emerald-500', bgClass: 'bg-emerald-500', points: data.monthlyWorkOrders.map((m) => m.revenue) },
                                        ]}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <DonutCard
                            title={t('reports.sourceSplit')}
                            icon={Layers}
                            color="text-indigo-600"
                            items={sourceItems}
                            emptyText={noData}
                            centerLabel={t('reports.workOrders')}
                            centerText={String(sourceTotal)}
                            formatValue={(v) => String(v)}
                            wide
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.weeklyThroughput')}</CardTitle>
                                <Activity className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <p className="mb-2 text-xs text-muted-foreground">{t('reports.created')}</p>
                                    <MiniBars
                                        items={data.weeklyThroughput.map((w) => ({ label: weekLabel(w.weekStart, locale), value: w.created }))}
                                        formatValue={(v) => String(v)}
                                    />
                                </div>
                                <div>
                                    <p className="mb-2 text-xs text-muted-foreground">{t('reports.kpiCompleted')}</p>
                                    <MiniBars
                                        items={data.weeklyThroughput.map((w) => ({ label: weekLabel(w.weekStart, locale), value: w.completed }))}
                                        formatValue={(v) => String(v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.agingBuckets')}</CardTitle>
                                <Hourglass className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <BucketBars
                                    items={data.agingBuckets.map((b) => ({ label: agingLabels[b.bucket] ?? b.bucket, count: b.count }))}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.partnerScorecard')}</CardTitle>
                                <Building2 className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                {data.partnerScorecard.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    <div className="overflow-x-auto overflow-y-auto max-h-[340px]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted text-muted-foreground sticky top-0 z-10">
                                                    <th className="text-left py-2 pr-4">{t('clients.name')}</th>
                                                    <th className="text-right py-2 px-3">{t('reports.ordersCount')}</th>
                                                    <th className="text-right py-2 px-3">{t('reports.revenue')}</th>
                                                    <th className="text-right py-2 px-3">{t('reports.avgTurnaroundDays')}</th>
                                                    <th className="text-right py-2 px-3">{t('reports.debt')}</th>
                                                    <th className="text-right py-2 pl-3">{t('reports.lastActivity')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.partnerScorecard.map((p) => (
                                                    <tr key={p.shopId} className="border-b last:border-0">
                                                        <td className="py-2 pr-4 font-medium">{p.name}</td>
                                                        <td className="text-right py-2 px-3 tabular-nums">{p.orders}</td>
                                                        <td className="text-right py-2 px-3 tabular-nums">{formatCurrency(p.revenue)}</td>
                                                        <td className="text-right py-2 px-3 tabular-nums">{p.avgTurnaroundDays} {t('orders.days')}</td>
                                                        <td className={`text-right py-2 px-3 tabular-nums ${Number(p.debt) > 0 ? 'text-red-600' : ''}`}>{formatCurrency(p.debt)}</td>
                                                        <td className="py-2 pl-3 text-right tabular-nums text-muted-foreground">{formatDate(p.lastActivity)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.workload')}</CardTitle>
                                <Wrench className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.workload ? (
                                    <>
                                        <StatRow label={t('common.pending')} value={data.workload.pending} />
                                        <StatRow label={t('reports.workloadInProgress')} value={data.workload.inProgress} />
                                        <StatRow label={t('reports.workloadAvgAge')} value={`${data.workload.avgAgeDays} ${t('orders.days')}`} muted />
                                    </>
                                ) : (
                                    <EmptyState text={noData} />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.lensUsage')}</CardTitle>
                                <Layers className="h-4 w-4 text-cyan-600" />
                            </CardHeader>
                            <CardContent>
                                {data.lensUsage.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    <div className="overflow-x-auto overflow-y-auto max-h-[340px]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted text-muted-foreground sticky top-0 z-10">
                                                    <th className="text-left py-2 pr-4">{t('reports.product')}</th>
                                                    <th className="text-right py-2 px-4">{t('reports.usedQty')}</th>
                                                    <th className="text-right py-2 pl-4">{t('reports.inStock')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.lensUsage.map((l) => (
                                                    <tr key={l.blankId} className="border-b last:border-0">
                                                        <td className="py-2 pr-4 font-medium">{l.label}</td>
                                                        <td className="text-right py-2 px-4 tabular-nums">{l.usedQty}</td>
                                                        <td className={`text-right py-2 pl-4 tabular-nums ${l.inStock <= 3 ? 'text-amber-600' : ''}`}>{l.inStock}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base">{t('reports.breakageByLens')}</CardTitle>
                                    <Flame className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    {data.breakageByLens.length === 0 ? (
                                        <EmptyState text={noData} />
                                    ) : (
                                        <MiniBars
                                            items={data.breakageByLens.map((b) => ({ label: b.label, value: b.brokenQty }))}
                                            formatValue={(v) => String(v)}
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base">{t('reports.lensBlanksLowStock')}</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-bold">{data.lensBlanksLowStock?.count ?? 0}</p>
                                        <p className="text-xs text-muted-foreground">{t('reports.blanksLowDesc')}</p>
                                    </div>
                                    {data.lensBlanksLowStock && data.lensBlanksLowStock.items.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {data.lensBlanksLowStock.items.map((b) => (
                                                <div key={b.id} className="flex justify-between text-sm">
                                                    <span className="mr-2 truncate">{b.label}</span>
                                                    <span className="shrink-0 font-semibold tabular-nums text-red-600">{b.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.workOrdersByShop')}</CardTitle>
                                <BarChart3 className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                {data.workOrdersByShop.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    <MiniBars
                                        items={data.workOrdersByShop.map((s) => ({ label: s.shopName, value: s.count }))}
                                        formatValue={(v) => String(v)}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.revenueByOptician')}</CardTitle>
                                <Store className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {!data.revenueByOptician || data.revenueByOptician.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    data.revenueByOptician.map((s) => (
                                        <div key={s.shopId} className="flex justify-between">
                                            <span className="mr-2 truncate">{s.shopName}</span>
                                            <span className="shrink-0 font-semibold tabular-nums">{formatCurrency(s.total)}</span>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {data.topBlanksByShop && data.topBlanksByShop.length > 0 && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base">{t('reports.topBlanksByShopTitle')}</CardTitle>
                                    <Layers className="h-4 w-4 text-cyan-600" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {data.topBlanksByShop.map((shop) => (
                                        <div key={shop.shopId}>
                                            <p className="text-sm font-semibold">{shop.shopName}</p>
                                            <div className="mt-1 space-y-1">
                                                {shop.blanks.map((b, i) => (
                                                    <div key={`${b.label}-${i}`} className="flex justify-between gap-2 text-sm">
                                                        <span className="mr-2 truncate text-muted-foreground">{b.label}</span>
                                                        <span className="shrink-0 tabular-nums">{t('reports.qty')} {b.qty}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
