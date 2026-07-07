'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Package, Wrench, ShoppingCart, Landmark, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useViewStore, type ViewName } from '@/stores/view-store'
import { cn } from '@/lib/utils/cn'

interface NotificationItem {
    id: string
    label: string
}

interface NotificationAlert {
    type: 'low_stock' | 'pending_repair' | 'ready_order' | 'pending_payment'
    label: string
    count: number
    items: NotificationItem[]
}

const iconMap: Record<string, React.ComponentType<any>> = {
    low_stock: Package,
    pending_repair: Wrench,
    ready_order: ShoppingCart,
    pending_payment: Landmark,
}

const viewMap: Record<string, ViewName> = {
    low_stock: 'stock',
    pending_repair: 'repairs',
    ready_order: 'orders',
    pending_payment: 'billing',
}

interface NotificationBellProps {
    variant?: 'icon' | 'nav'
}

export function NotificationBell({ variant = 'icon' }: NotificationBellProps) {
    const { t } = useTranslation()
    const { setView } = useViewStore()
    const [alerts, setAlerts] = useState<NotificationAlert[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const totalCount = alerts.reduce((sum, a) => sum + a.count, 0)

    const fetchAlerts = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setAlerts(data || [])
            }
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAlerts()
        const interval = setInterval(fetchAlerts, 15000)
        return () => clearInterval(interval)
    }, [fetchAlerts])

    function handleToggle() {
        fetchAlerts()
        setOpen((prev) => !prev)
    }

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className={
                    variant === 'nav'
                        ? 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:scale-[1.01] active:scale-[0.98] transition-all duration-200'
                        : 'relative p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
                }
                title={variant === 'icon' ? t('notifications.title') : undefined}
            >
                <Bell className="h-5 w-5 shrink-0" />
                {variant === 'nav' && <span className="flex-1 text-left">{t('notifications.title')}</span>}
                {totalCount > 0 && (
                    <span className={variant === 'nav' ? 'flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold text-white bg-destructive rounded-full' : 'absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-white bg-destructive rounded-full'}>
                        {totalCount > 9 ? '9+' : totalCount}
                    </span>
                )}
            </button>

            {open && (
                <div className={cn('absolute w-80 sm:w-96 bg-card border rounded-xl shadow-lg z-50 max-h-[70vh] overflow-y-auto', variant === 'nav' ? 'left-full ml-3 bottom-0' : 'right-0 top-full mt-1')}>
                    <div className="p-3 border-b">
                        <p className="font-medium text-sm">{t('notifications.title')}</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            {t('notifications.noNotifications')}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {alerts.map((alert) => {
                                const Icon = iconMap[alert.type]
                                return (
                                    <button
                                        key={alert.type}
                                        onClick={() => { setView(viewMap[alert.type]); setOpen(false) }}
                                        className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium">{alert.count}× {t(alert.label)}</p>
                                                <div className="mt-1.5 space-y-0.5">
                                                    {alert.items.slice(0, 5).map((item) => (
                                                        <p key={item.id} className="text-xs text-muted-foreground truncate">
                                                            {item.label}
                                                        </p>
                                                    ))}
                                                    {alert.items.length > 5 && (
                                                        <p className="text-xs text-muted-foreground">+{alert.items.length - 5} more</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
