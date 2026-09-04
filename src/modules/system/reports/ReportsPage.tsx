'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Package, DollarSign, ShoppingCart, UserPlus, Wallet, PiggyBank, Clock, Award, Wrench, Building2, Layers, Trophy, CreditCard, Receipt, Boxes, Percent, CalendarDays, Timer, Flame, Store, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { useReports, type ShopReportData, type AtelierReportData } from './useReports'

function Bar({ value, max, label, revenue }: { value: number; max: number; label: string; revenue: string | number }) {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-16 shrink-0 text-right text-muted-foreground">{label}</span>
            <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                <div className="h-full bg-primary/70 rounded-sm transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-20 shrink-0 text-right font-mono tabular-nums">{revenue}</span>
        </div>
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
    const { t } = useTranslation()

    const kpis = data ? [
        { label: t('reports.revenueThisMonth'), value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'text-green-600' },
        { label: t('reports.totalProfit'), value: formatCurrency(data.totalProfit), icon: PiggyBank, color: 'text-emerald-600' },
        { label: t('reports.avgOrderValue'), value: formatCurrency(data.avgOrderValue), icon: TrendingUp, color: 'text-blue-600' },
        { label: t('reports.newClients'), value: data.newClients.toString(), icon: UserPlus, color: 'text-indigo-600' },
        { label: t('reports.outstandingBalance'), value: formatCurrency(data.outstandingBalance), icon: Wallet, color: 'text-amber-600' },
        { label: t('dashboard.totalClients'), value: data.totalClients.toString(), icon: Users, color: 'text-blue-600' },
        { label: t('reports.ordersThisMonth'), value: data.totalOrders.toString(), icon: ShoppingCart, color: 'text-orange-600' },
        { label: t('reports.ordersToday'), value: data.todayOrders.toString(), icon: Clock, color: 'text-teal-600' },
        { label: t('stock.title'), value: data.totalProducts.toString(), icon: Package, color: 'text-purple-600' },
        { label: t('dashboard.lowStock'), value: data.lowStockCount.toString(), icon: BarChart3, color: 'text-red-600' },
        { label: t('dashboard.pendingRepairs'), value: data.pendingRepairs.toString(), icon: Clock, color: 'text-yellow-600' },
    ] : []

    const maxMonthly = data ? Math.max(...data.monthlyRevenue.map(m => m.revenue), 1) : 1

    return (
        <div className="space-y-6 max-w-[1000px]">
            <Header setPeriod={setPeriod} period={period} />
            {!data ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {kpis.map((kpi) => (
                            <Card key={kpi.label}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{kpi.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {data.salesByPaymentMethod && data.receivables && data.stockHealth && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base">{t('reports.salesByPaymentMethod')}</CardTitle>
                                    <CreditCard className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between"><span>{t('reports.payCash')}</span><span className="font-semibold tabular-nums">{formatCurrency(data.salesByPaymentMethod.cash)}</span></div>
                                    <div className="flex justify-between"><span>{t('reports.payCard')}</span><span className="font-semibold tabular-nums">{formatCurrency(data.salesByPaymentMethod.card)}</span></div>
                                    <div className="flex justify-between"><span>{t('reports.payInstruments')}</span><span className="font-semibold tabular-nums">{formatCurrency(data.salesByPaymentMethod.instruments)}</span></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base">{t('reports.receivables')}</CardTitle>
                                    <Receipt className="h-4 w-4 text-amber-600" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between"><span>{t('reports.receivablesOutstanding')}</span><span className="font-semibold tabular-nums">{formatCurrency(data.receivables.outstanding)}</span></div>
                                    <div className="flex justify-between"><span>{t('reports.receivablesPending')}</span><span className="font-semibold tabular-nums">{formatCurrency(data.receivables.pendingInstruments)}</span></div>
                                    <div className="flex justify-between"><span className="text-red-600">{t('reports.receivablesOverdue')}</span><span className="font-semibold tabular-nums text-red-600">{formatCurrency(data.receivables.overdueInstruments)}</span></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base">{t('reports.stockHealth')}</CardTitle>
                                    <Boxes className="h-4 w-4 text-purple-600" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between"><span>{t('reports.stockOutOfStock')}</span><span className="font-semibold tabular-nums text-red-600">{data.stockHealth.outOfStock}</span></div>
                                    <div className="flex justify-between"><span>{t('reports.stockLow')}</span><span className="font-semibold tabular-nums text-amber-600">{data.stockHealth.lowStock}</span></div>
                                    <div className="flex justify-between"><span>{t('reports.stockDead')}</span><span className="font-semibold tabular-nums">{data.stockHealth.deadStock}</span></div>
                                    <div className="flex justify-between border-t pt-2"><span>{t('reports.stockValue')}</span><span className="font-semibold tabular-nums">{formatCurrency(data.stockHealth.stockValue)}</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {((data.topClients && data.topClients.length > 0) || data.repeatClients !== undefined) && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {data.topClients && data.topClients.length > 0 && (
                                <Card className="lg:col-span-2">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-base">{t('reports.topClients')}</CardTitle>
                                        <Trophy className="h-4 w-4 text-yellow-600" />
                                    </CardHeader>
                                    <CardContent>
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
                                    </CardContent>
                                </Card>
                            )}

                            <div className="space-y-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.repeatClients')}</CardTitle>
                                        <Percent className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">{data.repeatClients ?? 0}%</p>
                                        <p className="text-xs text-muted-foreground mt-1">{t('reports.repeatClientsDesc')}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.dailyAvgSales')}</CardTitle>
                                        <CalendarDays className="h-4 w-4 text-teal-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">{data.dailyAvgSales ?? 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{t('reports.ordersPerDay')}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader><CardTitle className="text-lg">{t('reports.monthlyTrend')}</CardTitle></CardHeader>
                            <CardContent className="space-y-1.5">
                                {data.monthlyRevenue.map((m) => (
                                    <Bar key={m.month} value={m.revenue} max={maxMonthly} label={m.month} revenue={formatCurrency(String(m.revenue))} />
                                ))}
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">{t('reports.revenueByType')}</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between"><span>{t('orders.type_standard')}</span><span className="font-semibold">{formatCurrency(data.revenueByType.standard)}</span></div>
                                    <div className="flex justify-between"><span>{t('orders.type_remounting')}</span><span className="font-semibold">{formatCurrency(data.revenueByType.remounting)}</span></div>
                                    <div className="flex justify-between"><span>{t('orders.type_direct_sale')}</span><span className="font-semibold">{formatCurrency(data.revenueByType.direct_sale)}</span></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="text-lg">{t('reports.ordersByStatus')}</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between"><span>{t('common.pending')}</span><span className="font-semibold">{data.ordersByStatus.pending}</span></div>
                                    <div className="flex justify-between"><span>{t('common.completed')}</span><span className="font-semibold">{data.ordersByStatus.completed}</span></div>
                                    <div className="flex justify-between"><span>{t('common.cancelled')}</span><span className="font-semibold">{data.ordersByStatus.cancelled}</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {Object.keys(data.topProductsByCategory).length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-medium flex items-center gap-2"><Award className="h-5 w-5" />{t('reports.topProducts')}</h2>
                            {Object.entries(data.topProductsByCategory).map(([category, products]) => (
                                <Card key={category}>
                                    <CardHeader><CardTitle className="text-base">{category === 'uncategorized' ? t('reports.uncategorized') : (t(`stock.${category}`) || category)}</CardTitle></CardHeader>
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
                                                                    {p.brand && <span className="text-muted-foreground ml-1">({p.brand})</span>}
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
                </>
            )}
        </div>
    )
}

function AtelierReports({ data, period, setPeriod }: { data: AtelierReportData | null; period: string; setPeriod: (v: string) => void }) {
    const { t } = useTranslation()

    const kpis = data ? [
        { label: 'Lens Blanks', value: data.totalLensBlanks.toString(), icon: Layers, color: 'text-blue-600' },
        { label: 'Low Stock (Lens)', value: data.lowStockLensBlanks.toString(), icon: BarChart3, color: 'text-red-600' },
        { label: 'Work Orders', value: data.totalWorkOrders.toString(), icon: Wrench, color: 'text-orange-600' },
        { label: 'Pending', value: data.pendingWorkOrders.toString(), icon: Clock, color: 'text-yellow-600' },
        { label: 'Completed', value: data.completedWorkOrders.toString(), icon: Award, color: 'text-green-600' },
        { label: 'Optician Shops', value: data.totalOpticianShops.toString(), icon: Building2, color: 'text-purple-600' },
    ] : []

    const maxMonthly = data ? Math.max(...data.monthlyWorkOrders.map(m => m.count), 1) : 1

    return (
        <div className="space-y-6 max-w-[1000px]">
            <Header setPeriod={setPeriod} period={period} />
            {!data ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {kpis.map((kpi) => (
                            <Card key={kpi.label}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{kpi.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {data.workload && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base">{t('reports.workload')}</CardTitle>
                                    <Wrench className="h-4 w-4 text-orange-600" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between"><span>{t('common.pending')}</span><span className="font-semibold tabular-nums">{data.workload.pending}</span></div>
                                    <div className="flex justify-between"><span>{t('reports.workloadInProgress')}</span><span className="font-semibold tabular-nums">{data.workload.inProgress}</span></div>
                                    <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">{t('reports.workloadAvgAge')}</span><span className="font-semibold tabular-nums">{data.workload.avgAgeDays} {t('orders.days')}</span></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.avgTurnaroundDays')}</CardTitle>
                                    <Timer className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{data.avgTurnaroundDays ?? 0} {t('orders.days')}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('reports.avgTurnaroundDesc')}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.breakageRate')}</CardTitle>
                                    <Flame className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{data.breakageRate ?? 0}%</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('reports.breakageRateDesc')}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {(data.revenueByOptician || data.lensBlanksLowStock) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base">{t('reports.revenueByOptician')}</CardTitle>
                                    <Store className="h-4 w-4 text-purple-600" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {!data.revenueByOptician || data.revenueByOptician.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
                                    ) : (
                                        data.revenueByOptician.map((s) => (
                                            <div key={s.shopId} className="flex justify-between">
                                                <span className="truncate mr-2">{s.shopName}</span>
                                                <span className="font-semibold shrink-0 tabular-nums">{formatCurrency(s.total)}</span>
                                            </div>
                                        ))
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
                                        <div className="space-y-1.5 mt-3">
                                            {data.lensBlanksLowStock.items.map((b) => (
                                                <div key={b.id} className="flex justify-between text-sm">
                                                    <span className="truncate mr-2">{b.label}</span>
                                                    <span className="font-semibold shrink-0 tabular-nums text-red-600">{b.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader><CardTitle className="text-lg">Monthly Work Orders</CardTitle></CardHeader>
                            <CardContent className="space-y-1.5">
                                {data.monthlyWorkOrders.map((m) => (
                                    <Bar key={m.month} value={m.count} max={maxMonthly} label={m.month} revenue={String(m.count)} />
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-lg">Work Orders by Shop</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {data.workOrdersByShop.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No data</p>
                                ) : (
                                    data.workOrdersByShop.map((s) => (
                                        <div key={s.shopName} className="flex justify-between">
                                            <span className="truncate mr-2">{s.shopName}</span>
                                            <span className="font-semibold shrink-0">{s.count}</span>
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
                <option value="today">{t('reports.today')}</option>
                <option value="week">{t('reports.thisWeek')}</option>
                <option value="month">{t('reports.thisMonth')}</option>
                <option value="year">{t('reports.thisYear')}</option>
                <option value="all">{t('reports.all')}</option>
            </select>
        </div>
    )
}
