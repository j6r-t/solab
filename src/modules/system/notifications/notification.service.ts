import { db } from '@/lib/database/db'
import { STOCK_THRESHOLDS } from '@/lib/constants'
import { DAY_MS, PENDING_CHEQUES_WINDOW_DAYS } from '@/lib/constants/kpi'
import { formatDate } from '@/lib/utils/dates'

export interface NotificationAlert {
    type: 'low_stock' | 'pending_repair' | 'ready_order' | 'ready_optician_work' | 'pending_payment'
    label: string
    count: number
    items: { id: string; label: string }[]
}

export async function getNotifications(role: string): Promise<NotificationAlert[]> {
    const alerts: NotificationAlert[] = []

    if (role === 'admin' || role === 'shop') {
        const lowStockItems = await db.product.findMany({
            where: { quantity: { lte: STOCK_THRESHOLDS.lowStock } },
            select: { id: true, name: true, quantity: true },
            orderBy: { quantity: 'asc' },
        })
        if (lowStockItems.length > 0) {
            alerts.push({
                type: 'low_stock',
                label: 'notifications.lowStock',
                count: lowStockItems.length,
                items: lowStockItems.map((p) => ({ id: p.id, label: `${p.name} (${p.quantity})` })),
            })
        }
    }

    if (role === 'admin' || role === 'atelier') {
        const pendingRepairs = await db.atelierWorkOrder.findMany({
            where: { status: 'pending' },
            select: {
                id: true,
                source: true,
                order: { select: { orderNumber: true } },
                opticianShop: { select: { name: true } },
            },
            orderBy: { expectedCompletionDate: 'asc' },
        })
        if (pendingRepairs.length > 0) {
            alerts.push({
                type: 'pending_repair',
                label: 'notifications.pendingRepairs',
                count: pendingRepairs.length,
                items: pendingRepairs.map((r) => ({
                    id: r.id,
                    label:
                        r.source === 'internal' && r.order
                            ? `Ordre de travail — commande #${r.order.orderNumber}`
                            : r.opticianShop
                              ? `Ordre de travail — ${r.opticianShop.name}`
                              : 'Ordre de travail',
                })),
            })
        }
    }

    if (role === 'admin' || role === 'shop') {
        const readyOrders = await db.order.findMany({
            where: { status: 'ready' },
            select: {
                id: true,
                orderNumber: true,
                client: { select: { name: true, familyName: true } },
            },
            orderBy: { updatedAt: 'desc' },
        })
        if (readyOrders.length > 0) {
            alerts.push({
                type: 'ready_order',
                label: 'notifications.readyOrders',
                count: readyOrders.length,
                items: readyOrders.map((o) => ({
                    id: o.id,
                    label: `#${o.orderNumber} - ${o.client.name} ${o.client.familyName}`,
                })),
            })
        }

        const readyOpticianWork = await db.atelierWorkOrder.findMany({
            where: { status: 'completed', opticianShopId: { not: null } },
            select: { id: true, opticianShop: { select: { name: true } } },
            orderBy: { completedAt: 'asc' },
        })
        if (readyOpticianWork.length > 0) {
            alerts.push({
                type: 'ready_optician_work',
                label: 'notifications.readyOpticianWork',
                count: readyOpticianWork.length,
                items: readyOpticianWork.map((w) => ({
                    id: w.id,
                    label: w.opticianShop?.name ?? 'Ordre de travail',
                })),
            })
        }

        const now = new Date()
        const dueCutoff = new Date(now.getTime() + PENDING_CHEQUES_WINDOW_DAYS * DAY_MS)
        const pendingCheques = await db.cheque.findMany({
            where: {
                status: 'pending' as const,
                dueDate: { gte: now, lte: dueCutoff },
            },
            select: { id: true, number: true, bankName: true, dueDate: true, amount: true, entityType: true },
            orderBy: { dueDate: 'asc' },
        })
        if (pendingCheques.length > 0) {
            alerts.push({
                type: 'pending_payment',
                label: 'notifications.pendingCheques',
                count: pendingCheques.length,
                items: pendingCheques.map((c) => ({
                    id: c.id,
                    label: `#${c.number} - ${c.bankName ?? '—'} - ${c.amount.toString()} TND (due ${formatDate(c.dueDate)})`,
                })),
            })
        }
    }

    return alerts
}
