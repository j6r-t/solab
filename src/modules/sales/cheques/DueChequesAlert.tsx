'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchCheques, type Cheque } from './cheques.api'
import { CHEQUE_ALERT_DAYS } from '@/lib/constants/kpi'

const STORAGE_KEY = 'sofien.dueChequesAlert'
const UNPAID_STATUSES = ['pending', 'deposited', 'overdue']

function todayKey(): string {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}

function startOfToday(): number {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
}

function endOfTodayPlus(days: number): string {
    const d = new Date()
    d.setHours(23, 59, 59, 999)
    d.setDate(d.getDate() + days)
    return d.toISOString()
}

function DueChequeRow({ cheque, overdue }: { cheque: Cheque; overdue: boolean }) {
    const { t } = useTranslation()

    const statusLabels: Record<string, string> = {
        pending: t('common.pending'),
        deposited: t('cheques.deposited'),
        overdue: t('cheques.overdue'),
    }
    const party = cheque.order
        ? `${cheque.order.client.name} ${cheque.order.client.familyName}`.trim()
        : cheque.invoice?.fournisseur.name ?? ''
    const reference = cheque.order ? `#${cheque.order.orderNumber}` : cheque.invoice?.invoiceNumber ?? ''

    return (
        <div className={cn('rounded-lg border p-2.5', overdue && 'border-destructive/40 bg-destructive/5')}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                    <Badge variant="outline" className="shrink-0 text-xs">
                        {cheque.type === 'traite' ? t('cheques.traite') : t('cheques.standard')}
                    </Badge>
                    <span className="truncate text-sm font-medium">{cheque.number}</span>
                </div>
                <span className={cn('shrink-0 text-sm font-semibold', overdue && 'text-destructive')}>
                    {formatCurrency(cheque.amount)}
                </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>{cheque.bankName || '—'}</span>
                <span>
                    {t('cheques.dueDate')}: {new Date(cheque.dueDate).toLocaleDateString()}
                </span>
                <span className="font-medium text-foreground">
                    {cheque.entityType === 'supplier_payment' ? t('cheques.supplierPayment') : t('cheques.clientPayment')}
                    {party ? ` · ${party}` : ''}
                </span>
                {reference && <span>{reference}</span>}
                {statusLabels[cheque.status] && (
                    <Badge variant="outline" className={cn('text-xs', overdue && 'border-destructive/40 text-destructive')}>
                        {statusLabels[cheque.status]}
                    </Badge>
                )}
            </div>
        </div>
    )
}

interface DueChequesResult {
    cheques: Cheque[]
    shouldShow: boolean
}

function splitByDueDate(cheques: Cheque[]) {
    const start = startOfToday()
    const overdue = cheques.filter((c) => c.status === 'overdue' || new Date(c.dueDate).getTime() < start)
    const upcoming = cheques.filter((c) => c.status !== 'overdue' && new Date(c.dueDate).getTime() >= start)
    return { overdue, upcoming }
}

export function DueChequesAlert() {
    const { t } = useTranslation()
    const { isAuthenticated, user } = useAuthStore()
    const { setView } = useViewStore()
    const [dismissed, setDismissed] = useState(false)

    const roleAllowed = isAuthenticated && (user?.role === 'admin' || user?.role === 'shop')

    const { data } = useQuery({
        queryKey: ['cheques', { statuses: UNPAID_STATUSES.join(','), dueAlert: true }],
        queryFn: async (): Promise<DueChequesResult> => {
            const cheques = await fetchCheques({
                statuses: UNPAID_STATUSES.join(','),
                dueBefore: endOfTodayPlus(CHEQUE_ALERT_DAYS),
            })
            const { overdue, upcoming } = splitByDueDate(cheques)
            const hasDue = overdue.length > 0 || upcoming.length > 0
            const shouldShow = hasDue && localStorage.getItem(STORAGE_KEY) !== todayKey()
            if (shouldShow) localStorage.setItem(STORAGE_KEY, todayKey())
            return { cheques, shouldShow }
        },
        enabled: roleAllowed,
        staleTime: 60_000,
    })

    const { overdue, upcoming } = useMemo(() => splitByDueDate(data?.cheques ?? []), [data])
    const open = roleAllowed && (data?.shouldShow ?? false) && !dismissed

    if (!roleAllowed) return null

    function dismiss() {
        setDismissed(true)
    }

    function openChequesView() {
        setView('cheques')
        setDismissed(true)
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss() }}>
            <DialogContent className="w-full sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('cheques.alert.title')}</DialogTitle>
                    <DialogDescription>{t('cheques.alert.description')}</DialogDescription>
                </DialogHeader>
                <div className="-mx-1 max-h-[50vh] space-y-4 overflow-y-auto px-1">
                    {overdue.length > 0 && (
                        <section className="space-y-2">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {t('cheques.overdue')} ({overdue.length})
                            </p>
                            {overdue.map((cheque) => (
                                <DueChequeRow key={cheque.id} cheque={cheque} overdue />
                            ))}
                        </section>
                    )}
                    {upcoming.length > 0 && (
                        <section className="space-y-2">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <CalendarClock className="h-3.5 w-3.5" />
                                {t('cheques.alert.upcomingGroup')} ({upcoming.length})
                            </p>
                            {upcoming.map((cheque) => (
                                <DueChequeRow key={cheque.id} cheque={cheque} overdue={false} />
                            ))}
                        </section>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={dismiss}>
                        {t('cheques.alert.later')}
                    </Button>
                    <Button onClick={openChequesView}>{t('cheques.alert.openCheques')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
