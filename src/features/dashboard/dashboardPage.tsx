'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Users,
    Package,
    AlertTriangle,
    ShoppingCart,
    Wrench,
    DollarSign,
    Smartphone,
    CheckCircle2,
    Clock,
    TrendingUp,
    Eye,
    Store,
    Plus,
} from 'lucide-react'
import { fetchDashboard, fetchReadyOrders } from './dashboard.api'
import { fetchOrderById, type Order } from '@/features/orders/orders.api'
import { OrderViewDialog } from './OrderViewDialog'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'

interface DashboardData {
    totalClients: number
    totalProducts: number
    lowStockCount: number
    todayOrders: number
    pendingRepairs: number
    totalRevenue: string
    recentOrders: {
        id: string
        orderNumber: number
        clientName: string
        totalAmount: string
        paidAmount: string
        status: string
        paymentStatus: string
        createdAt: string
    }[]
}

interface ReadyOrder {
    id: string
    orderNumber: number
    client: { name: string; familyName: string; phone: string }
    totalAmount: string
    createdAt: string
}

type KpiKey = 'totalRevenue' | 'totalClients' | 'todaySales' | 'lowStock' | 'pendingRepairs' | 'stockTitle'

const kpiConfig: { key: KpiKey; icon: typeof DollarSign; color: string; bg: string }[] = [
    { key: 'totalRevenue', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { key: 'totalClients', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { key: 'todaySales', icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { key: 'lowStock', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { key: 'pendingRepairs', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { key: 'stockTitle', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
]

const kpiLabels: Record<KpiKey, string> = {
    totalRevenue: 'dashboard.totalRevenue',
    totalClients: 'dashboard.totalClients',
    todaySales: 'dashboard.todaySales',
    lowStock: 'dashboard.lowStock',
    pendingRepairs: 'dashboard.pendingRepairs',
    stockTitle: 'stock.title',
}

export function DashboardPage() {
    const { t } = useTranslation()
    const { setView } = useViewStore()
    const user = useAuthStore((s) => s.user)
    const [data, setData] = useState<DashboardData | null>(null)
    const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([])
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const entity = user?.role === 'atelier' ? 'atelier' : 'shop'

    useEffect(() => {
        async function load() {
            try {
                const [reportsData, ordersData] = await Promise.all([
                    fetchDashboard(entity),
                    fetchReadyOrders(),
                ])
                setData(reportsData)
                setReadyOrders(ordersData)
            } catch (error) {
                console.error('Failed to fetch dashboard:', error)
            }
        }
        load()
    }, [])

    const kpis = useMemo(() => {
        if (!data) return []
        const values: Record<KpiKey, string> = {
            totalRevenue: formatCurrency(data.totalRevenue),
            totalClients: data.totalClients.toString(),
            todaySales: data.todayOrders.toString(),
            lowStock: data.lowStockCount.toString(),
            pendingRepairs: data.pendingRepairs.toString(),
            stockTitle: data.totalProducts.toString(),
        }
        return kpiConfig.map((cfg) => ({
            ...cfg,
            label: t(kpiLabels[cfg.key]),
            value: values[cfg.key],
        }))
    }, [data, t])

    async function openDetail(orderId: string) {
        try {
            const full = await fetchOrderById(orderId)
            setSelectedOrder(full)
            setDetailOpen(true)
        } catch (error) {
            toast.error('Failed to load order details')
        }
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                {t('common.loading')}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    {data.recentOrders.length} {t('dashboard.recentOrders')}
                </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.key} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {kpi.label}
                            </CardTitle>
                            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', kpi.bg)}>
                                <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setView('repairs')}>
                    <Wrench className="h-4 w-4" />
                    {t('nav.repairs')}
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setView('optician-shops')}>
                    <Store className="h-4 w-4" />
                    {t('nav.opticianShops')}
                </Button>
                <Button className="gap-2" onClick={() => setView('orders')}>
                    <Plus className="h-4 w-4" />
                    {t('orders.newOrder')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        {t('dashboard.readyForPickup')}
                        {readyOrders.length > 0 && (
                            <Badge variant="default" className="ml-1 text-xs">{readyOrders.length}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {readyOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 mb-3 opacity-30" />
                            <p className="text-sm">{t('dashboard.noReadyOrders')}</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {readyOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">
                                            #{order.orderNumber} — {order.client.name} {order.client.familyName}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {order.client.phone} · {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <span className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                                        <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => openDetail(order.id)}>
                                            <Eye className="h-3.5 w-3.5" />
                                            {t('common.view')}
                                        </Button>
                                        <Button size="sm" variant="outline" className="gap-1.5 h-8">
                                            <Smartphone className="h-3.5 w-3.5" />
                                            SMS
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <OrderViewDialog
                order={selectedOrder}
                open={detailOpen}
                onOpenChange={(open) => { setDetailOpen(open); if (!open) setSelectedOrder(null) }}
            />
        </div>
    )
}
