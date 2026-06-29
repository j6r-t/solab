'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Search, ShoppingCart, CheckCircle, XCircle, Clock, Printer, Trash2 } from 'lucide-react'
import { OrderForm, type OrderFormData } from './OrderForm'
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
    doctorName: string
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
    createdAt: string
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

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    ready: 'default',
    completed: 'outline',
    cancelled: 'destructive',
}

const statusIcons: Record<string, typeof Clock> = {
    pending: Clock,
    ready: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle,
}

const paymentColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    fullyPaid: 'default',
    partiallyPaid: 'secondary',
    unpaid: 'destructive',
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

    useEffect(() => {
        async function load() {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/orders?${params}`)
            if (res.ok) setOrders(await res.json())
        }
        load()
    }, [search, statusFilter])

    async function reFetch() {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (statusFilter) params.set('status', statusFilter)
        const res = await fetch(`/api/orders?${params}`)
        if (res.ok) setOrders(await res.json())
    }

    async function handleCreate(data: OrderFormData) {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        if (!res.ok) {
            const body = await res.json()
            throw new Error(JSON.stringify(body.error))
        }
        setCreateOpen(false)
        await reFetch()
        toast.success(t('orders.created'))
    }

    async function handleDelete(order: Order) {
        await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
        setDeleteTarget(null)
        await reFetch()
        toast.success(t('orders.deleted'))
    }

    async function handleStatusUpdate(orderId: string, status: string) {
        await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        setSelectedOrder(null)
        setDetailOpen(false)
        await reFetch()
        toast.success(t('orders.statusUpdated'))
    }

    function formatTND(amount: string): string {
        return parseFloat(amount).toFixed(3) + ' TND'
    }

    const typeLabel = (type: string) => {
        const labels: Record<string, string> = { standard: 'Standard', remounting: 'Remounting', direct_sale: 'Direct Sale' }
        return labels[type] || type
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('nav.orders')}</h1>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('orders.newOrder')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{t('orders.newOrder')}</DialogTitle>
                        </DialogHeader>
                        <OrderForm
                            onSubmit={handleCreate}
                            onCancel={() => setCreateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('common.search')}
                        className="pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 px-3 rounded-md border bg-background text-sm"
                >
                    <option value="">{t('common.all')}</option>
                    <option value="pending">{t('common.pending')}</option>
                    <option value="ready">{t('orders.ready')}</option>
                    <option value="completed">{t('common.completed')}</option>
                    <option value="cancelled">{t('common.cancelled')}</option>
                </select>
            </div>

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl empty-state-gradient text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                    <p>{t('orders.noOrders')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {orders.map((order) => {
                        const StatusIcon = statusIcons[order.status] || Clock
                        return (
                            <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border bg-card row-alternate">
                                <button
                                    onClick={() => { setSelectedOrder(order); setDetailOpen(true) }}
                                    className="text-left flex-1"
                                >
                                    <p className="font-medium">
                                        #{order.orderNumber} — {order.client.name} {order.client.familyName}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <StatusIcon className="h-3 w-3" />
                                        {typeLabel(order.orderType)} · {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="text-right text-sm">
                                        <p className="font-medium">{formatTND(order.totalAmount)}</p>
                                        <Badge variant={statusColors[order.status] || 'outline'} className="text-[10px]">
                                            {t(`orders.${order.status}`)}
                                        </Badge>
                                    </div>
                                    <Badge variant={paymentColors[order.paymentStatus] || 'outline'}>
                                        {t(`orders.${order.paymentStatus}`)}
                                    </Badge>
                                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(order)} title={t('common.delete')}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                                        <Button size="sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'ready')}>
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            {t('orders.markReady')}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}>
                                            <XCircle className="h-4 w-4 mr-1" />
                                            {t('common.cancelled')}
                                        </Button>
                                    </>
                                )}
                                {selectedOrder.status === 'ready' && (
                                    <>
                                        <Button size="sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'completed')}>
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            {t('orders.markPickedUp')}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}>
                                            <XCircle className="h-4 w-4 mr-1" />
                                            {t('common.cancelled')}
                                        </Button>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">{t('orders.client')}:</span> {selectedOrder.client.phone}</div>
                                <div><span className="text-muted-foreground">{t('orders.type')}:</span> {typeLabel(selectedOrder.orderType)}</div>
                                <div><span className="text-muted-foreground">{t('orders.status')}:</span> <Badge variant={statusColors[selectedOrder.status]}>{t(`orders.${selectedOrder.status}`)}</Badge></div>
                                <div><span className="text-muted-foreground">{t('orders.payment')}:</span> <Badge variant={paymentColors[selectedOrder.paymentStatus]}>{t(`orders.${selectedOrder.paymentStatus}`)}</Badge></div>
                                {selectedOrder.turnaroundDays && (
                                    <div><span className="text-muted-foreground">{t('orders.turnaround')}:</span> {selectedOrder.turnaroundDays} {t('orders.days')}</div>
                                )}
                            </div>

                            {/* Prescription */}
                            {selectedOrder.prescription && (
                                <div>
                                    <p className="font-semibold text-sm mb-2">{t('prescriptions.title')}</p>
                                    <div className="text-sm p-2 bg-muted/30 rounded space-y-1">
                                        <p><span className="text-muted-foreground">{t('prescriptions.doctorName')}:</span> {selectedOrder.prescription.doctorName}</p>
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
                                                <span>{formatTND(item.unitPrice)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedOrder.repairs.length > 0 && (
                                <div>
                                    <p className="font-semibold text-sm mb-2">{t('nav.repairs')}</p>
                                    {selectedOrder.repairs.map((r) => (
                                        <div key={r.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded mb-1">
                                            <span>{r.type}</span>
                                            <span>{formatTND(r.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border-t pt-3 flex justify-between font-semibold">
                                <span>{t('orders.total')}</span>
                                <span>{formatTND(selectedOrder.totalAmount)}</span>
                            </div>

                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{t('orders.paid')}: {formatTND(selectedOrder.totalPaid)}</span>
                                <span>{t('orders.balance')}: {formatTND((parseFloat(selectedOrder.totalAmount) - parseFloat(selectedOrder.totalPaid)).toFixed(3))}</span>
                            </div>

                            {selectedOrder.payments.length > 0 && (
                                <div>
                                    <p className="font-semibold text-sm mb-2">{t('orders.paymentHistory')}</p>
                                    <div className="space-y-1">
                                        {selectedOrder.payments.map((p) => (
                                            <div key={p.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                                                <span>{p.type === 'deposit' ? t('orders.deposit') : p.type === 'balance' ? t('orders.balancePayment') : t('orders.full')}</span>
                                                <span>{formatTND(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedOrder.status === 'ready' && (
                                <Button size="sm" variant="outline" className="w-full">
                                    <Printer className="h-4 w-4 mr-1" />
                                    {t('orders.printInvoice')}
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
