'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useViewStore } from '@/stores/view-store'
import { useAuthStore } from '@/stores/auth-store'
import { LogOut } from 'lucide-react'
import { NotificationBell } from '@/modules/system/notifications/NotificationBell'

export function Header() {
    const { t } = useTranslation()
    const { currentView, goBack } = useViewStore()
    const { logout } = useAuthStore()
    const queryClient = useQueryClient()
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

                <div className="flex items-center">
                    <img src="/logo.png" alt="Logo" className="h-6 w-auto object-contain" />
                </div>

                <div className="flex gap-1">
                    <NotificationBell />
                    <button
                        onClick={async () => {
                            await queryClient.cancelQueries()
                            logout()
                            queryClient.clear()
                            router.push('/')
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
