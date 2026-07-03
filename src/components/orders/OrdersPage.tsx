'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Search, ShoppingCart, CheckCircle, XCircle, Clock, Printer, Trash2, Loader2 } from 'lucide-react'
import { OrderForm, type OrderFormData } from './OrderForm'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

interface OrderItem {
    id: string
    productId: string
    quantity: number
    unitPrice: string
    product: { name: string; brand: string }
}

interface Payment {
    id: string
    amount: string
    type: string
}

interface Repair {
    id: string
    type: string
    status: string
    price: string
    expectedCompletionDate: string
}

interface Prescription {
    id: string
    doctor: { name: string } | null
    sphRight: string
    cylRight: string
    axisRight: number
    addRight: string
    pdRight: number
    sphLeft: string
    cylLeft: string
    axisLeft: number
    addLeft: string
    pdLeft: number
}

interface Order {
    id: string
    orderNumber: number
    client: { id: string; name: string; familyName: string; phone: string }
    totalAmount: string
    totalPaid: string
    orderType: string
    status: string
    paymentStatus: string
    items: OrderItem[]
    payments: Payment[]
    repairs: Repair[]
    prescription: Prescription | null
    turnaroundDays: number | null
    createdAt: string
}

const paymentColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    fullyPaid: 'default',
    partiallyPaid: 'secondary',
    unpaid: 'destructive',
}

interface StatusStyle {
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: typeof Clock
    bg: string
    text: string
    border: string
}

const statusStyles: Record<string, StatusStyle> = {
    pending: {
        variant: 'outline', icon: Clock,
        bg: 'bg-status-pending', text: 'text-status-pending', border: 'border-status-pending',
    },
    ready: {
        variant: 'outline', icon: CheckCircle,
        bg: 'bg-status-ready', text: 'text-status-ready', border: 'border-status-ready',
    },
    completed: {
        variant: 'outline', icon: CheckCircle,
        bg: 'bg-status-completed', text: 'text-status-completed', border: 'border-status-completed',
    },
    cancelled: {
        variant: 'destructive', icon: XCircle,
        bg: '', text: '', border: '',
    },
}

