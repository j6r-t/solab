'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, Printer, FileText, Loader2, Wallet, Layers, X } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth-store'
import { PurchaseInvoicePreviewDialog } from '@/modules/inventory/purchase-invoices/PurchaseInvoicePreviewDialog'
import { downloadPurchaseInvoice } from '@/modules/inventory/purchase-invoices/purchase-invoice.print'
import { usePurchaseInvoices, type PurchaseInvoice } from '@/modules/inventory/purchase-invoices/usePurchaseInvoices'
import { type SupplierConsolidatedInvoice } from '@/modules/inventory/supplier-consolidated-invoices/supplier-consolidated-invoices.api'
import { PaymentDialog, type PaymentTarget } from '@/modules/sales/atelier-work-orders/PaymentDialog'
import { GroupSupplierInvoicesDialog } from './GroupSupplierInvoicesDialog'
import { downloadGroupedSupplierInvoice } from './grouped-supplier-invoice.print'
import { useSupplierConsolidatedInvoices } from './useSupplierConsolidatedInvoices'
import { formatDate } from '@/lib/utils/dates'

const STATUS_BADGE: Record<string, string> = {
    fullyPaid: 'bg-green-100 text-green-700 border-green-200',
    partiallyPaid: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    unpaid: 'bg-red-100 text-red-700 border-red-200',
}

const EPSILON = 0.000001

type InvoiceRow =
    | { kind: 'invoice'; key: string; invoice: PurchaseInvoice }
    | { kind: 'consolidated'; key: string; group: SupplierConsolidatedInvoice }

function rowNumber(row: InvoiceRow): string {
    return row.kind === 'invoice' ? row.invoice.invoiceNumber : row.group.invoiceNumber
}

function rowSupplier(row: InvoiceRow): string {
    return (row.kind === 'invoice' ? row.invoice.fournisseur?.name : row.group.fournisseur?.name) || '—'
}

function rowTotals(row: InvoiceRow): { total: number; paid: number; remaining: number } {
    const total = parseFloat(row.kind === 'invoice' ? row.invoice.totalAmount : row.group.totalAmount)
    const paid = parseFloat(row.kind === 'invoice' ? row.invoice.paidAmount : row.group.paidAmount)
    return { total, paid, remaining: Math.max(0, total - paid) }
}

function rowStatus(row: InvoiceRow): string {
    if (row.kind === 'consolidated') return row.group.status === 'paid' ? 'fullyPaid' : row.group.status
    return row.invoice.paymentStatus
}

function rowDate(row: InvoiceRow): string {
    return row.kind === 'invoice' ? row.invoice.date : row.group.createdAt
}

