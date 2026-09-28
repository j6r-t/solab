'use client'

import type { ComponentType } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type IconType = ComponentType<{ className?: string }>

function localeTag(locale: string): string {
    return locale === 'fr' ? 'fr-FR' : 'en-GB'
}

export function monthLabel(month: string, locale: string): string {
    const [y, m] = month.split('-').map(Number)
    return new Intl.DateTimeFormat(localeTag(locale), { month: 'short', year: '2-digit' }).format(new Date(y, m - 1, 1))
}

export function weekLabel(weekStart: string, locale: string): string {
    const [y, m, d] = weekStart.split('-').map(Number)
    return new Intl.DateTimeFormat(localeTag(locale), { day: '2-digit', month: 'short' }).format(new Date(y, m - 1, d))
}

export function weekdayLabel(dayIdx: number, locale: string): string {
    return new Intl.DateTimeFormat(localeTag(locale), { weekday: 'short' }).format(new Date(2023, 9, 1 + dayIdx))
}

export function EmptyState({ text }: { text: string }) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{text}</p>
}

function DeltaBadge({ changePct, goodWhenUp = true }: { changePct: number | null | undefined; goodWhenUp?: boolean }) {
    if (changePct === null || changePct === undefined) return null
    if (changePct === 0) {
        return <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">=</span>
    }
    const up = changePct > 0
    const good = up === goodWhenUp
    return (
        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${good ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
            {up ? '▲' : '▼'} {Math.abs(changePct)} %
        </span>
    )
}

export function StatRow({ label, value, valueClass, muted }: { label: string; value: string | number; valueClass?: string; muted?: boolean }) {
    return (
        <div className="flex justify-between gap-2 text-sm">
            <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
            <span className={`shrink-0 font-semibold tabular-nums ${valueClass ?? ''}`}>{value}</span>
        </div>
    )
}

export function KpiCard({ label, value, icon: Icon, color, delta, deltaGoodUp = true, subtitle, vsLabel }: {
    label: string
    value: string
    icon: IconType
    color: string
    delta?: number | null
    deltaGoodUp?: boolean
    subtitle?: string
    vsLabel?: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <DeltaBadge changePct={delta} goodWhenUp={deltaGoodUp} />
                    {delta !== null && delta !== undefined && vsLabel && (
                        <span className="text-xs text-muted-foreground">{vsLabel}</span>
                    )}
                </div>
                {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
            </CardContent>
        </Card>
    )
}

export function Header({ period, setPeriod }: { period: string; setPeriod: (v: string) => void }) {
    const { t } = useTranslation()
    return (
        <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-medium">{t('nav.reports')}</h1>
            <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-10 px-3 rounded-md border bg-background text-sm"
            >
                <option value="today">{t('reports.periodLabel.today')}</option>
                <option value="week">{t('reports.periodLabel.week')}</option>
                <option value="month">{t('reports.periodLabel.month')}</option>
                <option value="year">{t('reports.periodLabel.year')}</option>
                <option value="all">{t('reports.periodLabel.all')}</option>
            </select>
        </div>
    )
}