function getReadyDate(order: Order): string | null {
    if (!order.turnaroundDays) return null
    const created = new Date(order.createdAt)
    created.setDate(created.getDate() + order.turnaroundDays)
    return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function OrdersPage() {
    const { t } = useTranslation()
    const [orders, setOrders] = useState<Order[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [statusConfirmTarget, setStatusConfirmTarget] = useState<{ orderId: string; status: string } | null>(null)
    const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const params = new URLSearchParams()
            if (debouncedSearch) params.set('search', debouncedSearch)
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/orders?${params}`)
            if (res.ok) setOrders(await res.json())
            setLoading(false)
        }
        load()
    }, [debouncedSearch, statusFilter])

    async function reFetch() {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (statusFilter) params.set('status', statusFilter)
        const res = await fetch(`/api/orders?${params}`)
        if (res.ok) setOrders(await res.json())
    }

    async function handleCreate(data: OrderFormData) {
        setSaving(true)
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(JSON.stringify(body.error))
            }
            toast.success(t('orders.created'))
            await delay(1500)
            setCreateOpen(false)
            await reFetch()
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(order: Order) {
        await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
        setDeleteTarget(null)
        await reFetch()
        toast.success(t('orders.deleted'))
    }

    async function handleStatusUpdate(orderId: string, status: string) {
        setUpdatingOrders((prev) => new Set(prev).add(orderId))
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.error || 'Failed to update status')
            }
            toast.success(t('orders.statusUpdated'))
            setSelectedOrder(null)
            setDetailOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update order')
        } finally {
            setUpdatingOrders((prev) => { const next = new Set(prev); next.delete(orderId); return next })
            setStatusConfirmTarget(null)
        }
    }

    function confirmStatusUpdate(orderId: string, status: string) {
        setStatusConfirmTarget({ orderId, status })
    }

    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    const typeLabel = (type: string) => {
        const labels: Record<string, string> = { standard: 'Prescription Eyewear', remounting: 'Remounting', direct_sale: 'Direct Sale' }
        return labels[type] || type
    }

    const showEmptyState = !loading && orders.length === 0 && !debouncedSearch
    const showNoResults = !loading && orders.length === 0 && debouncedSearch

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('nav.orders')}</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage client orders and track status</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by client name or order ID"
                        className="pl-10 h-10"
                    />
                </div>
                <Button variant="outline" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('orders.newOrder')}
                </Button>
            </div>

            {loading && orders.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : showEmptyState ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('empty.noOrders')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">{t('empty.noOrdersDesc')}</p>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('empty.noOrdersAction')}
                    </Button>
                </div>
            ) : showNoResults ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-4">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('common.noResults')}</h2>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/30 border-b">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.client')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.type')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.status')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ready Date</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => {
                                const style = statusStyles[order.status] || statusStyles.pending
                                const StatusIcon = style.icon
                                const readyDate = getReadyDate(order)
                                return (
                                    <tr
                                        key={order.id}
                                        className="cursor-pointer row-hover"
                                        onClick={() => { setSelectedOrder(order); setDetailOpen(true) }}
                                    >
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-foreground">
                                                {order.client.name} {order.client.familyName}
                                            </p>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {typeLabel(order.orderType)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={style.variant} className={`${style.bg} ${style.text} ${style.border} gap-1.5 text-xs font-medium`}>
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {t(`orders.${order.status}`)}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium">
                                            {readyDate || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            #{selectedOrder?.orderNumber} — {selectedOrder?.client.name} {selectedOrder?.client.familyName}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                {selectedOrder.status === 'pending' && (
                                    <>
                                        <Button size="sm" onClick={() => confirmStatusUpdate(selectedOrder.id, 'ready')} disabled={updatingOrders.has(selectedOrder.id)}>
                                            {updatingOrders.has(selectedOrder.id) ? <Loader2 className="h-4 w-4 mr-1 animate-spinner" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                            {t('orders.markReady')}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => confirmStatusUpdate(selectedOrder.id, 'cancelled')} disabled={updatingOrders.has(selectedOrder.id)}>
                                            <XCircle className="h-4 w-4 mr-1" />
                                            {t('common.cancelled')}
                                        </Button>
                                    </>
                                )}
                                {selectedOrder.status === 'ready' && (
                                    <>
                                        <Button size="sm" onClick={() => confirmStatusUpdate(selectedOrder.id, 'completed')} disabled={updatingOrders.has(selectedOrder.id)}>
                                            {updatingOrders.has(selectedOrder.id) ? <Loader2 className="h-4 w-4 mr-1 animate-spinner" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                            {t('orders.markPickedUp')}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => confirmStatusUpdate(selectedOrder.id, 'cancelled')} disabled={updatingOrders.has(selectedOrder.id)}>
                                            <XCircle className="h-4 w-4 mr-1" />
                                            {t('common.cancelled')}
                                        </Button>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">{t('orders.client')}:</span> {selectedOrder.client.phone}</div>
                                <div><span className="text-muted-foreground">{t('orders.type')}:</span> {typeLabel(selectedOrder.orderType)}</div>
                                <div><span className="text-muted-foreground">{t('orders.status')}:</span><span className="ml-1"><Badge variant="outline">{t(`orders.${selectedOrder.status}`)}</Badge></span></div>
                                <div><span className="text-muted-foreground">{t('orders.payment')}:</span><span className="ml-1"><Badge variant={paymentColors[selectedOrder.paymentStatus]}>{t(`orders.${selectedOrder.paymentStatus}`)}</Badge></span></div>
                            </div>

                            {selectedOrder.prescription && (
                                <div>
                                    <p className="font-semibold text-sm mb-2">{t('prescriptions.title')}</p>
                                    <div className="text-sm p-2 bg-muted/30 rounded space-y-1">
                                        <p><span className="text-muted-foreground">{t('prescriptions.doctor')}:</span> {selectedOrder.prescription.doctor?.name || '—'}</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="font-medium">{t('prescriptions.rightEye')}</p>
                                                <p>SPH: {selectedOrder.prescription.sphRight} CYL: {selectedOrder.prescription.cylRight}</p>
                                                <p>AXIS: {selectedOrder.prescription.axisRight} ADD: {selectedOrder.prescription.addRight}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium">{t('prescriptions.leftEye')}</p>
                                                <p>SPH: {selectedOrder.prescription.sphLeft} CYL: {selectedOrder.prescription.cylLeft}</p>
                                                <p>AXIS: {selectedOrder.prescription.axisLeft} ADD: {selectedOrder.prescription.addLeft}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedOrder.items.length > 0 && (
                                <div>
                                    <p className="font-semibold text-sm mb-2">{t('orders.items')}</p>
                                    <div className="space-y-1">
                                        {selectedOrder.items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                                                <span>{item.product.name} ({item.product.brand}) × {item.quantity}</span>
                                                <span>{formatCurrency(item.unitPrice)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-3 flex justify-between font-semibold">
                                <span>{t('orders.total')}</span>
                                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                            </div>

                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{t('orders.paid')}: {formatCurrency(selectedOrder.totalPaid)}</span>
                                <span>{t('orders.balance')}: {formatCurrency((parseFloat(selectedOrder.totalAmount) - parseFloat(selectedOrder.totalPaid)).toFixed(3))}</span>
                            </div>

                            {selectedOrder.payments.length > 0 && (
                                <div>
                                    <p className="font-semibold text-sm mb-2">{t('orders.paymentHistory')}</p>
                                    <div className="space-y-1">
                                        {selectedOrder.payments.map((p) => (
                                            <div key={p.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                                                <span>{p.type === 'deposit' ? t('orders.deposit') : p.type === 'balance' ? t('orders.balancePayment') : t('orders.full')}</span>
                                                <span>{formatCurrency(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('orders.newOrder')}</DialogTitle>
                    </DialogHeader>
                    <OrderForm
                        onSubmit={handleCreate}
                        onCancel={() => setCreateOpen(false)}
                        saving={saving}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!statusConfirmTarget}
                onOpenChange={() => setStatusConfirmTarget(null)}
                title="Update Order Status"
                description={statusConfirmTarget ? `Move order to "${statusConfirmTarget.status}"?` : ''}
                confirmLabel="Update"
                cancelLabel={t('common.cancel')}
                onConfirm={() => statusConfirmTarget && handleStatusUpdate(statusConfirmTarget.orderId, statusConfirmTarget.status)}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('common.delete')}
                description={deleteTarget ? `#${deleteTarget.orderNumber}` : ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />
        </div>
    )
}
