'use client'

import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    MoreHorizontal,
    FileText,
    Wrench,
    Receipt,
    BarChart3,
    Settings,
    Stethoscope,
    Truck,
    QrCode,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useViewStore, type ViewName } from '@/stores/view-store'
import { cn } from '@/lib/utils'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'

const primaryItems = [
    { icon: LayoutDashboard, view: 'dashboard' as ViewName, labelKey: 'dashboard' },
    { icon: Users, view: 'clients' as ViewName, labelKey: 'clients' },
    { icon: Package, view: 'stock' as ViewName, labelKey: 'stock' },
    { icon: ShoppingCart, view: 'orders' as ViewName, labelKey: 'orders' },
]

const secondaryItems = [
    { icon: FileText, view: 'prescriptions' as ViewName, labelKey: 'prescriptions' },
    { icon: Wrench, view: 'repairs' as ViewName, labelKey: 'repairs' },
    { icon: Receipt, view: 'billing' as ViewName, labelKey: 'billing' },
    { icon: BarChart3, view: 'reports' as ViewName, labelKey: 'reports' },
    { icon: Stethoscope, view: 'doctors' as ViewName, labelKey: 'doctors' },
    { icon: Truck, view: 'fournisseurs' as ViewName, labelKey: 'fournisseurs' },
    { icon: QrCode, view: 'qrcode' as ViewName, labelKey: 'qrCode' },
    { icon: Settings, view: 'settings' as ViewName, labelKey: 'settings' },
]

export function MobileNav() {
    const { t } = useTranslation()
    const { currentView, setView } = useViewStore()

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
            <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
                {primaryItems.map((item) => {
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

                {/* More button */}
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] text-muted-foreground">
                            <MoreHorizontal className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{t('common.more')}</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-xl">
                        <SheetHeader>
                            <SheetTitle>{t('common.more')}</SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            {secondaryItems.map((item) => {
                                const isActive = currentView === item.view
                                return (
                                    <button
                                        key={item.view}
                                        onClick={() => setView(item.view)}
                                        className={cn(
                                            'flex flex-col items-center gap-2 p-4 rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-accent text-primary'
                                                : 'hover:bg-muted'
                                        )}
                                    >
                                        <item.icon className="h-6 w-6" />
                                        <span className="text-xs font-medium">{t(`nav.${item.labelKey}`)}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    )
}