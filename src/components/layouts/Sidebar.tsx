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
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import { useViewStore, type ViewName } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const navItems = [
    { icon: LayoutDashboard, view: 'dashboard' as ViewName, labelKey: 'dashboard' },
    { icon: Users, view: 'clients' as ViewName, labelKey: 'clients' },
    { icon: Package, view: 'stock' as ViewName, labelKey: 'stock' },
    { icon: FileText, view: 'prescriptions' as ViewName, labelKey: 'prescriptions' },
    { icon: ShoppingCart, view: 'orders' as ViewName, labelKey: 'orders' },
    { icon: Wrench, view: 'repairs' as ViewName, labelKey: 'repairs' },
    { icon: Receipt, view: 'billing' as ViewName, labelKey: 'billing' },
    { icon: BarChart3, view: 'reports' as ViewName, labelKey: 'reports' },
    { icon: Settings, view: 'settings' as ViewName, labelKey: 'settings' },
]

export function Sidebar() {
    const { t } = useTranslation()
    const { currentView, setView } = useViewStore()
    const { logout } = useAuthStore()
    const router = useRouter()

    return (
        <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
            <div className="flex items-center gap-3 px-6 py-5 border-b">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Glasses className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-lg">{t('app.name')}</span>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
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

            <div className="p-4 border-t">
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
