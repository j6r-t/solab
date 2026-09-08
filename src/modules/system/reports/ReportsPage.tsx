'use client'

import { useState, type ComponentType } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart3, TrendingUp, Users, UserPlus, Wallet, PiggyBank, ShoppingCart, Award, Wrench,
    Building2, Layers, Trophy, CreditCard, Receipt, Boxes, Percent, CalendarDays, Timer, Flame, Store,
    AlertTriangle, DollarSign, Clock, Stethoscope, Glasses, Truck, PackageX, Gauge, Hourglass, Activity,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { useReports, type ShopReportData, type AtelierReportData } from './useReports'

type IconType = ComponentType<{ className?: string }>

function localeTag(locale: string): string {
    return locale === 'fr' ? 'fr-FR' : 'en-GB'
}

function monthLabel(month: string, locale: string): string {
    const [y, m] = month.split('-').map(Number)
    return new Intl.DateTimeFormat(localeTag(locale), { month: 'short', year: '2-digit' }).format(new Date(y, m - 1, 1))
}

function weekLabel(weekStart: string, locale: string): string {
    const [y, m, d] = weekStart.split('-').map(Number)
    return new Intl.DateTimeFormat(localeTag(locale), { day: '2-digit', month: 'short' }).format(new Date(y, m - 1, d))
}

function weekdayLabel(dayIdx: number, locale: string): string {
    return new Intl.DateTimeFormat(localeTag(locale), { weekday: 'short' }).format(new Date(2023, 9, 1 + dayIdx))
}

