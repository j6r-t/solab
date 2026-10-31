'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CheckCircle, XCircle, Loader2, Wallet } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useCheques, useUpdateChequeStatus } from './useCheques'
import type { Cheque } from './cheques.api'
import { formatDate } from '@/lib/utils/dates'
import { toast } from 'sonner'
import { formatCurrency, formatAmount } from '@/lib/utils/currency'

const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    deposited: 'bg-blue-100 text-blue-700 border-blue-200',
    cashed: 'bg-green-100 text-green-700 border-green-200',
    paid: 'bg-green-100 text-green-700 border-green-200',
    bounced: 'bg-red-100 text-red-700 border-red-200',
    overdue: 'bg-orange-100 text-orange-700 border-orange-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

type ChequeAction = 'cashed' | 'paid' | 'bounced'

function traiteNotYetDue(cheque: Cheque): boolean {
    return cheque.type === 'traite'
        && cheque.status === 'pending'
        && new Date(cheque.dueDate).getTime() > Date.now()
}

export function ChequesPage() {
    const { t } = useTranslation()
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [confirmTarget, setConfirmTarget] = useState<{ cheque: Cheque; action: ChequeAction } | null>(null)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [bulkConfirm, setBulkConfirm] = useState<'settle' | 'bounced' | null>(null)

    const { data: chequesData, isLoading: loading } = useCheques({ status: statusFilter || undefined, entityType: typeFilter || undefined })
    const cheques = chequesData ?? []
    const updateStatus = useUpdateChequeStatus()

    const pendingCheques = cheques.filter((c) => c.status === 'pending')
    const allPendingSelected = pendingCheques.length > 0 && pendingCheques.every((c) => selected.has(c.id))

    const toggleSelected = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAllPending = () => {
        setSelected((prev) => {
            if (allPendingSelected) {
                const next = new Set(prev)
                pendingCheques.forEach((c) => next.delete(c.id))
                return next
            }
            const next = new Set(prev)
            pendingCheques.forEach((c) => next.add(c.id))
            return next
        })
    }

    const settleAction = (cheque: Cheque): ChequeAction => (cheque.entityType === 'supplier_payment' ? 'paid' : 'cashed')

    async function handleBulkConfirm() {
        if (!bulkConfirm) return
        const targets = pendingCheques.filter((c) => selected.has(c.id))
        const results = await Promise.allSettled(
            targets.map((c) => updateStatus.mutateAsync({ id: c.id, status: bulkConfirm === 'bounced' ? 'bounced' : settleAction(c) })),
        )
        const failed = results.filter((r) => r.status === 'rejected').length
        const ok = targets.length - failed
        if (failed === 0) {
            toast.success(t('cheques.bulkDone', { n: ok }), {
                action: {
                    label: t('common.undo'),
                    onClick: () => revertToPending(results.map((r, i) => (r.status === 'fulfilled' ? targets[i].id : '')).filter(Boolean)),
                },
            })
        } else {
            toast.warning(t('cheques.bulkPartial', { ok, failed }))
        }
        setSelected(new Set())
        setBulkConfirm(null)
    }

    const statusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: t('common.pending'),
            cashed: t('cheques.cashed'),
            bounced: t('cheques.bounced'),
            paid: t('cheques.paid'),
            deposited: t('cheques.deposited'),
            overdue: t('cheques.overdue'),
            cancelled: t('common.cancelled'),
        }
        return labels[status] || status
    }

    const revertToPending = (ids: string[]) => {
        Promise.allSettled(ids.map((id) => updateStatus.mutateAsync({ id, status: 'pending' }))).then((results) => {
            const failed = results.filter((r) => r.status === 'rejected').length
            if (failed > 0) toast.error(t('cheques.revertFailed', { n: failed }))
        })
    }

    async function handleConfirm() {
        if (!confirmTarget) return
        try {
            await updateStatus.mutateAsync({ id: confirmTarget.cheque.id, status: confirmTarget.action })
            // A settled/bounced cheque can slip back to pending from the toast.
            toast.success(t('cheques.statusUpdated'), {
                action: { label: t('common.undo'), onClick: () => revertToPending([confirmTarget.cheque.id]) },
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update cheque')
        } finally {
            setConfirmTarget(null)
        }
    }

    function confirmDialogProps() {
        if (!confirmTarget) return { title: '', description: '', confirmLabel: '' }
        const { cheque, action } = confirmTarget
        const earlyWarning = traiteNotYetDue(cheque)
            ? ` ${t('cheques.traiteBeforeDue', { date: formatDate(cheque.dueDate) })}`
            : ''
        if (action === 'bounced') {
            return {
                title: t('cheques.confirmBouncedTitle'),
                description: t('cheques.confirmBouncedDesc', { number: cheque.number }),
                confirmLabel: t('cheques.markBounced'),
            }
        }
        if (action === 'paid') {
            return {
                title: t('cheques.confirmPaidTitle'),
                description: t('cheques.confirmPaidDesc', { number: cheque.number }) + earlyWarning,
                confirmLabel: t('cheques.markPaid'),
            }
        }
        return {
            title: t('cheques.confirmCashedTitle'),
            description: t('cheques.confirmCashedDesc', { number: cheque.number }) + earlyWarning,
            confirmLabel: t('cheques.markCashed'),
        }
    }

    const pendingTotal = cheques.filter((c) => c.status === 'pending').reduce((s, c) => s + parseFloat(c.amount), 0)
    const collectedTotal = cheques.filter((c) => c.status === 'cashed' || c.status === 'paid').reduce((s, c) => s + parseFloat(c.amount), 0)
    const bouncedTotal = cheques.filter((c) => c.status === 'bounced').reduce((s, c) => s + parseFloat(c.amount), 0)

    const dialog = confirmDialogProps()

    return (
        <div className="space-y-6 max-w-[1100px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('cheques.title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('cheques.description')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t('cheques.totalPending')}</p>
                    <p className="text-xl font-semibold mt-1 text-yellow-600">{formatCurrency(pendingTotal)}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t('cheques.totalCollected')}</p>
                    <p className="text-xl font-semibold mt-1 text-green-600">{formatCurrency(collectedTotal)}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t('cheques.totalBounced')}</p>
                    <p className="text-xl font-semibold mt-1 text-destructive">{formatCurrency(bouncedTotal)}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-[160px] h-10">
                        <SelectValue placeholder={t('cheques.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="pending">{t('common.pending')}</SelectItem>
                        <SelectItem value="cashed">{t('cheques.cashed')}</SelectItem>
                        <SelectItem value="bounced">{t('cheques.bounced')}</SelectItem>
                        <SelectItem value="paid">{t('cheques.paid')}</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-[160px] h-10">
                        <SelectValue placeholder={t('cheques.allTypes')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="client_payment">{t('cheques.clientPayment')}</SelectItem>
                        <SelectItem value="supplier_payment">{t('cheques.supplierPayment')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {selected.size > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-lg border bg-muted/40 p-3">
                    <p className="text-sm font-medium text-foreground">
                        {t('cheques.selected', { n: selected.size })}
                        {' · '}
                        <span className="text-muted-foreground font-normal">
                            {formatCurrency(cheques.filter((c) => selected.has(c.id)).reduce((s, c) => s + parseFloat(c.amount), 0))}
                        </span>
                    </p>
                    <div className="flex gap-2 sm:ml-auto">
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={updateStatus.isPending}
                            onClick={() => setBulkConfirm('settle')}
                        >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            {(() => {
                                const sel = cheques.filter((c) => selected.has(c.id) && c.status === 'pending')
                                const allSupplier = sel.length > 0 && sel.every((c) => c.entityType === 'supplier_payment')
                                const mixed = sel.some((c) => c.entityType !== 'supplier_payment') && allSupplier === false && sel.some((c) => c.entityType === 'supplier_payment')
                                if (allSupplier) return t('cheques.markPaid')
                                if (mixed) return t('cheques.bulkProcess')
                                return t('cheques.markCashed')
                            })()}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={updateStatus.isPending}
                            onClick={() => setBulkConfirm('bounced')}
                        >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            {t('cheques.bulkBounced')}
                        </Button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : cheques.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Wallet className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('cheques.noCheques')}</h2>
                    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{t('cheques.noChequesDesc')}</p>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto overflow-y-auto max-h-[340px]">
                    <table className="w-full min-w-[720px]">
                        <thead>
                            <tr className="bg-muted border-b sticky top-0 z-10">
                                <th className="w-10 py-3 px-2 text-center">
                                    <Checkbox
                                        checked={pendingCheques.length > 0 && allPendingSelected}
                                        onCheckedChange={toggleAllPending}
                                        aria-label={t('cheques.selectAll')}
                                        disabled={pendingCheques.length === 0}
                                    />
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.number')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.type')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.bank')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.amount')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.dueDate')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.linkedTo')}</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.status')}</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground" colSpan={2}></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {cheques.map((cheque) => (
                                <tr key={cheque.id} className="row-hover">
                                    <td className="py-3 px-2 text-center">
                                        {cheque.status === 'pending' && (
                                            <Checkbox
                                                checked={selected.has(cheque.id)}
                                                onCheckedChange={() => toggleSelected(cheque.id)}
                                                aria-label={t('cheques.selectOne', { number: cheque.number })}
                                            />
                                        )}
                                    </td>
                                    <td className="py-3 px-4 font-medium">{cheque.number}</td>
                                    <td className="py-3 px-4">{cheque.type === 'traite' ? t('cheques.traite') : t('cheques.standard')}</td>
                                    <td className="py-3 px-4">{cheque.bankName || '—'}</td>
                                    <td className="py-3 px-4 text-right">{formatCurrency(cheque.amount)}</td>
                                    <td className="py-3 px-4 text-sm">{formatDate(cheque.dueDate)}</td>
                                    <td className="py-3 px-4 text-sm">
                                        {cheque.order ? (
                                            <span>#{cheque.order.orderNumber} — {cheque.order.client.name} {cheque.order.client.familyName}</span>
                                        ) : cheque.invoice ? (
                                            <span>{cheque.invoice.invoiceNumber} — {cheque.invoice.fournisseur.name}</span>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <Badge variant="outline" className={`${statusStyles[cheque.status] || ''} text-xs`}>
                                                {statusLabel(cheque.status)}
                                            </Badge>
                                            {traiteNotYetDue(cheque) && (
                                                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                                                    {t('cheques.notDue')} · {formatDate(cheque.dueDate)}
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    {cheque.status === 'pending' ? (
                                        <>
                                            <td className="py-3 px-4 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    disabled={updateStatus.isPending}
                                                    onClick={() => setConfirmTarget({ cheque, action: cheque.entityType === 'supplier_payment' ? 'paid' : 'cashed' })}
                                                    title={cheque.entityType === 'supplier_payment' ? t('cheques.markPaid') : t('cheques.markCashed')}
                                                    aria-label={cheque.entityType === 'supplier_payment' ? t('cheques.markPaid') : t('cheques.markCashed')}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    disabled={updateStatus.isPending}
                                                    onClick={() => setConfirmTarget({ cheque, action: 'bounced' })}
                                                    title={t('cheques.markBounced')}
                                                    aria-label={t('cheques.markBounced')}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-3 px-4 text-center" colSpan={2}></td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={!!bulkConfirm}
                onOpenChange={() => setBulkConfirm(null)}
                title={bulkConfirm ? t(bulkConfirm === 'bounced' ? 'cheques.bulkBouncedTitle' : 'cheques.bulkConfirmTitle', { n: selected.size }) : ''}
                description={(() => {
                    if (!bulkConfirm) return ''
                    const targets = pendingCheques.filter((c) => selected.has(c.id))
                    const total = formatAmount(targets.reduce((s, c) => s + parseFloat(c.amount), 0))
                    const early = targets.filter(traiteNotYetDue).length
                    const base = t(bulkConfirm === 'bounced' ? 'cheques.bulkBouncedDesc' : 'cheques.bulkConfirmDesc', { n: targets.length, total })
                    if (bulkConfirm !== 'bounced' && early > 0) return base + ' ' + t('cheques.bulkEarlyTraites', { n: early })
                    return base
                })()}
                confirmLabel={bulkConfirm === 'bounced' ? t('cheques.bulkBounced') : t('cheques.bulkProcess')}
                cancelLabel={t('common.cancel')}
                variant={bulkConfirm === 'bounced' ? 'destructive' : 'default'}
                onConfirm={handleBulkConfirm}
            />

            <ConfirmDialog
                open={!!confirmTarget}
                onOpenChange={() => setConfirmTarget(null)}
                title={dialog.title}
                description={dialog.description}
                confirmLabel={dialog.confirmLabel}
                cancelLabel={t('common.cancel')}
                variant={confirmTarget?.action === 'bounced' ? 'destructive' : 'default'}
                onConfirm={handleConfirm}
            />
        </div>
    )
}
