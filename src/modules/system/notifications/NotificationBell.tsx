'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Package, Wrench, ShoppingCart, Landmark, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useViewStore, type ViewName } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { useNotifications } from './useNotifications'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    low_stock: Package,
    pending_repair: Wrench,
    ready_order: ShoppingCart,
    pending_payment: Landmark,
}

const viewMap: Record<string, ViewName> = {
    low_stock: 'stock',
    pending_repair: 'atelier-work-orders',
    ready_order: 'orders',
    pending_payment: 'billing',
}

const ROLE_ALERT_TYPES: Record<string, string[]> = {
    admin: ['low_stock', 'pending_repair', 'ready_order', 'pending_payment'],
    shop: ['low_stock', 'ready_order', 'pending_payment'],
    atelier: ['pending_repair'],
}

interface NotificationBellProps {
    variant?: 'icon' | 'nav'
}

interface PanelPosition {
    left?: number
    top?: number
    right?: number
    bottom?: number
    maxHeight: number
}

export function NotificationBell({ variant = 'icon' }: NotificationBellProps) {
    const { t } = useTranslation()
    const { setView } = useViewStore()
    const user = useAuthStore((s) => s.user)
    const { data, isLoading: loading, refetch: reFetch } = useNotifications()
    const allowedTypes = ROLE_ALERT_TYPES[user?.role || 'admin'] ?? []
    const alerts = (data ?? []).filter((a) => allowedTypes.includes(a.type))
    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState<PanelPosition | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const totalCount = alerts.reduce((sum, a) => sum + a.count, 0)

    const updatePosition = useCallback(() => {
        const rect = buttonRef.current?.getBoundingClientRect()
        if (!rect) return
        if (variant === 'nav') {
            setPosition({
                left: rect.right + 12,
                bottom: window.innerHeight - rect.bottom,
                maxHeight: rect.bottom - 16,
            })
        } else {
            setPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
                maxHeight: window.innerHeight - rect.bottom - 16,
            })
        }
    }, [variant])

    function handleToggle() {
        reFetch()
        if (!open) updatePosition()
        setOpen((prev) => !prev)
    }

    useEffect(() => {
        if (!open) return
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node
            if (dropdownRef.current?.contains(target)) return
            if (panelRef.current?.contains(target)) return
            setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    useEffect(() => {
        if (!open) return
        function handleReposition() {
            updatePosition()
        }
        window.addEventListener('resize', handleReposition)
        window.addEventListener('scroll', handleReposition, { capture: true })
        return () => {
            window.removeEventListener('resize', handleReposition)
            window.removeEventListener('scroll', handleReposition, { capture: true })
        }
    }, [open, updatePosition])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
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

            {open && position && createPortal(
                <div
                    ref={panelRef}
                    className="fixed w-80 sm:w-96 bg-card border rounded-xl shadow-lg z-50 overflow-y-auto"
                    style={
                        variant === 'nav'
                            ? { left: position.left, bottom: position.bottom, maxHeight: position.maxHeight }
                            : { top: position.top, right: position.right, maxHeight: position.maxHeight }
                    }
                >
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
                </div>,
                document.body
            )}
        </div>
    )
}
