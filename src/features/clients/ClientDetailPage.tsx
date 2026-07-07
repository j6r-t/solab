'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useViewStore } from '@/stores/view-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, Calendar, Phone, MapPin, Loader2 } from 'lucide-react'
import { fetchClientById } from './client.api'
import { fetchOrders, type Order } from '@/features/orders/orders.api'
import { formatCurrency } from '@/lib/utils/currency'

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'orders.pending', variant: 'secondary' },
    ready: { label: 'orders.ready', variant: 'default' },
    completed: { label: 'orders.completed', variant: 'outline' },
    cancelled: { label: 'orders.cancelled', variant: 'destructive' },
}

const paymentBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    unpaid: { label: 'orders.unpaid', variant: 'destructive' },
    partiallyPaid: { label: 'orders.partiallyPaid', variant: 'secondary' },
    fullyPaid: { label: 'orders.fullyPaid', variant: 'default' },
}

export function ClientDetailPage() {
    const { t } = useTranslation()
    const { viewParams, goBack, setView } = useViewStore()
    const clientId = viewParams.id
    const [client, setClient] = useState<{ name: string; familyName: string; phone: string; address?: string | null } | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!clientId) return
        async function load() {
            setLoading(true)
            try {
                const [clientData, ordersData] = await Promise.all([
                    fetchClientById(clientId),
                    fetchOrders({ clientId }),
                ])
                setClient(clientData)
                setOrders(ordersData || [])
            } catch {
                // handled silently
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [clientId])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!client) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">{t('common.noResults')}</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft className="h-4 w-4" />
                {t('common.back')}
            </button>

            <div className="border rounded-xl bg-card p-5 space-y-3">
                <h2 className="text-xl font-semibold">{client.name} {client.familyName}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {client.phone}</span>
                    {client.address && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {client.address}</span>}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        {t('orders.title')}
                    </h3>
                    <Button size="sm" onClick={() => setView('orders', { clientId })}>
                        {t('orders.newOrder')}
                    </Button>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl bg-card">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">{t('orders.noOrders')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => {
                            const sb = statusBadge[order.status] || statusBadge.pending
                            const pb = paymentBadge[order.paymentStatus] || paymentBadge.unpaid
                            return (
                                <div key={order.id} className="border rounded-xl bg-card p-4 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setView('orders')}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium">#{order.orderNumber}</span>
                                                <Badge variant={sb.variant}>{t(sb.label)}</Badge>
                                                <Badge variant={pb.variant}>{t(pb.label)}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                                                <span>{order.items?.length || 0} {t('orders.items')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-semibold">{formatCurrency(parseFloat(order.totalAmount))}</span>
                                        </div>
                                    </div>
                                    {order.items && order.items.length > 0 && (
                                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                                            {order.items.map((item) => (
                                                <span key={item.id} className="mr-4">{item.product.name} x{item.quantity}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
