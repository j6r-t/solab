'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, Search, Store, Wallet, Printer, FileText, Loader2, Layers, X } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { type OpticianShopBill } from '@/modules/partners/optician-shop-bills/optician-shop-bills.api'
import { type ConsolidatedInvoice } from '@/modules/partners/consolidated-invoices/consolidated-invoices.api'
import { PaymentDialog, type PaymentTarget } from '@/modules/sales/atelier-work-orders/PaymentDialog'
import { useOpticianShopBills, useOpticianShopBillsSummary } from './useOpticianShopBills'
import { useConsolidatedInvoices } from './useConsolidatedInvoices'
import { useOpticianShops } from '@/modules/partners/optician-shops/useOpticianShops'
import { BillPreviewDialog } from './BillPreviewDialog'
import { GroupBillsDialog } from './GroupBillsDialog'
import { downloadOpticianBill } from './optician-bill.print'
import { downloadGroupedInvoice } from './grouped-invoice.print'
import { formatDate } from '@/lib/utils/dates'

const BILL_STATUS_BADGE: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 border-green-200',
    partiallyPaid: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    unpaid: 'bg-red-100 text-red-700 border-red-200',
}

const EPSILON = 0.000001

type InvoiceRow =
    | { kind: 'bill'; key: string; bill: OpticianShopBill }
    | { kind: 'consolidated'; key: string; invoice: ConsolidatedInvoice }

function rowNumber(row: InvoiceRow): string {
    return row.kind === 'bill' ? row.bill.billNumber : row.invoice.invoiceNumber
}

function rowShop(row: InvoiceRow): string {
    return (row.kind === 'bill' ? row.bill.opticianShop?.name : row.invoice.opticianShop?.name) || '—'
}

function rowTotals(row: InvoiceRow): { total: number; paid: number; remaining: number } {
    const total = parseFloat(row.kind === 'bill' ? row.bill.totalAmount : row.invoice.totalAmount)
    const paid = parseFloat(row.kind === 'bill' ? row.bill.paidAmount : row.invoice.paidAmount)
    return { total, paid, remaining: Math.max(0, total - paid) }
}

function rowStatus(row: InvoiceRow): string {
    return row.kind === 'bill' ? row.bill.status : row.invoice.status
}

function rowDate(row: InvoiceRow): string {
    return row.kind === 'bill' ? row.bill.createdAt : row.invoice.createdAt
}

