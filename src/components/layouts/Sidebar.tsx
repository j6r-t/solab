'use client'

import { useState, useEffect, useCallback } from 'react'
import { LogOut, ChevronDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { NotificationBell } from '@/modules/system/notifications/NotificationBell'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useViewStore } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils/cn'
import {
    getVisibleGroups,
    getDefaultCollapsed,
    findGroupForView,
} from './nav-config'

const STORAGE_KEY = 'sidebar-collapsed'

function loadCollapsed(): Record<string, boolean> | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved ? JSON.parse(saved) : null
    } catch {
        return null
    }
}

function saveCollapsed(state: Record<string, boolean>) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* silent */ }
}

export function Sidebar() {
    const { t } = useTranslation()
    const { currentView, setView } = useViewStore()
    const { user, logout } = useAuthStore()
    const queryClient = useQueryClient()
    const router = useRouter()

    const role = user?.role || 'admin'
    const entries = getVisibleGroups(role)

    const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
        const saved = loadCollapsed()
        return saved || getDefaultCollapsed(role)
    })

    const toggleGroup = useCallback((labelKey: string) => {
        setCollapsed((prev) => ({ ...prev, [labelKey]: !prev[labelKey] }))
    }, [])

    useEffect(() => {
        saveCollapsed(collapsed)
    }, [collapsed])

    // Auto-expand group containing active view (render-phase state adjustment)
    const [prevView, setPrevView] = useState(currentView)
    if (currentView !== prevView) {
        setPrevView(currentView)
        const activeGroup = findGroupForView(currentView)
        if (activeGroup && collapsed[activeGroup.labelKey]) {
            setCollapsed({ ...collapsed, [activeGroup.labelKey]: false })
        }
    }

    return (
        <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0 z-30">
            <div className="px-6 py-4 border-b">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {entries.map((entry) => {
                    if (entry.type === 'item') {
                        const item = entry.item
                        const isActive = currentView === item.view
                        return (
                            <button
                                key={item.view}
                                onClick={() => setView(item.view)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                                    isActive
                                        ? 'bg-accent text-accent-foreground shadow-sm scale-[1.02]'
                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:scale-[1.01] active:scale-[0.98]'
                                )}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
                                )}
                                <item.icon className={cn('h-5 w-5 shrink-0 transition-transform duration-200', isActive && 'text-primary scale-110')} />
                                {t(`nav.${item.labelKey}`)}
                            </button>
                        )
                    }

                    const group = entry.group
                    const isCollapsed = collapsed[group.labelKey]
                    const hasActiveChild = group.items.some((i) => i.view === currentView)

                    if (group.items.length === 1) {
                        const item = group.items[0]
                        const isActive = currentView === item.view
                        return (
                            <button
                                key={item.view}
                                onClick={() => setView(item.view)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                                    isActive
                                        ? 'bg-accent text-accent-foreground shadow-sm scale-[1.02]'
                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:scale-[1.01] active:scale-[0.98]'
                                )}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
                                )}
                                <item.icon className={cn('h-5 w-5 shrink-0 transition-transform duration-200', isActive && 'text-primary scale-110')} />
                                {t(`nav.${item.labelKey}`)}
                            </button>
                        )
                    }

                    return (
                        <div key={group.labelKey} className="space-y-0.5">
                            <button
                                onClick={() => toggleGroup(group.labelKey)}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors',
                                    hasActiveChild
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <group.icon className="h-4 w-4 shrink-0" />
                                <span className="flex-1 text-left">{t(group.labelKey)}</span>
                                <ChevronDown
                                    className={cn(
                                        'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                                        isCollapsed && '-rotate-90'
                                    )}
                                />
                            </button>

                            {!isCollapsed && (
                                <div className="ml-2 pl-3 border-l space-y-0.5">
                                    {group.items.map((item) => {
                                        const isActive = currentView === item.view
                                        return (
                                            <button
                                                key={item.view}
                                                onClick={() => setView(item.view)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative',
                                                    isActive
                                                        ? 'bg-accent text-accent-foreground shadow-sm scale-[1.02]'
                                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:scale-[1.01] active:scale-[0.98]'
                                                )}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
                                                )}
                                                <item.icon className={cn('h-4 w-4 shrink-0 transition-transform duration-200', isActive && 'text-primary scale-110')} />
                                                {t(`nav.${item.labelKey}`)}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            <div className="p-3 border-t space-y-0.5">
                <NotificationBell variant="nav" />
                <button
                    onClick={async () => {
                        await queryClient.cancelQueries()
                        logout()
                        queryClient.clear()
                        router.push('/')
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title={t('common.logout')}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {t('common.logout')}
                </button>
            </div>
        </aside>
    )
}