function shortDateLabel(iso: string, locale: string): string {
    return new Intl.DateTimeFormat(localeTag(locale), { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function EmptyState({ text }: { text: string }) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{text}</p>
}

function DeltaBadge({ changePct, goodWhenUp = true }: { changePct: number | null | undefined; goodWhenUp?: boolean }) {
    if (changePct === null || changePct === undefined) return null
    if (changePct === 0) {
        return <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">=</span>
    }
    const up = changePct > 0
    const good = up === goodWhenUp
    return (
        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${good ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
            {up ? '▲' : '▼'} {Math.abs(changePct)} %
        </span>
    )
}

function StatRow({ label, value, valueClass, muted }: { label: string; value: string | number; valueClass?: string; muted?: boolean }) {
    return (
        <div className="flex justify-between gap-2 text-sm">
            <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
            <span className={`shrink-0 font-semibold tabular-nums ${valueClass ?? ''}`}>{value}</span>
        </div>
    )
}

function KpiCard({ label, value, icon: Icon, color, delta, deltaGoodUp = true, subtitle, vsLabel }: {
    label: string
    value: string
    icon: IconType
    color: string
    delta?: number | null
    deltaGoodUp?: boolean
    subtitle?: string
    vsLabel?: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <DeltaBadge changePct={delta} goodWhenUp={deltaGoodUp} />
                    {delta !== null && delta !== undefined && vsLabel && (
                        <span className="text-xs text-muted-foreground">{vsLabel}</span>
                    )}
                </div>
                {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
            </CardContent>
        </Card>
    )
}

function MiniBars({ items, formatValue, valueClass }: {
    items: { label: string; value: number; display?: string }[]
    formatValue: (v: number) => string
    valueClass?: string
}) {
    if (items.length === 0) return null
    const max = Math.max(1, ...items.map((i) => i.value))
    return (
        <div className="space-y-1.5">
            {items.map((it, idx) => (
                <div key={`${it.label}-${idx}`} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 truncate text-right text-muted-foreground sm:w-32" title={it.label}>{it.label}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                        <div className="h-full rounded-sm bg-primary/70 transition-all" style={{ width: `${(it.value / max) * 100}%` }} />
                    </div>
                    <span className={`w-16 shrink-0 text-right font-mono tabular-nums ${valueClass ?? ''}`}>{it.display ?? formatValue(it.value)}</span>
                </div>
            ))}
        </div>
    )
}

function BucketBars({ items }: { items: { label: string; count: number }[] }) {
    const max = Math.max(1, ...items.map((i) => i.count))
    return (
        <div className="flex items-end justify-around gap-2">
            {items.map((it) => (
                <div key={it.label} className="flex w-full max-w-[56px] flex-col items-center gap-1">
                    <span className="text-xs font-semibold tabular-nums">{it.count}</span>
                    <div className="flex h-16 w-full items-end">
                        <div className="w-full rounded-t-sm bg-primary/70 transition-all" style={{ height: `${Math.max(2, (it.count / max) * 100)}%` }} />
                    </div>
                    <span className="text-center text-[10px] leading-tight text-muted-foreground">{it.label}</span>
                </div>
            ))}
        </div>
    )
}

function LineChart({ series, labels, formatValue }: {
    series: { label: string; strokeClass: string; dotClass: string; bgClass: string; points: number[] }[]
    labels: string[]
    formatValue: (v: number) => string
}) {
    const W = 340
    const H = 150
    const padL = 6
    const padR = 6
    const padT = 16
    const padB = 18
    const innerW = W - padL - padR
    const innerH = H - padT - padB
    let maxV = 1
    for (const s of series) for (const p of s.points) if (p > maxV) maxV = p
    const n = labels.length
    const xAt = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
    const yAt = (v: number) => padT + (1 - v / maxV) * innerH
    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
                {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                    <line
                        key={f}
                        x1={padL}
                        x2={W - padR}
                        y1={padT + f * innerH}
                        y2={padT + f * innerH}
                        stroke="currentColor"
                        className="text-muted-foreground/40"
                        strokeWidth={0.6}
                        strokeDasharray="3 3"
                    />
                ))}
                <text x={padL} y={padT - 5} fontSize={7} className="fill-muted-foreground">{formatValue(maxV)}</text>
                {labels.map((lb, i) =>
                    i % 2 === 0 ? (
                        <text key={`${lb}-${i}`} x={xAt(i)} y={H - 4} textAnchor="middle" fontSize={6.5} className="fill-muted-foreground">{lb}</text>
                    ) : null
                )}
                {series.map((s) => (
                    <g key={s.label}>
                        <polyline
                            fill="none"
                            strokeWidth={1.6}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            className={s.strokeClass}
                            points={s.points.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ')}
                        />
                        {s.points.map((v, i) => (
                            <circle key={i} cx={xAt(i).toFixed(1)} cy={yAt(v).toFixed(1)} r={2.4} className={s.dotClass}>
                                <title>{`${labels[i]} — ${s.label} : ${formatValue(v)}`}</title>
                            </circle>
                        ))}
                    </g>
                ))}
            </svg>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                {series.map((s) => (
                    <span key={s.label} className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <span className={`h-[3px] w-6 rounded-full ${s.bgClass}`} />
                        {s.label}
                    </span>
                ))}
            </div>
        </div>
    )
}

function polarPoint(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutSlicePath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number) {
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    const p1 = polarPoint(cx, cy, rOuter, startDeg)
    const p2 = polarPoint(cx, cy, rOuter, endDeg)
    const p3 = polarPoint(cx, cy, rInner, endDeg)
    const p4 = polarPoint(cx, cy, rInner, startDeg)
    const f = (n: number) => n.toFixed(2)
    return `M ${f(p1.x)} ${f(p1.y)} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${f(p2.x)} ${f(p2.y)} L ${f(p3.x)} ${f(p3.y)} A ${rInner} ${rInner} 0 ${largeArc} 0 ${f(p4.x)} ${f(p4.y)} Z`
}

function Donut({ slices, total, centerLabel, centerText, className }: {
    slices: { value: number; pct: number; fill: string }[]
    total: number
    centerLabel: string
    centerText?: string
    className?: string
}) {
    const c = 50
    const rOuter = 46
    const rInner = 29
    const sweepOf = (pct: number) => Math.min((pct / 100) * 360, 359.98)
    const arcs = slices.map((s, i) => {
        const start = slices.slice(0, i).reduce((sum, prev) => sum + sweepOf(prev.pct), 0)
        const sweep = sweepOf(s.pct)
        return { fill: s.fill, pct: s.pct, start, end: start + sweep, mid: start + sweep / 2 }
    })
    return (
        <svg viewBox="0 0 100 100" className={className ?? 'h-28 w-28 shrink-0'} role="img">
            {arcs.map((a, i) => {
                const labelPos = polarPoint(c, c, (rOuter + rInner) / 2, a.mid)
                return (
                    <g key={i}>
                        <path d={donutSlicePath(c, c, rOuter, rInner, a.start, a.end)} className={a.fill} stroke="var(--card)" strokeWidth={1} />
                        {a.pct >= 8 && (
                            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central" fontSize={9} className="fill-foreground font-medium">
                                {Math.round(a.pct)} %
                            </text>
                        )}
                    </g>
                )
            })}
            <text x={c} y={46} textAnchor="middle" fontSize={6.5} className="fill-muted-foreground">{centerLabel}</text>
            <text x={c} y={57} textAnchor="middle" fontSize={8.5} fontWeight={600} className="fill-foreground">{centerText ?? formatCurrency(total)}</text>
        </svg>
    )
}

function DonutCard({ title, icon: Icon, color, items, emptyText, centerLabel, centerText, formatValue, wide }: {
    title: string
    icon: IconType
    color: string
    items: { label: string; value: number; fill: string; dot: string }[]
    emptyText: string
    centerLabel: string
    centerText?: string
    formatValue?: (v: number) => string
    wide?: boolean
}) {
    const fmt = formatValue ?? formatCurrency
    const total = items.reduce((s, i) => s + i.value, 0)
    const slices = items.filter((i) => i.value > 0).map((i) => ({ ...i, pct: total > 0 ? (i.value / total) * 100 : 0 }))
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent className={wide ? 'space-y-3' : 'flex items-center gap-4'}>
                {slices.length > 0 ? (
                    <Donut
                        slices={slices}
                        total={total}
                        centerLabel={centerLabel}
                        centerText={centerText}
                        className={wide ? 'mx-auto h-auto w-full max-w-[200px]' : undefined}
                    />
                ) : (
                    <div className={`h-28 w-28 rounded-full border border-dashed ${wide ? 'mx-auto' : 'shrink-0'}`} />
                )}
                {wide ? (
                    <div className="space-y-2">
                        {slices.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
                        {slices.map((s) => (
                            <div key={s.label} className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${s.dot}`} />
                                <span className="flex-1 truncate text-sm">{s.label}</span>
                                <span className="text-sm font-semibold tabular-nums">{fmt(s.value)}</span>
                                <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{Math.round(s.pct)} %</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="min-w-0 flex-1 space-y-2">
                        {slices.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
                        {slices.map((s) => (
                            <div key={s.label}>
                                <div className="flex items-center gap-2">
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${s.dot}`} />
                                    <span className="flex-1 truncate text-sm">{s.label}</span>
                                    <span className="text-sm font-semibold tabular-nums">{fmt(s.value)}</span>
                                </div>
                                <p className="text-right text-xs text-muted-foreground">{Math.round(s.pct)} %</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function ReportsPage() {
    const { user } = useAuthStore()
    const entity = user?.role === 'atelier' ? 'atelier' : 'shop'
    const [period, setPeriod] = useState('month')

    const { data } = useReports({ period, entity })
    const report = data ?? null

    if (entity === 'atelier') {
        return <AtelierReports data={report as AtelierReportData} period={period} setPeriod={setPeriod} />
    }

    return <ShopReports data={report as ShopReportData} period={period} setPeriod={setPeriod} />
}

function ShopReports({ data, period, setPeriod }: { data: ShopReportData | null; period: string; setPeriod: (v: string) => void }) {
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
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
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
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
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
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
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
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
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
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b text-muted-foreground">
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

function AtelierReports({ data, period, setPeriod }: { data: AtelierReportData | null; period: string; setPeriod: (v: string) => void }) {
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
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
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
                                                        <td className="py-2 pl-3 text-right tabular-nums text-muted-foreground">{shortDateLabel(p.lastActivity, locale)}</td>
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
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
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
                    </div>
                </>
            )}
        </div>
    )
}

function Header({ period, setPeriod }: { period: string; setPeriod: (v: string) => void }) {
    const { t } = useTranslation()
    return (
        <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-medium">{t('nav.reports')}</h1>
            <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-10 px-3 rounded-md border bg-background text-sm"
            >
                <option value="today">{t('reports.periodLabel.today')}</option>
                <option value="week">{t('reports.periodLabel.week')}</option>
                <option value="month">{t('reports.periodLabel.month')}</option>
                <option value="year">{t('reports.periodLabel.year')}</option>
                <option value="all">{t('reports.periodLabel.all')}</option>
            </select>
        </div>
    )
}