export function OpticiensTab() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [shopFilter, setShopFilter] = useState('')
    const [previewBill, setPreviewBill] = useState<OpticianShopBill | null>(null)
    const [previewGroup, setPreviewGroup] = useState<ConsolidatedInvoice | null>(null)
    const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [groupDialogOpen, setGroupDialogOpen] = useState(false)

    const debouncedSearch = useDebounce(search, 300)
    const filters = useMemo(
        () => ({ search: debouncedSearch || undefined, status: statusFilter || undefined, opticianShopId: shopFilter || undefined }),
        [debouncedSearch, statusFilter, shopFilter]
    )

    const { data: billsData, isLoading: loading } = useOpticianShopBills(filters)
    const bills = useMemo(() => billsData ?? [], [billsData])
    const { data: groupsData } = useConsolidatedInvoices(filters)
    const groups = useMemo(() => groupsData ?? [], [groupsData])
    const { data: summaryData } = useOpticianShopBillsSummary()
    const summary = summaryData ?? []
    const { data: shopsData } = useOpticianShops()
    const shops = useMemo(() => shopsData ?? [], [shopsData])

    const rows: InvoiceRow[] = useMemo(() => {
        const merged: InvoiceRow[] = [
            ...bills.map((bill): InvoiceRow => ({ kind: 'bill', key: `bill-${bill.id}`, bill })),
            ...groups.map((invoice): InvoiceRow => ({ kind: 'consolidated', key: `group-${invoice.id}`, invoice })),
        ]
        return merged.sort((a, b) => new Date(rowDate(b)).getTime() - new Date(rowDate(a)).getTime())
    }, [bills, groups])

    // Selectable bills: not grouped and not fully paid. While a selection is
    // active, only bills of the same shop remain selectable.
    const selectedBills = useMemo(() => bills.filter((b) => selectedIds.includes(b.id)), [bills, selectedIds])
    const selectedShopId = selectedBills.length > 0 ? selectedBills[0].opticianShopId : null
    const selectedTotal = selectedBills.reduce(
        (sum, bill) => sum + Math.max(0, parseFloat(bill.totalAmount) - parseFloat(bill.paidAmount)),
        0
    )

    function isBillSelectable(bill: OpticianShopBill): boolean {
        if (bill.groupedIntoId) return false
        if (parseFloat(bill.totalAmount) - parseFloat(bill.paidAmount) <= EPSILON) return false
        if (selectedShopId && bill.opticianShopId !== selectedShopId) return false
        return true
    }

    function toggleBill(id: string, checked: boolean) {
        setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
    }

    function refresh() {
        queryClient.invalidateQueries({ queryKey: ['optician-shop-bills'] })
        queryClient.invalidateQueries({ queryKey: ['optician-shop-bills-summary'] })
        queryClient.invalidateQueries({ queryKey: ['optician-shop-bill'] })
        queryClient.invalidateQueries({ queryKey: ['consolidated-invoices'] })
        queryClient.invalidateQueries({ queryKey: ['consolidated-invoice'] })
    }

    function handleGroupDone() {
        setSelectedIds([])
        setGroupDialogOpen(false)
        refresh()
    }

    function openBillPayment(bill: OpticianShopBill) {
        const total = parseFloat(bill.totalAmount)
        const paid = parseFloat(bill.paidAmount)
        setPaymentTarget({ kind: 'bill', id: bill.id, total, paid, remaining: Math.max(0, total - paid) })
    }

    function openGroupPayment(invoice: ConsolidatedInvoice) {
        const total = parseFloat(invoice.totalAmount)
        const paid = parseFloat(invoice.paidAmount)
        setPaymentTarget({ kind: 'consolidated', id: invoice.id, total, paid, remaining: Math.max(0, total - paid) })
    }

    return (
        <div className="space-y-5">
            {summary.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {summary.map((s) => (
                        <div key={s.shopId} className="rounded-lg border bg-card p-3">
                            <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                                <p className="text-sm font-medium truncate">{s.shopName}</p>
                            </div>
                            <div className="flex items-end justify-between mt-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">{t('invoices.opticiens.invoiceCount')}</p>
                                    <p className="text-sm font-semibold">{s.invoiceCount}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{t('invoices.opticiens.outstanding')}</p>
                                    <p className={`text-sm font-semibold ${s.totalOutstanding > EPSILON ? 'text-destructive' : 'text-green-600'}`}>
                                        {s.totalOutstanding.toFixed(3)} TND
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('invoices.opticiens.searchPlaceholder')} className="pl-10 h-10" />
                </div>
                <Select value={shopFilter} onValueChange={setShopFilter}>
                    <SelectTrigger className="w-[190px] h-10">
                        <SelectValue placeholder={t('invoices.opticiens.allOpticians')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('invoices.opticiens.allOpticians')}</SelectItem>
                        {shops.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('common.all')}</SelectItem>
                        <SelectItem value="unpaid">{t('orders.unpaid')}</SelectItem>
                        <SelectItem value="partiallyPaid">{t('orders.partiallyPaid')}</SelectItem>
                        <SelectItem value="paid">{t('orders.fullyPaid')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {selectedBills.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
                    <Layers className="h-4 w-4 text-green-600 shrink-0" />
                    <p className="text-sm font-medium flex-1">
                        {t('invoices.opticiens.selectedCount', { n: selectedBills.length })}
                        <span className="text-muted-foreground font-normal"> — {t('invoices.opticiens.remainingTotal')} : {selectedTotal.toFixed(3)} TND</span>
                    </p>
                    <Button
                        size="sm"
                        disabled={selectedBills.length < 2}
                        onClick={() => setGroupDialogOpen(true)}
                    >
                        {t('invoices.opticiens.groupCta')}
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
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('invoices.opticiens.noBills')}</h2>
                    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{t('invoices.opticiens.noBillsDesc')}</p>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto overflow-y-auto max-h-[340px]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted border-b sticky top-0 z-10">
                                <th className="w-10 py-3 px-2"></th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.number')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('invoices.columns.shop')}</th>
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
                                const isBillRow = row.kind === 'bill'
                                const bill = isBillRow ? row.bill : null
                                const invoice = row.kind === 'consolidated' ? row.invoice : null
                                const isGrouped = isBillRow && !!bill!.groupedIntoId
                                const selectable = isBillRow && isBillSelectable(bill!)
                                const checked = isBillRow && selectedIds.includes(bill!.id)
                                const status = rowStatus(row)
                                return (
                                    <tr key={row.key} className="row-hover">
                                        <td className="py-3 px-2 text-center">
                                            {isBillRow && selectable && (
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(v) => toggleBill(bill!.id, v === true)}
                                                    aria-label={t('invoices.opticiens.selectForGroup')}
                                                />
                                            )}
                                        </td>
                                        <td className="py-3 px-4 font-medium">
                                            <span className="inline-flex items-center gap-2">
                                                {rowNumber(row)}
                                                {row.kind === 'consolidated' && (
                                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                                                        {t('invoices.opticiens.groupInvoice')}
                                                    </Badge>
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">{rowShop(row)}</td>
                                        <td className="py-3 px-4 text-sm">{formatDate(rowDate(row))}</td>
                                        <td className="py-3 px-4 text-right text-sm">{total.toFixed(3)}</td>
                                        <td className="py-3 px-4 text-right text-sm">{paid.toFixed(3)}</td>
                                        <td className={`py-3 px-4 text-right text-sm ${remaining > EPSILON ? 'text-destructive font-medium' : ''}`}>{remaining.toFixed(3)}</td>
                                        <td className="py-3 px-4 text-center">
                                            {isGrouped ? (
                                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                                                    {t('invoices.opticiens.grouped')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className={`${BILL_STATUS_BADGE[status] || ''} text-xs`}>
                                                    {status === 'paid' ? t('orders.fullyPaid') : status === 'partiallyPaid' ? t('orders.partiallyPaid') : t('orders.unpaid')}
                                                </Badge>
                                            )}
                                        </td>
                                        {isGrouped ? (
                                            <td className="py-3 px-4 text-center" colSpan={3}></td>
                                        ) : (
                                            <>
                                                <td className="py-3 px-4 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => (isBillRow ? setPreviewBill(bill!) : setPreviewGroup(invoice!))}
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
                                                        onClick={() => (isBillRow ? openBillPayment(bill!) : openGroupPayment(invoice!))}
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
                                                        onClick={() => (isBillRow ? downloadOpticianBill(bill!) : downloadGroupedInvoice(invoice!))}
                                                        title={t('invoices.opticiens.print')}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <BillPreviewDialog
                bill={previewBill}
                open={!!previewBill || !!previewGroup}
                onOpenChange={(open) => { if (!open) { setPreviewBill(null); setPreviewGroup(null) } }}
                onUpdated={refresh}
                consolidated={previewGroup}
            />

            <GroupBillsDialog
                open={groupDialogOpen}
                onOpenChange={setGroupDialogOpen}
                opticianShopId={selectedBills[0]?.opticianShopId || ''}
                shopName={selectedBills[0]?.opticianShop?.name || ''}
                bills={selectedBills.map((bill) => ({
                    id: bill.id,
                    billNumber: bill.billNumber,
                    remaining: Math.max(0, parseFloat(bill.totalAmount) - parseFloat(bill.paidAmount)),
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
