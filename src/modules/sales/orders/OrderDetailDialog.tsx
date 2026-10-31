'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CheckCircle, XCircle, Loader2, Banknote, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatCurrency } from '@/lib/utils/currency'
import { useAuthStore } from '@/stores/auth-store'
import { PaymentDialog, type PaymentTarget } from '@/modules/sales/atelier-work-orders/PaymentDialog'
import { fetchOrderById, type Order } from './orders.api'
import { useDeleteOrder } from './useOrders'

interface Props {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirmStatusUpdate: (orderId: string, status: string) => void
    updatingOrders: Set<string>
    onUpdated?: (order: Order) => void
}

const paymentColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    fullyPaid: 'default',
    partiallyPaid: 'secondary',
    unpaid: 'destructive',
}

export function OrderDetailDialog({ order, open, onOpenChange, onConfirmStatusUpdate, updatingOrders, onUpdated }: Props) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const isAdmin = user?.role === 'admin'
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const deleteOrderMutation = useDeleteOrder()

    if (!order) return null

    const typeLabel = (type: string) => {
        const labels: Record<string, string> = { standard: t('orders.type_standard'), remounting: t('orders.type_remounting'), direct_sale: t('orders.type_direct_sale') }
        return labels[type] || type
    }

    const balance = parseFloat(order.totalAmount) - parseFloat(order.totalPaid)
    const canRecordPayment = balance > 0.001 && order.status !== 'cancelled'
    const paymentTarget: PaymentTarget | null = canRecordPayment
        ? { kind: 'order', id: order.id, total: parseFloat(order.totalAmount), paid: parseFloat(order.totalPaid), remaining: Math.max(0, balance) }
        : null

    // Atelier progress: aggregate over linked internal work orders.
    // Cancelled steps don't count; only show something when at least one active step exists.
    const atelierStatus = (() => {
        const steps = (order.workOrders ?? []).filter((w) => w.status !== 'cancelled')
        if (steps.length === 0) return null
        const done = steps.filter((w) => w.status === 'completed' || w.status === 'delivered').length
        if (done === steps.length) {
            if (order.status === 'ready') return { label: t('orders.readyForPickup'), variant: 'default' as const }
            if (order.status === 'completed') return { label: t('orders.completed'), variant: 'default' as const }
            return { label: t('orders.atelierDoneAwaiting'), variant: 'secondary' as const }
        }
        if (steps.some((w) => w.status === 'in_progress')) {
            if (done > 0) return { label: t('orders.atelierStepsDone', { done, total: steps.length }), variant: 'secondary' as const }
            return { label: t('workOrders.status.in_progress'), variant: 'secondary' as const }
        }
        return { label: t('workOrders.status.pending'), variant: 'outline' as const }
    })()

    async function handleDelete() {
        if (!order) return
        try {
            await deleteOrderMutation.mutateAsync(order.id)
            toast.success(t('orders.deleted'))
            setDeleteConfirmOpen(false)
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('common.deleteFailed'))
        }
    }

    async function handlePaymentDone() {
        if (!order) return
        toast.success(t('orders.paymentRecorded'))
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        try {
            onUpdated?.(await fetchOrderById(order.id))
        } catch {
            onUpdated?.(order)
        }
    }

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>#{order.orderNumber} — {order.client.name} {order.client.familyName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {order.status === 'pending' && (
                            <>
                                <Button size="sm" className="flex-1 sm:flex-none" onClick={() => onConfirmStatusUpdate(order.id, 'ready')} disabled={updatingOrders.has(order.id)}>
                                    {updatingOrders.has(order.id) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                    {t('orders.markReady')}
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => onConfirmStatusUpdate(order.id, 'cancelled')} disabled={updatingOrders.has(order.id)}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {t('common.cancelled')}
                                </Button>
                            </>
                        )}
                        {order.status === 'ready' && (
                            <>
                                <Button size="sm" className="flex-1 sm:flex-none" onClick={() => onConfirmStatusUpdate(order.id, 'completed')} disabled={updatingOrders.has(order.id)}>
                                    {updatingOrders.has(order.id) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                    {t('orders.markPickedUp')}
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => onConfirmStatusUpdate(order.id, 'cancelled')} disabled={updatingOrders.has(order.id)}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {t('common.cancelled')}
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">{t('orders.client')}:</span> {order.client.phone}</div>
                        <div><span className="text-muted-foreground">{t('orders.type')}:</span> {typeLabel(order.orderType)}</div>
                        <div><span className="text-muted-foreground">{t('orders.status')}:</span><span className="ml-1"><Badge variant="outline">{t(`orders.${order.status}`)}</Badge></span></div>
                        <div><span className="text-muted-foreground">{t('orders.payment')}:</span><span className="ml-1"><Badge variant={paymentColors[order.paymentStatus]}>{t(`orders.${order.paymentStatus}`)}</Badge></span></div>
                    </div>

                    {atelierStatus && (
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{t('orders.atelierLabel')}:</span>
                            <Badge variant={atelierStatus.variant}>{atelierStatus.label}</Badge>
                        </div>
                    )}

                    {order.prescription && (
                        <div>
                            <p className="font-semibold text-sm mb-2">{t('prescriptions.title')}</p>
                            <div className="text-sm p-2 bg-muted/30 rounded space-y-1">
                                <p><span className="text-muted-foreground">{t('prescriptions.doctor')}:</span> {order.prescription.doctor?.name || '—'}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="font-medium">{t('prescriptions.rightEye')}</p>
                                        <p>SPH: {order.prescription.sphRight} CYL: {order.prescription.cylRight}</p>
                                        <p>AXIS: {order.prescription.axisRight} ADD: {order.prescription.addRight}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">{t('prescriptions.leftEye')}</p>
                                        <p>SPH: {order.prescription.sphLeft} CYL: {order.prescription.cylLeft}</p>
                                        <p>AXIS: {order.prescription.axisLeft} ADD: {order.prescription.addLeft}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {order.items.length > 0 && (
                        <div>
                            <p className="font-semibold text-sm mb-2">{t('orders.items')}</p>
                            <div className="space-y-1">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                                        <span>{item.name || item.product?.name || item.lensBlank?.brand || '—'} ({item.product?.brand || item.lensBlank?.brand || ''}) × {item.quantity}</span>
                                        <span>{formatCurrency(item.unitPrice)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-3 flex justify-between font-semibold">
                        <span>{t('orders.total')}</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{t('orders.paid')}: {formatCurrency(order.totalPaid)}</span>
                        <span className="flex items-center gap-2">
                            {canRecordPayment && (
                                <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={() => setPaymentOpen(true)}>
                                    <Banknote className="h-3.5 w-3.5" />
                                    {t('orders.recordPayment')}
                                </Button>
                            )}
                            <span>{t('orders.balance')}: {formatCurrency(balance.toFixed(3))}</span>
                        </span>
                    </div>

                    {order.payments.length > 0 && (
                        <div>
                            <p className="font-semibold text-sm mb-2">{t('orders.paymentHistory')}</p>
                            <div className="space-y-1">
                                {order.payments.map((p) => (
                                    <div key={p.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                                        <span>{p.type === 'deposit' ? t('orders.deposit') : p.type === 'balance' ? t('orders.balancePayment') : t('orders.full')}</span>
                                        <span>{formatCurrency(p.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="border-t pt-3">
                            <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                {t('common.delete')}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        <ConfirmDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title={t('orders.deleteTitle')}
            description={order ? t('orders.deleteDesc', { number: order.orderNumber }) : ''}
            confirmLabel={t('common.delete')}
            cancelLabel={t('common.cancel')}
            onConfirm={handleDelete}
        />

        <PaymentDialog
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            target={paymentTarget}
            onDone={handlePaymentDone}
        />
        </>
    )
}
