'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
    Users,
    Package,
    AlertTriangle,
    ShoppingCart,
    Wrench,
    DollarSign,
    CheckCircle2,
    Loader2,
    TrendingUp,
    Eye,
    Store,
    Plus,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { useReports, type ShopReportData, type AtelierReportData } from '@/modules/system/reports/useReports'
import { useOrders } from '@/modules/sales/orders/useOrders'
import { fetchOrderById, updateOrder, type Order } from '@/modules/sales/orders/orders.api'
import { OrderDetailDialog } from '@/modules/sales/orders/OrderDetailDialog'

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
    const queryClient = useQueryClient()
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [statusConfirmTarget, setStatusConfirmTarget] = useState<{ orderId: string; status: string } | null>(null)
    const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())

    const entity = user?.role === 'atelier' ? 'atelier' : 'shop'
    const isAtelier = entity === 'atelier'
    const role = user?.role || 'admin'
    const canShop = role === 'admin' || role === 'shop'
    const canAtelier = role === 'admin' || role === 'atelier'

    const { data, isLoading } = useReports({ period: 'month', entity })
    const { data: readyOrdersData, refetch: refetchReadyOrders } = useOrders({ status: 'ready' }, { enabled: canShop })
    const readyOrders = readyOrdersData ?? []

    const kpis = useMemo(() => {
        if (!data) return []
        const values: Record<KpiKey, string> = isAtelier ? {
            totalRevenue: formatCurrency((data as AtelierReportData).totalRevenue || '0'),
            totalClients: (data as AtelierReportData).totalOpticianShops?.toString() || '0',
            todaySales: (data as AtelierReportData).completedWorkOrders?.toString() || '0',
            lowStock: (data as AtelierReportData).lowStockLensBlanks?.toString() || '0',
            pendingRepairs: (data as AtelierReportData).pendingWorkOrders?.toString() || '0',
            stockTitle: (data as AtelierReportData).totalLensBlanks?.toString() || '0',
        } : {
            totalRevenue: formatCurrency((data as ShopReportData).totalRevenue),
            totalClients: (data as ShopReportData).totalClients?.toString() || '0',
            todaySales: (data as ShopReportData).todayOrders?.toString() || '0',
            lowStock: (data as ShopReportData).lowStockCount?.toString() || '0',
            pendingRepairs: (data as ShopReportData).pendingRepairs?.toString() || '0',
            stockTitle: (data as ShopReportData).totalProducts?.toString() || '0',
        }
        return kpiConfig.map((cfg) => ({
            ...cfg,
            label: t(kpiLabels[cfg.key]),
            value: values[cfg.key] || '0',
        }))
    }, [data, t, isAtelier])

    async function openDetail(orderId: string) {
        try {
            const full = await fetchOrderById(orderId)
            setSelectedOrder(full)
            setDetailOpen(true)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load order details')
        }
    }

    async function handleStatusUpdate(orderId: string, status: string) {
        setUpdatingOrders((prev) => new Set(prev).add(orderId))
        try {
            await updateOrder(orderId, { status })
            toast.success(t('orders.statusUpdated'))
            setSelectedOrder(null)
            setDetailOpen(false)
            await refetchReadyOrders()
            await queryClient.invalidateQueries({ queryKey: ['reports'] })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update order')
        } finally {
            setUpdatingOrders((prev) => { const next = new Set(prev); next.delete(orderId); return next })
            setStatusConfirmTarget(null)
        }
    }

    if (isLoading || !data) {
        return (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t('common.loading')}
            </div>
        )
    }

    const recentCount = isAtelier ? (data as AtelierReportData).recentWorkOrders?.length || 0 : (data as ShopReportData).recentOrders?.length || 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    {recentCount} {isAtelier ? 'Work Orders' : t('dashboard.recentOrders')}
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
                {canAtelier && (
                    <Button variant="outline" className="gap-2" onClick={() => setView('atelier-work-orders')}>
                        <Wrench className="h-4 w-4" />
                        {t('nav.atelierWorkOrders')}
                    </Button>
                )}
                {canAtelier && (
                    <Button variant="outline" className="gap-2" onClick={() => setView('optician-shops')}>
                        <Store className="h-4 w-4" />
                        {t('nav.opticianShops')}
                    </Button>
                )}
                {canShop && (
                    <Button className="gap-2" onClick={() => setView('orders')}>
                        <Plus className="h-4 w-4" />
                        {t('orders.newOrder')}
                    </Button>
                )}
            </div>

            {canShop && (
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            )}

            <OrderDetailDialog
                order={selectedOrder}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onConfirmStatusUpdate={(orderId, status) => setStatusConfirmTarget({ orderId, status })}
                updatingOrders={updatingOrders}
            />

            <ConfirmDialog
                open={!!statusConfirmTarget}
                onOpenChange={() => setStatusConfirmTarget(null)}
                title="Update Order Status"
                description={statusConfirmTarget ? `Move order to "${statusConfirmTarget.status}"?` : ''}
                confirmLabel="Update"
                cancelLabel={t('common.cancel')}
                onConfirm={() => statusConfirmTarget && handleStatusUpdate(statusConfirmTarget.orderId, statusConfirmTarget.status)}
            />
        </div>
    )
}
