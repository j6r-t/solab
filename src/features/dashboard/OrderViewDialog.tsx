'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatCurrency } from '@/lib/utils/currency'
import type { Order } from '@/features/orders/orders.api'

interface Props {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function OrderViewDialog({ order, open, onOpenChange }: Props) {
    const { t } = useTranslation()
    if (!order) return null

    const typeLabel = (type: string) => {
        const labels: Record<string, string> = { standard: 'Prescription Eyewear', remounting: 'Remounting', direct_sale: 'Direct Sale' }
        return labels[type] || type
    }

    const paymentColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
        fullyPaid: 'default',
        partiallyPaid: 'secondary',
        unpaid: 'destructive',
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>#{order.orderNumber} — {order.client.name} {order.client.familyName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">{t('orders.client')}:</span> {order.client.phone}</div>
                        <div><span className="text-muted-foreground">{t('orders.type')}:</span> {typeLabel(order.orderType)}</div>
                        <div><span className="text-muted-foreground">{t('orders.status')}:</span> <Badge variant="outline" className="ml-1">{t(`orders.${order.status}`)}</Badge></div>
                        <div><span className="text-muted-foreground">{t('orders.payment')}:</span> <Badge variant={paymentColors[order.paymentStatus]} className="ml-1">{t(`orders.${order.paymentStatus}`)}</Badge></div>
                    </div>

                    {order.prescription && (
                        <div>
                            <p className="font-semibold mb-1.5">{t('prescriptions.title')}</p>
                            <div className="p-2.5 bg-muted/30 rounded space-y-1">
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
                            <p className="font-semibold mb-1.5">{t('orders.items')}</p>
                            <div className="space-y-1">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between p-2 bg-muted/30 rounded">
                                        <span>{item.product.name} ({item.product.brand}) × {item.quantity}</span>
                                        <span className="tabular-nums">{formatCurrency(item.unitPrice)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-3 space-y-1">
                        <div className="flex justify-between font-semibold">
                            <span>{t('orders.total')}</span>
                            <span className="tabular-nums">{formatCurrency(order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>{t('orders.paid')}: <span className="tabular-nums">{formatCurrency(order.totalPaid)}</span></span>
                            <span>{t('orders.balance')}: <span className="tabular-nums">{formatCurrency((parseFloat(order.totalAmount) - parseFloat(order.totalPaid)).toFixed(3))}</span></span>
                        </div>
                    </div>

                    {order.payments.length > 0 && (
                        <div>
                            <p className="font-semibold mb-1.5">{t('orders.paymentHistory')}</p>
                            <div className="space-y-1">
                                {order.payments.map((p) => (
                                    <div key={p.id} className="flex justify-between p-2 bg-muted/30 rounded">
                                        <span>{p.type === 'deposit' ? t('orders.deposit') : p.type === 'balance' ? t('orders.balancePayment') : t('orders.full')}</span>
                                        <span className="tabular-nums">{formatCurrency(p.amount)}</span>
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