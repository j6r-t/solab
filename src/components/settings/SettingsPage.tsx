'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useLocaleStore } from '@/stores/locale-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, User, Smartphone } from 'lucide-react'

export function SettingsPage() {
    const { t } = useTranslation()
    const { locale, setLocale } = useLocaleStore()
    const [userName, setUserName] = useState('Sofien')
    const [userEmail, setUserEmail] = useState('')

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Globe className="h-5 w-5" />
                        {t('settings.language')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Button
                            variant={locale === 'eng' ? 'default' : 'outline'}
                            onClick={() => setLocale('eng')}
                        >
                            English
                        </Button>
                        <Button
                            variant={locale === 'fr' ? 'default' : 'outline'}
                            onClick={() => setLocale('fr')}
                        >
                            Français
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" />
                        {t('settings.profile')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t('settings.name')}</Label>
                        <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="owner@sofien.tn" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Smartphone className="h-5 w-5" />
                        {t('settings.sms')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{t('settings.smsDescription')}</p>
                </CardContent>
            </Card>
        </div>
    )
}