export function FournisseursTab() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const isAtelier = user?.role === 'atelier'
    const [entity, setEntity] = useState(isAtelier ? 'atelier' : 'shop')
    const [paymentFilter, setPaymentFilter] = useState('')
    const [previewInvoice, setPreviewInvoice] = useState<PurchaseInvoice | null>(null)
    const [previewGroup, setPreviewGroup] = useState<SupplierConsolidatedInvoice | null>(null)
    const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [groupDialogOpen, setGroupDialogOpen] = useState(false)

    const { data: invoicesData, isLoading: loading } = usePurchaseInvoices({ entity, paymentStatus: paymentFilter || undefined })
    const invoices = useMemo(() => invoicesData ?? [], [invoicesData])
    const { data: groupsData } = useSupplierConsolidatedInvoices({ entity })
    const groups = useMemo(
        () =>
            (groupsData ?? []).filter((group) => {
                if (!paymentFilter) return true
                const status = group.status === 'paid' ? 'fullyPaid' : group.status
                return status === paymentFilter
            }),
        [groupsData, paymentFilter]
    )

    const rows: InvoiceRow[] = useMemo(() => {
        const merged: InvoiceRow[] = [
            ...invoices.map((invoice): InvoiceRow => ({ kind: 'invoice', key: `invoice-${invoice.id}`, invoice })),
            ...groups.map((group): InvoiceRow => ({ kind: 'consolidated', key: `group-${group.id}`, group })),
        ]
        return merged.sort((a, b) => new Date(rowDate(b)).getTime() - new Date(rowDate(a)).getTime())
    }, [invoices, groups])

    // Selectable invoices: not fully paid (grouped ones are server-excluded
    // from the list). While a selection is active, only invoices of the same
    // fournisseur remain selectable — the entity is already shared via the
    // tab filter.
    const selectedInvoices = useMemo(() => invoices.filter((inv) => selectedIds.includes(inv.id)), [invoices, selectedIds])
    const selectedFournisseurId = selectedInvoices.length > 0 ? selectedInvoices[0].fournisseur.id : null
    const selectedTotal = selectedInvoices.reduce(
        (sum, inv) => sum + Math.max(0, parseFloat(inv.totalAmount) - parseFloat(inv.paidAmount)),
        0
    )

    function isInvoiceSelectable(invoice: PurchaseInvoice): boolean {
        if (parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount) <= EPSILON) return false
        if (selectedFournisseurId && invoice.fournisseur.id !== selectedFournisseurId) return false
        return true
    }

    function toggleInvoice(id: string, checked: boolean) {
        setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
    }

    function statusLabel(status: string): string {
        if (status === 'fullyPaid') return t('purchaseInvoice.fullyPaid')
        if (status === 'partiallyPaid') return t('purchaseInvoice.partiallyPaid')
        return t('purchaseInvoice.unpaid')
    }

    function refresh() {
        queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })
        queryClient.invalidateQueries({ queryKey: ['supplier-consolidated-invoices'] })
        queryClient.invalidateQueries({ queryKey: ['supplier-consolidated-invoice'] })
        queryClient.invalidateQueries({ queryKey: ['cheques'] })
    }

    function handleGroupDone() {
        setSelectedIds([])
        setGroupDialogOpen(false)
        refresh()
    }

    function openInvoicePayment(invoice: PurchaseInvoice) {
        const total = parseFloat(invoice.totalAmount)
        const paid = parseFloat(invoice.paidAmount)
        setPaymentTarget({ kind: 'purchaseInvoice', id: invoice.id, total, paid, remaining: Math.max(0, total - paid) })
    }

    function openGroupPayment(group: SupplierConsolidatedInvoice) {
        const total = parseFloat(group.totalAmount)
        const paid = parseFloat(group.paidAmount)
        setPaymentTarget({ kind: 'supplierConsolidated', id: group.id, total, paid, remaining: Math.max(0, total - paid) })
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-3">
                <Select value={entity} onValueChange={setEntity} disabled={isAtelier}>
                    <SelectTrigger className="w-[160px] h-10">
                        <SelectValue placeholder={t('invoices.fournisseurs.entity')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="shop">{t('invoices.fournisseurs.entityShop')}</SelectItem>
                        <SelectItem value="atelier">{t('invoices.fournisseurs.entityAtelier')}</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-[160px] h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('common.all')}</SelectItem>
                        <SelectItem value="unpaid">{t('purchaseInvoice.unpaid')}</SelectItem>
                        <SelectItem value="partiallyPaid">{t('purchaseInvoice.partiallyPaid')}</SelectItem>
                        <SelectItem value="fullyPaid">{t('purchaseInvoice.fullyPaid')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {selectedInvoices.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
                    <Layers className="h-4 w-4 text-green-600 shrink-0" />
                    <p className="text-sm font-medium flex-1">
                        {t('invoices.fournisseurs.selectedCount', { n: selectedInvoices.length })}
                        <span className="text-muted-foreground font-normal"> — {t('invoices.fournisseurs.remainingTotal')} : {selectedTotal.toFixed(3)} TND</span>
                    </p>
                    <Button
                        size="sm"
                        disabled={selectedInvoices.length < 2}
                        onClick={() => setGroupDialogOpen(true)}
                    >
                        {t('invoices.fournisseurs.groupCta')}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIds([])} title={t('common.cancel')}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : rows.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('invoices.fournisseurs.noInvoices')}</h2>
                    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{t('invoices.fournisseurs.noInvoicesDesc')}</p>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto overflow-y-auto max-h-[340px]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted border-b sticky top-0 z-10">
                                <th className="w-10 py-3 px-2"></th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.number')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.supplier')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.date')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.total')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.paid')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.remaining')}</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.status')}</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground" colSpan={3}></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.map((row) => {
                                const { total, paid, remaining } = rowTotals(row)
                                const isInvoiceRow = row.kind === 'invoice'
                                const invoice = isInvoiceRow ? row.invoice : null
                                const group = row.kind === 'consolidated' ? row.group : null
                                const selectable = isInvoiceRow && isInvoiceSelectable(invoice!)
                                const checked = isInvoiceRow && selectedIds.includes(invoice!.id)
                                const status = rowStatus(row)
                                return (
                                    <tr key={row.key} className="row-hover">
                                        <td className="py-3 px-2 text-center">
                                            {isInvoiceRow && selectable && (
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(v) => toggleInvoice(invoice!.id, v === true)}
                                                    aria-label={t('invoices.fournisseurs.selectForGroup')}
                                                />
                                            )}
                                        </td>
                                        <td className="py-3 px-4 font-medium">
                                            <span className="inline-flex items-center gap-2">
                                                {rowNumber(row)}
                                                {row.kind === 'consolidated' && (
                                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                                                        {t('invoices.fournisseurs.groupInvoice')}
                                                    </Badge>
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">{rowSupplier(row)}</td>
                                        <td className="py-3 px-4 text-sm">{formatDate(rowDate(row))}</td>
                                        <td className="py-3 px-4 text-right text-sm">{total.toFixed(3)}</td>
                                        <td className="py-3 px-4 text-right text-sm">{paid.toFixed(3)}</td>
                                        <td className={`py-3 px-4 text-right text-sm ${remaining > EPSILON ? 'text-destructive font-medium' : ''}`}>{remaining.toFixed(3)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant="outline" className={`${STATUS_BADGE[status] || ''} text-xs`}>
                                                {statusLabel(status)}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => (isInvoiceRow ? setPreviewInvoice(invoice!) : setPreviewGroup(group!))}
                                                title={t('invoices.opticiens.preview')}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                disabled={remaining <= EPSILON}
                                                onClick={() => (isInvoiceRow ? openInvoicePayment(invoice!) : openGroupPayment(group!))}
                                                title={t('payments.recordPayment')}
                                            >
                                                <Wallet className="h-4 w-4" />
                                            </Button>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    isInvoiceRow
                                                        ? downloadPurchaseInvoice(invoice!)
                                                        : downloadGroupedSupplierInvoice({
                                                              invoiceNumber: group!.invoiceNumber,
                                                              fournisseur: group!.fournisseur,
                                                              entity: group!.entity,
                                                              totalAmount: group!.totalAmount,
                                                              paidAmount: group!.paidAmount,
                                                              status: group!.status,
                                                              items: group!.items.map((item) => ({
                                                                  sourceInvoiceNumber: item.sourceInvoiceNumber,
                                                                  amount: item.amount,
                                                              })),
                                                              payments: group!.payments.map((p) => ({
                                                                  amount: p.amount,
                                                                  method: p.method,
                                                                  paidAt: p.paidAt,
                                                                  cheque: p.cheque,
                                                              })),
                                                              notes: group!.notes,
                                                              createdAt: group!.createdAt,
                                                          })
                                                }
                                                title={t('invoices.opticiens.print')}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <PurchaseInvoicePreviewDialog
                invoice={previewInvoice}
                consolidated={previewGroup}
                onClose={() => { setPreviewInvoice(null); setPreviewGroup(null) }}
            />

            <GroupSupplierInvoicesDialog
                open={groupDialogOpen}
                onOpenChange={setGroupDialogOpen}
                fournisseurId={selectedInvoices[0]?.fournisseur.id || ''}
                fournisseurName={selectedInvoices[0]?.fournisseur.name || ''}
                invoices={selectedInvoices.map((invoice) => ({
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    remaining: Math.max(0, parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount)),
                }))}
                onDone={handleGroupDone}
            />

            <PaymentDialog
                open={!!paymentTarget}
                onOpenChange={(open) => { if (!open) setPaymentTarget(null) }}
                target={paymentTarget}
                onDone={refresh}
            />
        </div>
    )
}
