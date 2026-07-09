'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ExportButton } from '@/components/ui/export-button'
import { Plus, Search, ShoppingCart, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { OrderForm, type OrderFormData } from './OrderForm'
import { OrderDetailDialog } from './OrderDetailDialog'
import { formatCurrency } from '@/lib/utils/currency'
import { fetchOrders, fetchOrderById, createOrder, updateOrder, deleteOrder, type Order } from './orders.api'
import { printInvoice } from '@/features/billing/billing.print'
import type { BillingRecord } from '@/features/billing/billing.types'
import { toast } from 'sonner'

const paymentColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    fullyPaid: 'default', partiallyPaid: 'secondary', unpaid: 'destructive',
}

const statusStyles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; bg: string; text: string; border: string }> = {
    pending: { variant: 'outline', icon: Clock, bg: 'bg-status-pending', text: 'text-status-pending', border: 'border-status-pending' },
    ready: { variant: 'outline', icon: CheckCircle, bg: 'bg-status-ready', text: 'text-status-ready', border: 'border-status-ready' },
    completed: { variant: 'outline', icon: CheckCircle, bg: 'bg-status-completed', text: 'text-status-completed', border: 'border-status-completed' },
    cancelled: { variant: 'destructive', icon: XCircle, bg: '', text: '', border: '' },
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
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [statusConfirmTarget, setStatusConfirmTarget] = useState<{ orderId: string; status: string } | null>(null)
    const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
    const [printConfirmTarget, setPrintConfirmTarget] = useState<Order | null>(null)
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const data = await fetchOrders({ search: debouncedSearch || undefined })
                setOrders(data)
            } catch { /* ignore */ }
            setLoading(false)
        }
        load()
    }, [debouncedSearch])

    async function reFetch() {
        try {
            const data = await fetchOrders({ search: debouncedSearch || undefined })
            setOrders(data)
        } catch { /* ignore */ }
    }

    async function handleCreate(data: OrderFormData) {
        setSaving(true)
        try {
            const order = await createOrder(data)
            toast.success(t('orders.created'))
            setCreateOpen(false)
            await reFetch()
            setPrintConfirmTarget(order)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create order')
        } finally {
            setSaving(false)
        }
    }

    function handlePrintInvoice(order: Order) {
        const totalPaid = order.payments.reduce((s, p) => s + parseFloat(p.amount), 0)
        const invoiceItems = order.items.map(i => {
            const price = i.sellingPrice || i.unitPrice
            return { productName: i.name || i.product?.name || i.lensBlank?.brand || '—', brand: i.product?.brand || i.lensBlank?.brand || '', quantity: i.quantity, unitPrice: i.unitPrice, sellingPrice: i.sellingPrice, invoicePrice: parseFloat(price) }
        })
        const invoiceTotal = invoiceItems.reduce((s, i) => s + i.invoicePrice * i.quantity, 0)
        const repairsTotal = order.repairs.reduce((s, r) => s + parseFloat(r.price), 0)
        const invoiceGrandTotal = invoiceTotal + repairsTotal
        const record: BillingRecord = {
            id: order.id,
            orderNumber: order.orderNumber,
            client: { ...order.client, address: null },
            totalAmount: invoiceGrandTotal.toFixed(3),
            totalPaid: totalPaid.toFixed(3),
            balance: (invoiceGrandTotal - totalPaid).toFixed(3),
            paymentStatus: order.paymentStatus,
            status: order.status,
            orderType: order.orderType,
            createdAt: order.createdAt,
            items: invoiceItems.map(i => ({ productName: i.productName, brand: i.brand, quantity: i.quantity, unitPrice: i.invoicePrice.toFixed(3) })),
            payments: order.payments.map(p => ({ amount: p.amount, type: p.type, createdAt: '' })),
            repairs: order.repairs.map(r => ({ type: r.type, price: r.price })),
            turnaroundDays: order.turnaroundDays,
            prescription: order.prescription ? {
                sphRight: order.prescription.sphRight,
                cylRight: order.prescription.cylRight,
                axisRight: order.prescription.axisRight,
                addRight: order.prescription.addRight,
                pdRight: order.prescription.pdRight,
                sphLeft: order.prescription.sphLeft,
                cylLeft: order.prescription.cylLeft,
                axisLeft: order.prescription.axisLeft,
                addLeft: order.prescription.addLeft,
                pdLeft: order.prescription.pdLeft,
                dateWritten: null,
                doctorName: order.prescription.doctor?.name || null,
            } : null,
        }
        setPrintConfirmTarget(null)
        printInvoice(record)
    }

    async function handleDelete(order: Order) {
        try {
            await deleteOrder(order.id)
            toast.success(t('orders.deleted'))
            setDeleteTarget(null)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete order')
        }
    }

    async function handleStatusUpdate(orderId: string, status: string) {
        setUpdatingOrders((prev) => new Set(prev).add(orderId))
        try {
            await updateOrder(orderId, { status })
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
                <p className="text-sm text-muted-foreground mt-1">{t('orders.description')}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client name or order ID" className="pl-10 h-10" />
                </div>
                <ExportButton url="/api/export/orders" />
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('orders.newOrder')}
                </Button>
            </div>

            {loading && orders.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                <div className="border rounded-xl bg-card overflow-x-auto">
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
                                    <tr key={order.id} className="cursor-pointer row-hover" onClick={async () => {
                                        try { const detail = await fetchOrderById(order.id); setSelectedOrder(detail) }
                                        catch { setSelectedOrder(order) }
                                        setDetailOpen(true)
                                    }}>
                                        <td className="py-3 px-4"><p className="font-semibold text-foreground">{order.client.name} {order.client.familyName}</p></td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">{typeLabel(order.orderType)}</td>
                                        <td className="py-3 px-4">
                                            <Badge variant={style.variant} className={`${style.bg} ${style.text} ${style.border} gap-1.5 text-xs font-medium`}>
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {t(`orders.${order.status}`)}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium">{readyDate || '-'}</td>
                                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <OrderDetailDialog
                order={selectedOrder}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onStatusUpdate={handleStatusUpdate}
                onConfirmStatusUpdate={(orderId, status) => setStatusConfirmTarget({ orderId, status })}
                updatingOrders={updatingOrders}
            />

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('orders.newOrder')}</DialogTitle>
                    </DialogHeader>
                    <OrderForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} saving={saving} />
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

            <ConfirmDialog
                open={!!printConfirmTarget}
                onOpenChange={() => setPrintConfirmTarget(null)}
                title={t('orders.printPromptTitle')}
                description={t('orders.printPromptDesc')}
                confirmLabel={t('orders.printYes')}
                cancelLabel={t('orders.printNo')}
                variant="default"
                onConfirm={() => printConfirmTarget && handlePrintInvoice(printConfirmTarget)}
            />
        </div>
    )
}
