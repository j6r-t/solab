'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/hooks/useTranslation'
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

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const data = await login(email, password)
            setAuth(data.token, data.user)
            router.push('/')
        } catch {
            setError('Connection error')
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
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm sm:text-base">{t('auth.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError('') }}
                                placeholder="sofien@optic.tn"
                                className="h-11 sm:h-10"
                                required
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
                                required
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