'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ExportButton } from '@/components/ui/export-button'
import { Plus, Search, ShoppingCart, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/skeleton'
import { OrderForm, type OrderFormData } from './OrderForm'
import { OrderDetailDialog } from './OrderDetailDialog'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { fetchOrderById, createOrder, updateOrder, type Order } from './orders.api'
import { useOrders } from './useOrders'
import { printFacture } from '@/modules/sales/billing/billing.print'
import type { BillingRecord } from '@/modules/sales/billing/billing.types'
import { toast } from 'sonner'

const statusStyles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; bg: string; text: string; border: string }> = {
    pending: { variant: 'outline', icon: Clock, bg: 'bg-status-pending', text: 'text-status-pending', border: 'border-status-pending' },
    ready: { variant: 'outline', icon: CheckCircle, bg: 'bg-status-ready', text: 'text-status-ready', border: 'border-status-ready' },
    completed: { variant: 'outline', icon: CheckCircle, bg: 'bg-status-completed', text: 'text-status-completed', border: 'border-status-completed' },
    cancelled: { variant: 'destructive', icon: XCircle, bg: '', text: '', border: '' },
}

const paymentVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
    fullyPaid: 'default',
    partiallyPaid: 'secondary',
    unpaid: 'destructive',
}

function getReadyDate(order: Order): string | null {
    if (!order.turnaroundDays) return null
    const created = new Date(order.createdAt)
    created.setDate(created.getDate() + order.turnaroundDays)
    return formatDate(created)
}

