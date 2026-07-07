'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useViewStore } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { Glasses, LogOut } from 'lucide-react'
import { NotificationBell } from '@/features/notifications/NotificationBell'

export function Header() {
    const { t } = useTranslation()
    const { currentView, goBack } = useViewStore()
    const { logout } = useAuthStore()
    const router = useRouter()

    const showBack = currentView !== 'dashboard'

    return (
        <header className="md:hidden sticky top-0 z-40 bg-background border-b">
            <div className="flex items-center justify-between h-12 px-3">
                {showBack ? (
                    <button
                        onClick={goBack}
                        className="p-2 -ml-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                <div className="flex items-center gap-1.5">
                    <Glasses className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{t('app.name')}</span>
                </div>

                <div className="flex gap-1">
                    <NotificationBell />
                    <button
                        onClick={() => {
                            logout()
                            router.push('/login')
                        }}
                        className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={t('common.logout')}
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    )
}
