'use client'

import {
    LayoutDashboard,
    Users,
    Package,
    FileText,
    ShoppingCart,
    Wrench,
    Receipt,
    BarChart3,
    Settings,
    Glasses,
    LogOut,
    Stethoscope,
    Truck,
    Store,
    Upload,
    ClipboardList,
    PackageOpen,
} from 'lucide-react'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useViewStore, type ViewName } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils/cn'

interface NavItem {
    icon: any
    view: ViewName
    labelKey: string
    roles: string[]
}

const navItems: NavItem[] = [
    { icon: LayoutDashboard, view: 'dashboard', labelKey: 'dashboard', roles: ['admin', 'shop', 'atelier'] },
    { icon: Users, view: 'clients', labelKey: 'clients', roles: ['admin', 'shop'] },
    { icon: Package, view: 'stock', labelKey: 'stock', roles: ['admin', 'shop'] },
    { icon: FileText, view: 'prescriptions', labelKey: 'prescriptions', roles: ['admin', 'shop'] },
    { icon: ShoppingCart, view: 'orders', labelKey: 'orders', roles: ['admin', 'shop'] },
    { icon: Wrench, view: 'atelier-work-orders', labelKey: 'atelierWorkOrders', roles: ['admin', 'atelier'] },
    { icon: Receipt, view: 'billing', labelKey: 'billing', roles: ['admin', 'shop'] },
    { icon: BarChart3, view: 'reports', labelKey: 'reports', roles: ['admin', 'shop', 'atelier'] },
    { icon: Stethoscope, view: 'doctors', labelKey: 'doctors', roles: ['admin', 'shop'] },
    { icon: Truck, view: 'fournisseurs', labelKey: 'fournisseurs', roles: ['admin', 'shop', 'atelier'] },
    { icon: PackageOpen, view: 'lens-blanks', labelKey: 'lensBlanks', roles: ['admin', 'atelier'] },
    { icon: ClipboardList, view: 'purchase-invoices', labelKey: 'purchaseInvoices', roles: ['admin', 'shop', 'atelier'] },
    { icon: Store, view: 'optician-shops', labelKey: 'opticianShops', roles: ['admin', 'atelier'] },
    { icon: Upload, view: 'import', labelKey: 'import', roles: ['admin', 'shop'] },
    { icon: Settings, view: 'settings', labelKey: 'settings', roles: ['admin', 'shop', 'atelier'] },
]

export function Sidebar() {
    const { t } = useTranslation()
    const { currentView, setView } = useViewStore()
    const { user, logout } = useAuthStore()
    const router = useRouter()

    const role = user?.role || 'admin'
    const visibleItems = navItems.filter((item) => item.roles.includes(role))

    return (
        <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
            <div className="flex items-center gap-3 px-6 py-5 border-b">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Glasses className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-lg">{t('app.name')}</span>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {visibleItems.map((item) => {
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
                })}
            </nav>

            <div className="p-3 border-t space-y-0.5">
                <NotificationBell variant="nav" />
                <button
                    onClick={() => {
                        logout()
                        router.push('/login')
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
