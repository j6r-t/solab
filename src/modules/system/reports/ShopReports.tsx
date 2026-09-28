'use client'

import { useTranslation } from '@/lib/hooks/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart3, TrendingUp, Users, UserPlus, Wallet, PiggyBank, ShoppingCart, Award,
    Layers, Trophy, CreditCard, Receipt, Boxes, Percent, CalendarDays,
    AlertTriangle, DollarSign, Clock, Stethoscope, Glasses, Truck, PackageX, Gauge,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import type { ShopReportData } from './useReports'
import { EmptyState, Header, KpiCard, StatRow, monthLabel, weekdayLabel } from './report-widgets'
import { BucketBars, DonutCard, LineChart, MiniBars } from './report-charts'

export function ShopReports({ data, period, setPeriod }: { data: ShopReportData | null; period: string; setPeriod: (v: string) => void }) {
    const { t, locale } = useTranslation()
    const periodSuffix = t(`reports.periodLabel.${period}`)
    const vsLabel = t('reports.vsPrevPeriod')
    const noData = t('reports.noData')
    const withSuffix = (label: string) => `${label} — ${periodSuffix}`
    const catLabel = (c: string) => {
        const key = `stock.${c}`
        return t(key) !== key ? t(key) : c === 'uncategorized' ? t('reports.uncategorized') : c
    }

    const marginPct = data && Number(data.totalRevenue) > 0
        ? Math.round((Number(data.totalProfit) / Number(data.totalRevenue)) * 1000) / 10
        : 0

    const kpis = data
        ? [
            { label: withSuffix(t('reports.kpiRevenue')), value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'text-green-600', delta: data.deltas.revenue, deltaGoodUp: true, subtitle: undefined as string | undefined },
            { label: withSuffix(t('reports.kpiProfit')), value: formatCurrency(data.totalProfit), icon: PiggyBank, color: 'text-emerald-600', delta: data.deltas.profit, deltaGoodUp: true, subtitle: `${t('reports.margin')} : ${marginPct} %` },
            { label: withSuffix(t('reports.ordersCount')), value: data.totalOrders.toString(), icon: ShoppingCart, color: 'text-orange-600', delta: data.deltas.orders, deltaGoodUp: true, subtitle: undefined },
            { label: withSuffix(t('reports.avgOrderValue')), value: formatCurrency(data.avgOrderValue), icon: TrendingUp, color: 'text-blue-600', delta: data.deltas.avgOrderValue, deltaGoodUp: true, subtitle: undefined },
            { label: withSuffix(t('reports.newClients')), value: data.newClients.toString(), icon: UserPlus, color: 'text-indigo-600', delta: data.deltas.newClients, deltaGoodUp: true, subtitle: undefined },
        ]
        : []

    const monthLabels = data ? data.monthlyRevenue.map((m) => monthLabel(m.month, locale)) : []

    const typeItems = [
        { label: t('orders.type_standard'), value: Number(data?.revenueByType.standard ?? 0), fill: 'fill-emerald-500', dot: 'bg-emerald-500' },
        { label: t('orders.type_remounting'), value: Number(data?.revenueByType.remounting ?? 0), fill: 'fill-blue-500', dot: 'bg-blue-500' },
        { label: t('orders.type_direct_sale'), value: Number(data?.revenueByType.direct_sale ?? 0), fill: 'fill-amber-500', dot: 'bg-amber-500' },
    ]

    const payments = data?.salesByPaymentMethod
    const paymentItems = payments
        ? [
            { label: t('reports.payCash'), value: Number(payments.cash), fill: 'fill-emerald-500', dot: 'bg-emerald-500' },
            { label: t('reports.payCard'), value: Number(payments.card), fill: 'fill-blue-500', dot: 'bg-blue-500' },
            { label: t('reports.payInstruments'), value: Number(payments.instruments), fill: 'fill-amber-500', dot: 'bg-amber-500' },
        ]
        : []

    const bucketLabels: Record<string, string> = {
        lt200: t('reports.bucketLt200'),
        '200to500': t('reports.bucket200to500'),
        '500to1000': t('reports.bucket500to1000'),
        gt1000: t('reports.bucketGt1000'),
    }

    return (
        <div className="space-y-6 max-w-6xl">
            <Header setPeriod={setPeriod} period={period} />
            {!data ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.monthlyTrend')}</CardTitle>
                                <BarChart3 className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                {data.monthlyRevenue.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    <LineChart
                                        labels={monthLabels}
                                        formatValue={(v) => formatCurrency(Math.round(v))}
                                        series={[
                                            { label: t('reports.revenue'), strokeClass: 'stroke-emerald-500', dotClass: 'fill-emerald-500', bgClass: 'bg-emerald-500', points: data.monthlyRevenue.map((m) => m.revenue) },
                                            { label: t('reports.profit'), strokeClass: 'stroke-blue-500', dotClass: 'fill-blue-500', bgClass: 'bg-blue-500', points: data.monthlyRevenue.map((m) => m.profit) },
                                        ]}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <DonutCard
                            title={withSuffix(t('reports.revenueByType'))}
                            icon={Layers}
                            color="text-purple-600"
                            items={typeItems}
                            emptyText={noData}
                            centerLabel={t('orders.total')}
                            wide
                        />

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{withSuffix(t('reports.ordersByStatus'))}</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <StatRow label={t('common.pending')} value={data.ordersByStatus.pending} />
                                <StatRow label={t('common.completed')} value={data.ordersByStatus.completed} />
                                <div className="border-t pt-2" />
                                <StatRow label={t('reports.cancellations')} value={data.cancellations.count} />
                                <StatRow label={t('reports.revenueLost')} value={formatCurrency(data.cancellations.revenueLost)} valueClass="text-red-600" />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <DonutCard
                            title={withSuffix(t('reports.salesByPaymentMethod'))}
                            icon={CreditCard}
                            color="text-blue-600"
                            items={paymentItems}
                            emptyText={noData}
                            centerLabel={t('orders.total')}
                        />

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.receivables')}</CardTitle>
                                <Receipt className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.receivables ? (
                                    <>
                                        <StatRow label={t('reports.receivablesOutstanding')} value={formatCurrency(data.receivables.outstanding)} />
                                        <StatRow label={t('reports.receivablesPending')} value={formatCurrency(data.receivables.pendingInstruments)} />
                                        <StatRow label={t('reports.receivablesOverdue')} value={formatCurrency(data.receivables.overdueInstruments)} valueClass="text-red-600" />
                                    </>
                                ) : (
                                    <EmptyState text={noData} />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.collections')} — {t('reports.last12Months')}</CardTitle>
                                <Wallet className="h-4 w-4 text-teal-600" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <StatRow label={t('reports.avgDaysToCash')} value={`${data.collections.avgDaysToCash} ${t('orders.days')}`} />
                                <StatRow label={t('reports.bounceRate')} value={`${data.collections.bounceRate} %`} valueClass={data.collections.bounceRate > 0 ? 'text-amber-600' : undefined} />
                                <StatRow label={t('reports.cashedCount')} value={data.collections.cashedCount} />
                                <StatRow label={t('reports.bouncedCount')} value={data.collections.bouncedCount} valueClass={data.collections.bouncedCount > 0 ? 'text-red-600' : undefined} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.topClients')}</CardTitle>
                                <Trophy className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                {!data.topClients || data.topClients.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    <div className="overflow-x-auto overflow-y-auto max-h-[340px]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted text-muted-foreground sticky top-0 z-10">
                                                    <th className="text-left py-2 pr-4">{t('clients.name')}</th>
                                                    <th className="text-right py-2 px-4">{t('reports.ordersCount')}</th>
                                                    <th className="text-right py-2 pl-4">{t('reports.revenue')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.topClients.map((c) => (
                                                    <tr key={c.clientId} className="border-b last:border-0">
                                                        <td className="py-2 pr-4 font-medium">{c.name}</td>
                                                        <td className="text-right py-2 px-4 tabular-nums">{c.ordersCount}</td>
                                                        <td className="text-right py-2 pl-4 tabular-nums">{formatCurrency(c.totalSpent)}</td>
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
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.repeatClients')}</CardTitle>
                                    <Percent className="h-4 w-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{data.repeatClients ?? 0} %</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{t('reports.repeatClientsDesc')}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.dailyAvgSales')}</CardTitle>
                                    <CalendarDays className="h-4 w-4 text-teal-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{data.dailyAvgSales ?? 0}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{t('reports.ordersPerDay')}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.paretoTitle')}</CardTitle>
                                <Gauge className="h-4 w-4 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{data.pareto.topDecileSharePct} %</p>
                                <p className="mt-1 text-xs text-muted-foreground">{t('reports.paretoDesc', { pct: data.pareto.topDecileSharePct })}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{t('reports.activeClients', { count: data.pareto.activeClients })}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.revenueSplitTitle')}</CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <StatRow label={t('reports.newClients')} value={formatCurrency(data.revenueSplit.newClientsRevenue)} />
                                <StatRow label={t('reports.returningClients')} value={formatCurrency(data.revenueSplit.returningClientsRevenue)} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.doctorRanking')}</CardTitle>
                                <Stethoscope className="h-4 w-4 text-cyan-600" />
                            </CardHeader>
                            <CardContent>
                                {data.doctorRanking.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    <div className="overflow-x-auto overflow-y-auto max-h-[340px]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted text-muted-foreground sticky top-0 z-10">
                                                    <th className="text-left py-2 pr-4">{t('clients.name')}</th>
                                                    <th className="text-right py-2 px-4">{t('reports.ordersCount')}</th>
                                                    <th className="text-right py-2 pl-4">{t('reports.revenue')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.doctorRanking.map((d) => (
                                                    <tr key={d.doctorId} className="border-b last:border-0">
                                                        <td className="py-2 pr-4 font-medium">{d.name}</td>
                                                        <td className="text-right py-2 px-4 tabular-nums">{d.orders}</td>
                                                        <td className="text-right py-2 pl-4 tabular-nums">{formatCurrency(d.revenue)}</td>
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
                                <CardTitle className="text-base">{t('reports.powerDemand')}</CardTitle>
                                <Glasses className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="mb-1.5 text-xs text-muted-foreground">{t('reports.sphBands')}</p>
                                    <MiniBars
                                        items={data.powerDemand.sphBands.map((b) => ({ label: b.band, value: b.count }))}
                                        formatValue={(v) => String(v)}
                                    />
                                </div>
                                <div>
                                    <p className="mb-1.5 text-xs text-muted-foreground">{t('reports.cylBands')}</p>
                                    <MiniBars
                                        items={data.powerDemand.cylBands.map((b) => ({ label: b.band, value: b.count }))}
                                        formatValue={(v) => String(v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.supplierBalances')}</CardTitle>
                                <Truck className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                {data.supplierBalances.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    <div className="overflow-x-auto overflow-y-auto max-h-[340px]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted text-muted-foreground sticky top-0 z-10">
                                                    <th className="text-left py-2 pr-4">{t('reports.supplier')}</th>
                                                    <th className="text-right py-2 px-4">{t('reports.purchases')}</th>
                                                    <th className="text-right py-2 pl-4">{t('reports.outstanding')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.supplierBalances.map((s) => (
                                                    <tr key={s.fournisseurId} className="border-b last:border-0">
                                                        <td className="py-2 pr-4 font-medium">{s.name}</td>
                                                        <td className="text-right py-2 px-4 tabular-nums">{formatCurrency(s.purchases)}</td>
                                                        <td className={`text-right py-2 pl-4 tabular-nums ${Number(s.outstanding) > 0 ? 'text-red-600' : ''}`}>{formatCurrency(s.outstanding)}</td>
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
                                <CardTitle className="text-base">{t('reports.riskCover')}</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <StatRow label={t('reports.cancellations')} value={data.cancellations.count} />
                                <StatRow label={t('reports.revenueLost')} value={formatCurrency(data.cancellations.revenueLost)} valueClass="text-red-600" />
                                <div className="border-t pt-3">
                                    <p className="mb-2 text-xs text-muted-foreground">{t('reports.weeksOfCover')}</p>
                                    <MiniBars
                                        items={data.weeksOfCover.map((w) => ({
                                            label: catLabel(w.category),
                                            value: w.weeks ?? 0,
                                            display: w.weeks === null ? '∞' : String(w.weeks),
                                        }))}
                                        formatValue={(v) => String(v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.restockList')}</CardTitle>
                                <PackageX className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                {data.restockList.length === 0 ? (
                                    <EmptyState text={noData} />
                                ) : (
                                    <div className="overflow-x-auto overflow-y-auto max-h-[340px]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted text-muted-foreground sticky top-0 z-10">
                                                    <th className="text-left py-2 pr-4">{t('reports.product')}</th>
                                                    <th className="text-right py-2 px-4">{t('reports.qty')}</th>
                                                    <th className="text-right py-2 pl-4">{t('reports.supplier')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.restockList.map((p) => (
                                                    <tr key={p.productId} className="border-b last:border-0">
                                                        <td className="py-2 pr-4">
                                                            <span className="font-medium">{p.name}</span>
                                                            {p.brand && <span className="ml-1 text-muted-foreground">({p.brand})</span>}
                                                        </td>
                                                        <td className="text-right py-2 px-4 font-semibold tabular-nums text-red-600">{p.quantity}</td>
                                                        <td className="py-2 pl-4 text-right text-muted-foreground">{p.supplierName ?? '—'}</td>
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
                                <CardTitle className="text-base">{t('reports.stockHealth')}</CardTitle>
                                <Boxes className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {data.stockHealth ? (
                                    <>
                                        <StatRow label={t('reports.stockOutOfStock')} value={data.stockHealth.outOfStock} valueClass="text-red-600" />
                                        <StatRow label={t('reports.stockLow')} value={data.stockHealth.lowStock} valueClass="text-amber-600" />
                                        <StatRow label={t('reports.stockDead')} value={data.stockHealth.deadStock} />
                                        <StatRow label={t('reports.stockValue')} value={formatCurrency(data.stockHealth.stockValue)} />
                                    </>
                                ) : (
                                    <EmptyState text={noData} />
                                )}
                                <div className="border-t pt-3">
                                    <p className="mb-2 text-xs text-muted-foreground">{t('reports.marginByCat')}</p>
                                    <MiniBars
                                        items={data.marginByCategory.map((m) => ({ label: catLabel(m.category), value: m.marginPct }))}
                                        formatValue={(v) => `${v} %`}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {Object.keys(data.topProductsByCategory).length > 0 && (
                        <div className="space-y-4">
                            <h2 className="flex items-center gap-2 text-lg font-medium"><Award className="h-5 w-5" />{t('reports.topProducts')}</h2>
                            {Object.entries(data.topProductsByCategory).map(([category, products]) => (
                                <Card key={category}>
                                    <CardHeader><CardTitle className="text-base">{catLabel(category)}</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto overflow-y-auto max-h-[340px]">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted text-muted-foreground sticky top-0 z-10">
                                                        <th className="text-left py-2 pr-4">{t('reports.product')}</th>
                                                        <th className="text-right py-2 px-4">{t('reports.qty')}</th>
                                                        <th className="text-right py-2 px-4">{t('reports.revenue')}</th>
                                                        <th className="text-right py-2 pl-4">{t('reports.profit')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {products.map((p) => {
                                                        const revenue = Number(p.price) * p.quantity
                                                        const cost = p.costPrice ? Number(p.costPrice) * p.quantity : null
                                                        const profit = cost !== null ? revenue - cost : null
                                                        return (
                                                            <tr key={p.productId} className="border-b last:border-0">
                                                                <td className="py-2 pr-4">
                                                                    <span className="font-medium">{p.name}</span>
                                                                    {p.brand && <span className="ml-1 text-muted-foreground">({p.brand})</span>}
                                                                </td>
                                                                <td className="text-right py-2 px-4 tabular-nums">{p.quantity}</td>
                                                                <td className="text-right py-2 px-4 tabular-nums">{formatCurrency(String(revenue))}</td>
                                                                <td className="text-right py-2 pl-4 tabular-nums">{profit !== null ? formatCurrency(String(profit)) : '\u2014'}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.byWeekday')}</CardTitle>
                                <BarChart3 className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <MiniBars
                                    items={data.salesHeatmap.byWeekday.map((v, d) => ({ label: weekdayLabel(d, locale), value: v }))}
                                    formatValue={(v) => String(v)}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.byHour')}</CardTitle>
                                <Clock className="h-4 w-4 text-teal-600" />
                            </CardHeader>
                            <CardContent>
                                <MiniBars
                                    items={data.salesHeatmap.byHour.slice(8, 24).map((v, i) => ({ label: `${i + 8}h`, value: v }))}
                                    formatValue={(v) => String(v)}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{t('reports.orderValueBuckets')}</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <BucketBars
                                    items={data.orderValueBuckets.map((b) => ({ label: bucketLabels[b.bucket] ?? b.bucket, count: b.count }))}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