export function OrdersPage() {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formDirty, setFormDirty] = useState(false)
    const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)

    // Esc, overlay click and Cancel all funnel through here: with entered
    // data, ask before discarding instead of silently losing the order.
    const confirmDiscardOrClose = () => {
        if (formDirty) setDiscardConfirmOpen(true)
        else setCreateOpen(false)
    }
    const handleCreateDialogChange = (open: boolean) => {
        if (!open && createOpen) confirmDiscardOrClose()
        else setCreateOpen(open)
    }
    const [statusConfirmTarget, setStatusConfirmTarget] = useState<{ orderId: string; status: string } | null>(null)
    const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
    const [printConfirmTarget, setPrintConfirmTarget] = useState<Order | null>(null)
    const debouncedSearch = useDebounce(search, 300)

    const { data: ordersData, isLoading: loading, refetch: reFetch } = useOrders({ search: debouncedSearch || undefined })
    const orders = ordersData ?? []

    async function handleCreate(data: OrderFormData) {
        setSaving(true)
        try {
            const order = await createOrder(data)
            toast.success(t('orders.created'))
            setCreateOpen(false)
            await reFetch()
            setPrintConfirmTarget(order)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('orders.createFailed'))
        } finally {
            setSaving(false)
        }
    }

    function handlePrintInvoice(order: Order) {
        const totalPaid = order.payments.filter((p) => p.cheque?.status !== 'bounced').reduce((s, p) => s + parseFloat(p.amount), 0)
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
            discount: order.discount ?? '0',
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
        printFacture(record)
    }

    const UNDO_STATUS: Record<string, string> = { ready: 'pending', completed: 'ready' }

    async function handleStatusUpdate(orderId: string, status: string) {
        setUpdatingOrders((prev) => new Set(prev).add(orderId))
        try {
            await updateOrder(orderId, { status })
            // Forward transitions get an undo action; cancellation does not
            // (it restocks items and stays irreversible).
            const undoStatus = UNDO_STATUS[status]
            if (undoStatus) {
                toast.success(t('orders.statusUpdated'), {
                    action: {
                        label: t('common.undo'),
                        onClick: () => {
                            updateOrder(orderId, { status: undoStatus })
                                .then(() => reFetch())
                                .catch(() => toast.error(t('orders.revertFailed')))
                        },
                    },
                })
            } else {
                toast.success(t('orders.statusUpdated'))
            }
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
        const labels: Record<string, string> = { standard: t('orders.type_standard'), remounting: t('orders.type_remounting'), direct_sale: t('orders.type_direct_sale') }
        return labels[type] || type
    }

    const showEmptyState = !loading && orders.length === 0 && !debouncedSearch
    const showNoResults = !loading && orders.length === 0 && debouncedSearch

    // Shared by the desktop row and the mobile card: same detail dialog either way.
    async function openOrder(order: Order) {
        try { const detail = await fetchOrderById(order.id); setSelectedOrder(detail) }
        catch { setSelectedOrder(order) }
        setDetailOpen(true)
    }

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('nav.orders')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('orders.description')}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('orders.searchPlaceholder')} className="pl-10 h-10" />
                </div>
                <ExportButton url="/api/export/orders" />
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('orders.newOrder')}
                </Button>
            </div>

            {loading && orders.length === 0 ? (
                <ListSkeleton />
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
                <div className="hidden md:block border rounded-xl bg-card overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                        <thead>
                            <tr className="bg-muted border-b sticky top-0 z-10">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.number')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.client')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.type')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.status')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.readyDate')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => {
                                const style = statusStyles[order.status] || statusStyles.pending
                                const StatusIcon = style.icon
                                const readyDate = getReadyDate(order)
                                return (
                                    <tr key={order.id} className="cursor-pointer row-hover" onClick={() => openOrder(order)}>
                                        <td className="py-3 px-4 text-sm text-muted-foreground tabular-nums whitespace-nowrap">#{order.orderNumber}</td>
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-foreground">{order.client.name} {order.client.familyName}</p>
                                            <p className="text-xs text-muted-foreground">{t('orders.createdOn', { date: formatDate(new Date(order.createdAt)) })}</p>
                                        </td>
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

            {/* Mobile (below md): cards instead of the horizontally scrolling table */}
            {orders.length > 0 && (
                <div className="md:hidden space-y-3">
                    {orders.map((order) => {
                        const style = statusStyles[order.status] || statusStyles.pending
                        const StatusIcon = style.icon
                        const total = parseFloat(order.totalAmount)
                        const paid = parseFloat(order.totalPaid)
                        const balance = total - paid
                        return (
                            <div
                                key={order.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => openOrder(order)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOrder(order) } }}
                                className="rounded-lg border bg-card p-3 cursor-pointer row-hover"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">{order.client.name} {order.client.familyName}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            <span className="tabular-nums">#{order.orderNumber}</span> · {typeLabel(order.orderType)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t('orders.createdOn', { date: formatDate(new Date(order.createdAt)) })}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <Badge variant={style.variant} className={`${style.bg} ${style.text} ${style.border} gap-1.5 text-xs font-medium`}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {t(`orders.${order.status}`)}
                                        </Badge>
                                        <Badge variant={paymentVariants[order.paymentStatus] || 'secondary'} className="text-xs">
                                            {t(`orders.${order.paymentStatus}`)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orders.total')}</p>
                                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(total)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orders.paid')}</p>
                                        <p className="text-sm tabular-nums">{formatCurrency(paid)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">{t('orders.balance')}</p>
                                        <p className={`text-sm tabular-nums ${balance > 0.001 ? 'text-destructive font-medium' : ''}`}>{formatCurrency(balance)}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <OrderDetailDialog
                order={selectedOrder}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onConfirmStatusUpdate={(orderId, status) => setStatusConfirmTarget({ orderId, status })}
                updatingOrders={updatingOrders}
                onUpdated={(fresh) => { setSelectedOrder(fresh); reFetch() }}
            />

            <Dialog open={createOpen} onOpenChange={handleCreateDialogChange}>
                <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('orders.newOrder')}</DialogTitle>
                    </DialogHeader>
                    <OrderForm onSubmit={handleCreate} onCancel={confirmDiscardOrClose} saving={saving} onDirtyChange={setFormDirty} />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={discardConfirmOpen}
                onOpenChange={() => setDiscardConfirmOpen(false)}
                title={t('orders.discardTitle')}
                description={t('orders.discardDesc')}
                confirmLabel={t('orders.discardConfirm')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => {
                    setDiscardConfirmOpen(false)
                    setCreateOpen(false)
                }}
            />

            <ConfirmDialog
                open={!!statusConfirmTarget}
                onOpenChange={() => setStatusConfirmTarget(null)}
                title={t('orders.updateStatusTitle')}
                description={statusConfirmTarget ? t('orders.moveOrderTo', { status: t(`workOrders.status.${statusConfirmTarget.status}`) }) : ''}
                confirmLabel={t('orders.update')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => statusConfirmTarget && handleStatusUpdate(statusConfirmTarget.orderId, statusConfirmTarget.status)}
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
