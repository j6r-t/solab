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
    Glasses
} from 'lucide-react'
import { useTranslation } from '@/hooks/userTranslation'
import { useLocaleStore } from '@/stores/local-store'
import { useViewStore, type ViewName } from '@/stores/view-store'
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
    const { locale, setLocale } = useLocaleStore()
    const { currentView, setView } = useViewStore()

    return (
        <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
            {/* Logo */}
            <div className="flex items-center gap-2 px-6 py-5 border-b">
                <Glasses className="h-6 w-6 text-amber-600" />
                <span className="font-semibold text-lg">{t('app.name')}</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = currentView === item.view
                    return (
                        <button
                            key={item.view}
                            onClick={() => setView(item.view)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {t(`nav.${item.labelKey}`)}
                        </button>
                    )
                })}
            </nav>

            {/* Language toggle */}
            <div className="p-4 border-t flex gap-2">
                <button
                    onClick={() => setLocale('eng')}
                    className={cn(
                        'flex-1 py-1.5 rounded-md text-sm font-medium transition-colors',
                        locale === 'eng'
                            ? 'bg-amber-600 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                >
                    EN
                </button>
                <button
                    onClick={() => setLocale('fr')}
                    className={cn(
                        'flex-1 py-1.5 rounded-md text-sm font-medium transition-colors',
                        locale === 'fr'
                            ? 'bg-amber-600 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                >
                    FR
                </button>
            </div>
        </aside>
    )
}