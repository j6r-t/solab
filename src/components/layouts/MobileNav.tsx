'use client'

import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    MoreHorizontal,
    Wrench,
    PackageOpen,
    ClipboardList,
    ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useViewStore, type ViewName } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils/cn'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { getVisibleGroups } from './nav-config'

interface MobileNavItem {
    icon: React.ComponentType<{ className?: string }>
    view: ViewName
    labelKey: string
    roles: string[]
}

const primaryItems: MobileNavItem[] = [
    { icon: LayoutDashboard, view: 'dashboard', labelKey: 'dashboard', roles: ['admin', 'shop', 'atelier'] },
    { icon: Users, view: 'clients', labelKey: 'clients', roles: ['admin', 'shop'] },
    { icon: Package, view: 'stock', labelKey: 'stock', roles: ['admin', 'shop'] },
    { icon: ShoppingCart, view: 'orders', labelKey: 'orders', roles: ['admin', 'shop'] },
    { icon: Wrench, view: 'atelier-work-orders', labelKey: 'atelierWorkOrders', roles: ['admin', 'atelier'] },
    { icon: PackageOpen, view: 'lens-blanks', labelKey: 'lensBlanks', roles: ['admin', 'atelier'] },
    { icon: ClipboardList, view: 'purchase-invoices', labelKey: 'purchaseInvoices', roles: ['admin'] },
]

function filterByRole(items: MobileNavItem[], role: string): MobileNavItem[] {
    return items.filter((item) => item.roles.includes(role))
}

export function MobileNav() {
    const { t } = useTranslation()
    const { currentView, setView } = useViewStore()
    const { user } = useAuthStore()
    const [sheetOpen, setSheetOpen] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const role = user?.role || 'admin'
    const visiblePrimary = filterByRole(primaryItems, role)
    const allEntries = getVisibleGroups(role)

    // Entries not covered by primary items go into the "More" sheet
    const primaryViews = new Set(visiblePrimary.map((i) => i.view))
    const secondaryEntries = allEntries.filter((entry) => {
        if (entry.type === 'item') return !primaryViews.has(entry.item.view)
        return entry.group.items.some((i) => !primaryViews.has(i.view))
    })

    const toggleGroup = (labelKey: string) => {
        setExpandedGroups((prev) => ({ ...prev, [labelKey]: !prev[labelKey] }))
    }

    if (visiblePrimary.length === 0) return null

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
            <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
                {visiblePrimary.map((item) => {
                    const isActive = currentView === item.view
                    return (
                        <button
                            key={item.view}
                            onClick={() => setView(item.view)}
                            className={cn(
                                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{t(`nav.${item.labelKey}`)}</span>
                        </button>
                    )
                })}

                {secondaryEntries.length > 0 && (
                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                            <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] text-muted-foreground">
                                <MoreHorizontal className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t('common.more')}</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-xl max-h-[80vh] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>{t('common.more')}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-4">
                                {secondaryEntries.map((entry) => {
                                    if (entry.type === 'item') {
                                        const item = entry.item
                                        const isActive = currentView === item.view
                                        return (
                                            <button
                                                key={item.view}
                                                onClick={() => {
                                                    setView(item.view)
                                                    setSheetOpen(false)
                                                }}
                                                className={cn(
                                                    'flex items-center gap-3 w-full p-3 rounded-lg transition-colors',
                                                    isActive
                                                        ? 'bg-accent text-primary'
                                                        : 'hover:bg-muted'
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                <span className="text-sm font-medium">{t(`nav.${item.labelKey}`)}</span>
                                            </button>
                                        )
                                    }

                                    const group = entry.group
                                    const isExpanded = expandedGroups[group.labelKey] !== false
                                    const visibleItems = group.items.filter((i) => i.roles.includes(role))
                                    return (
                                        <div key={group.labelKey}>
                                            <button
                                                onClick={() => toggleGroup(group.labelKey)}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                            >
                                                <group.icon className="h-3.5 w-3.5" />
                                                <span className="flex-1 text-left">{t(group.labelKey)}</span>
                                                <ChevronDown
                                                    className={cn(
                                                        'h-3.5 w-3.5 transition-transform duration-200',
                                                        !isExpanded && '-rotate-90'
                                                    )}
                                                />
                                            </button>
                                            {isExpanded && (
                                                <div className="grid grid-cols-3 gap-2 mt-1">
                                                    {visibleItems.map((item) => {
                                                        const isActive = currentView === item.view
                                                        return (
                                                            <button
                                                                key={item.view}
                                                                onClick={() => {
                                                                    setView(item.view)
                                                                    setSheetOpen(false)
                                                                }}
                                                                className={cn(
                                                                    'flex flex-col items-center gap-2 p-3 rounded-lg transition-colors',
                                                                    isActive
                                                                        ? 'bg-accent text-primary'
                                                                        : 'hover:bg-muted'
                                                                )}
                                                            >
                                                                <item.icon className="h-5 w-5" />
                                                                <span className="text-[10px] font-medium text-center">{t(`nav.${item.labelKey}`)}</span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </SheetContent>
                    </Sheet>
                )}
            </div>
        </nav>
    )
}
