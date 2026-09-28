'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { OpticiensTab } from './OpticiensTab'
import { FournisseursTab } from './FournisseursTab'
import { EcheancesTab } from './EcheancesTab'

const TABS = ['opticiens', 'fournisseurs', 'echeances'] as const

type TabKey = (typeof TABS)[number]

export function InvoicesPage() {
    const { t } = useTranslation()
    const [tab, setTab] = useState<TabKey>('opticiens')

    return (
        <div className="space-y-6 max-w-[1100px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('invoices.title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('invoices.subtitle')}</p>
            </div>

            <div className="flex flex-wrap gap-1 border-b">
                {TABS.map((key) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            tab === key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {t(`invoices.tabs.${key}`)}
                    </button>
                ))}
            </div>

            {tab === 'opticiens' && <OpticiensTab />}
            {tab === 'fournisseurs' && <FournisseursTab />}
            {tab === 'echeances' && <EcheancesTab />}
        </div>
    )
}
