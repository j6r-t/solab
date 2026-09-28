'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CheckCircle, XCircle, CalendarClock, Loader2 } from 'lucide-react'
import { fetchCheques, updateChequeStatus, type Cheque } from '@/modules/sales/cheques/cheques.api'
import { formatDate } from '@/lib/utils/dates'
import { toast } from 'sonner'

const PENDING_FAMILY = ['pending', 'deposited', 'overdue']

const TYPE_BADGE: Record<string, string> = {
    standard: 'bg-blue-100 text-blue-700 border-blue-200',
    traite: 'bg-purple-100 text-purple-700 border-purple-200',
}

type Segment = 'all' | 'upcoming' | 'overdue' | 'cashed' | 'bounced'
type InstrumentAction = 'cashed' | 'paid' | 'bounced'

function dayTs(dateStr: string): number {
    const d = new Date(dateStr)
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

function isPendingFamily(cheque: Cheque): boolean {
    return PENDING_FAMILY.includes(cheque.status)
}

function isOverdue(cheque: Cheque, todayTs: number): boolean {
    return isPendingFamily(cheque) && dayTs(cheque.dueDate) < todayTs
}

export function EcheancesTab() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [segment, setSegment] = useState<Segment>('all')
    const [confirmTarget, setConfirmTarget] = useState<{ cheque: Cheque; action: InstrumentAction } | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { data: chequesData, isLoading: loading } = useQuery({
        queryKey: ['invoices-echances', { instrumentScopes: 'optician_bill,supplier' }],
        queryFn: () => fetchCheques({ instrumentScopes: 'optician_bill,supplier' }),
    })
    const cheques = useMemo(() => chequesData ?? [], [chequesData])

    const todayTs = useMemo(() => {
        const now = new Date()
        return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    }, [])

    const counts = useMemo(() => ({
        all: cheques.length,
        upcoming: cheques.filter((c) => isPendingFamily(c) && dayTs(c.dueDate) >= todayTs).length,
        overdue: cheques.filter((c) => isOverdue(c, todayTs)).length,
        cashed: cheques.filter((c) => c.status === 'cashed' || c.status === 'paid').length,
        bounced: cheques.filter((c) => c.status === 'bounced').length,
    }), [cheques, todayTs])

    const visible = useMemo(() => {
        switch (segment) {
            case 'upcoming':
                return cheques.filter((c) => isPendingFamily(c) && dayTs(c.dueDate) >= todayTs)
            case 'overdue':
                return cheques.filter((c) => isOverdue(c, todayTs))
            case 'cashed':
                return cheques.filter((c) => c.status === 'cashed' || c.status === 'paid')
            case 'bounced':
                return cheques.filter((c) => c.status === 'bounced')
            default:
                return cheques
        }
    }, [cheques, segment, todayTs])

    const SEGMENTS: { key: Segment; label: string }[] = [
        { key: 'all', label: t('invoices.echeances.all') },
        { key: 'upcoming', label: t('invoices.echeances.upcoming') },
        { key: 'overdue', label: t('invoices.echeances.overdue') },
        { key: 'cashed', label: t('invoices.echeances.cashed') },
        { key: 'bounced', label: t('invoices.echeances.bounced') },
    ]

    function statusBadge(cheque: Cheque): { label: string; cls: string } {
        if (cheque.status === 'bounced') return { label: t('invoices.echeances.statusBounced'), cls: 'bg-red-100 text-red-700 border-red-200' }
        if (cheque.status === 'cashed' || cheque.status === 'paid') {
            return cheque.entityType === 'supplier_payment'
                ? { label: t('invoices.echeances.statusPaid'), cls: 'bg-green-100 text-green-700 border-green-200' }
                : { label: t('invoices.echeances.statusCashed'), cls: 'bg-green-100 text-green-700 border-green-200' }
        }
        if (cheque.status === 'cancelled') return { label: t('invoices.echeances.statusCancelled'), cls: 'bg-gray-100 text-gray-600 border-gray-200' }
        if (cheque.status === 'overdue') return { label: t('invoices.echeances.statusPending'), cls: 'bg-orange-100 text-orange-700 border-orange-200' }
        return { label: t('invoices.echeances.statusPending'), cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    }

    function party(cheque: Cheque): string {
        if (cheque.opticianBill) return cheque.opticianBill.opticianShop.name
        if (cheque.consolidatedInvoice) return cheque.consolidatedInvoice.opticianShop.name
        if (cheque.supplierConsolidated) return cheque.supplierConsolidated.fournisseur.name
        if (cheque.invoice) return cheque.invoice.fournisseur.name
        if (cheque.order) return `${cheque.order.client.name} ${cheque.order.client.familyName}`.trim()
        return '—'
    }

    function sourceLabel(cheque: Cheque): string {
        if (cheque.opticianBill) return t('invoices.echeances.sourceBill', { number: cheque.opticianBill.billNumber })
        if (cheque.consolidatedInvoice) return t('invoices.echeances.sourceGroupBill', { number: cheque.consolidatedInvoice.invoiceNumber })
        if (cheque.supplierConsolidated) return t('invoices.echeances.sourceSupplierGroupBill', { number: cheque.supplierConsolidated.invoiceNumber })
        if (cheque.invoice) return t('invoices.echeances.sourceSupplierBill', { number: cheque.invoice.invoiceNumber })
        return '—'
    }

    function refresh() {
        queryClient.invalidateQueries({ queryKey: ['invoices-echances'] })
        queryClient.invalidateQueries({ queryKey: ['optician-shop-bills'] })
        queryClient.invalidateQueries({ queryKey: ['optician-shop-bills-summary'] })
        queryClient.invalidateQueries({ queryKey: ['optician-shop-bill'] })
        queryClient.invalidateQueries({ queryKey: ['consolidated-invoices'] })
        queryClient.invalidateQueries({ queryKey: ['consolidated-invoice'] })
        queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })
        queryClient.invalidateQueries({ queryKey: ['supplier-consolidated-invoices'] })
        queryClient.invalidateQueries({ queryKey: ['supplier-consolidated-invoice'] })
        queryClient.invalidateQueries({ queryKey: ['cheques'] })
    }

    async function handleConfirm() {
        if (!confirmTarget) return
        setSubmitting(true)
        try {
            await updateChequeStatus(confirmTarget.cheque.id, confirmTarget.action)
            toast.success(t('invoices.echeances.statusUpdated'))
            refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('payments.errors.failed'))
        } finally {
            setSubmitting(false)
            setConfirmTarget(null)
        }
    }

    function confirmDialogProps() {
        if (!confirmTarget) return { title: '', description: '', confirmLabel: '' }
        const { cheque, action } = confirmTarget
        if (action === 'bounced') {
            return {
                title: t('invoices.echeances.confirmBouncedTitle'),
                description: t('invoices.echeances.confirmBouncedDesc', { number: cheque.number }),
                confirmLabel: t('invoices.echeances.markBounced'),
            }
        }
        if (action === 'paid') {
            return {
                title: t('invoices.echeances.confirmPaidTitle'),
                description: t('invoices.echeances.confirmPaidDesc', { number: cheque.number }),
                confirmLabel: t('invoices.echeances.markPaid'),
            }
        }
        return {
            title: t('invoices.echeances.confirmCashedTitle'),
            description: t('invoices.echeances.confirmCashedDesc', { number: cheque.number }),
            confirmLabel: t('invoices.echeances.markCashed'),
        }
    }

    const dialog = confirmDialogProps()

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-1 border-b">
                {SEGMENTS.map((seg) => (
                    <button
                        key={seg.key}
                        onClick={() => setSegment(seg.key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            segment === seg.key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {seg.label}
                        <span className="ml-1.5 text-xs text-muted-foreground">({counts[seg.key]})</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : visible.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <CalendarClock className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('invoices.echeances.noInstruments')}</h2>
                    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{t('invoices.echeances.noInstrumentsDesc')}</p>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto overflow-y-auto max-h-[340px]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted border-b sticky top-0 z-10">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.type')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.number')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.bank')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.amount')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('cheques.dueDate')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.echeances.party')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.echeances.source')}</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.status')}</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground" colSpan={2}></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {visible.map((cheque) => {
                                const badge = statusBadge(cheque)
                                const overdue = isOverdue(cheque, todayTs)
                                const isSupplier = cheque.entityType === 'supplier_payment'
                                return (
                                    <tr key={cheque.id} className={`row-hover ${overdue ? 'bg-red-50/60' : ''}`}>
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className={`${TYPE_BADGE[cheque.type] || ''} text-xs`}>
                                                {cheque.type === 'traite' ? t('invoices.echeances.typeTraite') : t('invoices.echeances.typeCheque')}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 font-medium">{cheque.number}</td>
                                        <td className="py-3 px-4 text-sm">{cheque.bankName || '—'}</td>
                                        <td className="py-3 px-4 text-right text-sm">{parseFloat(cheque.amount).toFixed(3)}</td>
                                        <td className={`py-3 px-4 text-sm ${overdue ? 'text-destructive font-medium' : ''}`}>
                                            {formatDate(cheque.dueDate)}
                                        </td>
                                        <td className="py-3 px-4 text-sm">{party(cheque)}</td>
                                        <td className="py-3 px-4 text-sm">{sourceLabel(cheque)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant="outline" className={`${badge.cls} text-xs`}>{badge.label}</Badge>
                                        </td>
                                        {cheque.status === 'pending' ? (
                                            <>
                                                <td className="py-3 px-4 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        disabled={submitting}
                                                        onClick={() => setConfirmTarget({ cheque, action: isSupplier ? 'paid' : 'cashed' })}
                                                        title={isSupplier ? t('invoices.echeances.markPaid') : t('invoices.echeances.markCashed')}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        disabled={submitting}
                                                        onClick={() => setConfirmTarget({ cheque, action: 'bounced' })}
                                                        title={t('invoices.echeances.markBounced')}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </>
                                        ) : (
                                            <td className="py-3 px-4 text-center" colSpan={2}></td>
                                        )}
                                    </tr>
                                )
                            })}
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
