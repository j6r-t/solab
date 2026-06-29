'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Package, DollarSign, ShoppingCart } from 'lucide-react'

interface ReportData {
    totalRevenue: string
    totalOrders: number
    totalClients: number
    totalProducts: number
    lowStockCount: number
    pendingRepairs: number
    revenueByType: { standard: string; remounting: string; direct_sale: string }
    ordersByStatus: { pending: number; completed: number; cancelled: number }
    period: string
}

export function ReportsPage() {
    const { t } = useTranslation()
    const [data, setData] = useState<ReportData | null>(null)
    const [period, setPeriod] = useState('month')

    useEffect(() => {
        async function load() {
            const res = await fetch(`/api/reports?period=${period}`)
            if (res.ok) setData(await res.json())
        }
        load()
    }, [period])

    function formatTND(amount: string): string {
        return parseFloat(amount).toFixed(3) + ' TND'
    }

    const kpis = data ? [
        { label: t('dashboard.totalRevenue'), value: formatTND(data.totalRevenue), icon: DollarSign, color: 'text-green-600' },
        { label: t('dashboard.totalClients'), value: data.totalClients.toString(), icon: Users, color: 'text-blue-600' },
        { label: t('orders.total'), value: data.totalOrders.toString(), icon: ShoppingCart, color: 'text-orange-600' },
        { label: t('stock.title'), value: data.totalProducts.toString(), icon: Package, color: 'text-purple-600' },
        { label: t('dashboard.lowStock'), value: data.lowStockCount.toString(), icon: TrendingUp, color: 'text-red-600' },
        { label: t('dashboard.pendingRepairs'), value: data.pendingRepairs.toString(), icon: BarChart3, color: 'text-yellow-600' },
    ] : []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('nav.reports')}</h1>
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

            {!data ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">{t('reports.revenueByType')}</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between"><span>{t('orders.type_standard')}</span><span className="font-semibold">{formatTND(data.revenueByType.standard)}</span></div>
                                <div className="flex justify-between"><span>{t('orders.type_remounting')}</span><span className="font-semibold">{formatTND(data.revenueByType.remounting)}</span></div>
                                <div className="flex justify-between"><span>{t('orders.type_direct_sale')}</span><span className="font-semibold">{formatTND(data.revenueByType.direct_sale)}</span></div>
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
                </>
            )}
        </div>
    )
}
