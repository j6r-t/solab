'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

    const { data: chequesData, isLoading: loading } = useCheques({ status: statusFilter || undefined, entityType: typeFilter || undefined })
    const cheques = chequesData ?? []
    const updateStatus = useUpdateChequeStatus()

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

    async function handleConfirm() {
        if (!confirmTarget) return
        try {
            await updateStatus.mutateAsync({ id: confirmTarget.cheque.id, status: confirmTarget.action })
            toast.success(t('cheques.statusUpdated'))
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
                    <p className="text-xl font-semibold mt-1 text-yellow-600">{pendingTotal.toFixed(3)} TND</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t('cheques.totalCollected')}</p>
                    <p className="text-xl font-semibold mt-1 text-green-600">{collectedTotal.toFixed(3)} TND</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t('cheques.totalBounced')}</p>
                    <p className="text-xl font-semibold mt-1 text-destructive">{bouncedTotal.toFixed(3)} TND</p>
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
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted border-b sticky top-0 z-10">
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
                                    <td className="py-3 px-4 font-medium">{cheque.number}</td>
                                    <td className="py-3 px-4">{cheque.type === 'traite' ? t('cheques.traite') : t('cheques.standard')}</td>
                                    <td className="py-3 px-4">{cheque.bankName || '—'}</td>
                                    <td className="py-3 px-4 text-right">{parseFloat(cheque.amount).toFixed(3)}</td>
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
                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    disabled={updateStatus.isPending}
                                                    onClick={() => setConfirmTarget({ cheque, action: cheque.entityType === 'supplier_payment' ? 'paid' : 'cashed' })}
                                                    title={cheque.entityType === 'supplier_payment' ? t('cheques.markPaid') : t('cheques.markCashed')}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    disabled={updateStatus.isPending}
                                                    onClick={() => setConfirmTarget({ cheque, action: 'bounced' })}
                                                    title={t('cheques.markBounced')}
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
