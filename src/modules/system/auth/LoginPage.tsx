'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Glasses } from 'lucide-react'
import { login } from './auth.api'

export function LoginPage() {
    const { t } = useTranslation()
    const router = useRouter()
    const { isAuthenticated, setAuth } = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const pathname = usePathname()

    useEffect(() => {
        // Only redirect when mounted as the standalone /login route; on the
        // root page this component also renders during the SSR gate for
        // already-authenticated users, and pushing '/' there would clobber
        // the deep-linked ?view= URL.
        if (isAuthenticated && pathname !== '/') {
            router.push('/')
        }
    }, [isAuthenticated, pathname, router])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        // Localized validation instead of native `required` tooltips, which
        // come in the browser's language, not the app's.
        if (!email.trim() || !password) {
            setError(t('auth.missingFields'))
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError(t('auth.invalidEmail'))
            return
        }
        setLoading(true)

        try {
            const data = await login(email, password)
            setAuth(data.token, data.user)
            // Deep-linked ?view= survives login: the view store already adopted
            // the URL, and the root page's role gate redirects forbidden views.
            // Only navigate for the standalone /login route — pushing '/'
            // from the root page would clobber the deep-linked query.
            if (pathname !== '/') {
                router.push('/')
            }
        } catch (error) {
            // The login endpoint returns 401 with errorCode UNAUTHORIZED for
            // wrong credentials (and 400 for a malformed request) — anything
            // else is a network/server problem, not a credentials problem.
            if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
                setError(t('auth.loginFailed'))
            } else {
                setError(t('auth.connectionError'))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
            <Card className="w-full sm:max-w-sm">
                <CardHeader className="text-center px-4 pt-6 sm:px-6">
                    <div className="flex justify-center mb-3">
                        <div className="h-14 w-14 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Glasses className="h-7 w-7 sm:h-6 sm:w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-xl sm:text-lg">{t('app.name')}</CardTitle>
                    <CardDescription>{t('auth.login')}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-6 sm:px-6">
                    <form onSubmit={handleSubmit} noValidate className="space-y-5 sm:space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm sm:text-base">{t('auth.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError('') }}
                                placeholder="sofien@optic.tn"
                                className="h-11 sm:h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm sm:text-base">{t('auth.password')}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError('') }}
                                placeholder="••••••••"
                                className="h-11 sm:h-10"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}

                        <Button type="submit" disabled={loading} className="w-full h-11 sm:h-10">
                            {loading ? t('common.loading') : t('auth.loginButton')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}