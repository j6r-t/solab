'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatCurrency } from '@/lib/utils/currency'
import type { Order } from './orders.api'

interface Props {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onStatusUpdate: (orderId: string, status: string) => void
    onConfirmStatusUpdate: (orderId: string, status: string) => void
    updatingOrders: Set<string>
}

const paymentColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    fullyPaid: 'default',
    partiallyPaid: 'secondary',
    unpaid: 'destructive',
}

export function OrderDetailDialog({ order, open, onOpenChange, onStatusUpdate, onConfirmStatusUpdate, updatingOrders }: Props) {
    const { t } = useTranslation()

    if (!order) return null

    const typeLabel = (type: string) => {
        const labels: Record<string, string> = { standard: 'Prescription Eyewear', remounting: 'Remounting', direct_sale: 'Direct Sale' }
        return labels[type] || type
    }

    return (
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
                                        <span>{item.product.name} ({item.product.brand}) × {item.quantity}</span>
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

                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{t('orders.paid')}: {formatCurrency(order.totalPaid)}</span>
                        <span>{t('orders.balance')}: {formatCurrency((parseFloat(order.totalAmount) - parseFloat(order.totalPaid)).toFixed(3))}</span>
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
                </div>
            </DialogContent>
        </Dialog>
    )
}
