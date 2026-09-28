'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Printer, Loader2, Wallet } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { fetchOpticianShopBill, type OpticianShopBill, type OpticianShopBillPayment } from '@/modules/partners/optician-shop-bills/optician-shop-bills.api'
import {
    fetchConsolidatedInvoice,
    type ConsolidatedInvoice,
    type ConsolidatedInvoicePayment,
} from '@/modules/partners/consolidated-invoices/consolidated-invoices.api'
import { PaymentDialog, type PaymentTarget } from '@/modules/sales/atelier-work-orders/PaymentDialog'
import { downloadOpticianBill } from './optician-bill.print'
import { downloadGroupedInvoice } from './grouped-invoice.print'

const BILL_STATUS_BADGE: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 border-green-200',
    partiallyPaid: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    unpaid: 'bg-red-100 text-red-700 border-red-200',
}

const EPSILON = 0.000001

interface BillPreviewDialogProps {
    bill: OpticianShopBill | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdated: () => void
    consolidated?: ConsolidatedInvoice | null
}

interface PreviewPayment {
    id: string
    amount: string
    method: string
    paidAt: string
    cheque: {
        status: string | null
        type: string | null
        number: string | null
    } | null
}

export function BillPreviewDialog({ bill, open, onOpenChange, onUpdated, consolidated }: BillPreviewDialogProps) {
    const { t } = useTranslation()
    const [paymentOpen, setPaymentOpen] = useState(false)

    const isGroup = !!consolidated

    // Fresh invoice (with payment history) fetched while the dialog is open
    const { data: billDetail, isLoading } = useQuery({
        queryKey: ['optician-shop-bill', bill?.id],
        queryFn: () => fetchOpticianShopBill(bill!.id),
        enabled: open && !!bill && !isGroup,
    })
    const { data: groupDetail, isLoading: groupLoading } = useQuery({
        queryKey: ['consolidated-invoice', consolidated?.id],
        queryFn: () => fetchConsolidatedInvoice(consolidated!.id),
        enabled: open && isGroup,
    })

    if (isGroup ? !consolidated : !bill) return null

    const current: OpticianShopBill | null = isGroup ? null : (billDetail ?? bill)
    const group: ConsolidatedInvoice | null = isGroup ? (groupDetail ?? consolidated!) : null
    if (!isGroup && !current) return null
    if (isGroup && !group) return null

    const number = isGroup ? group!.invoiceNumber : current!.billNumber
    const shopName = (isGroup ? group!.opticianShop?.name : current!.opticianShop?.name) || '—'
    const createdAt = isGroup ? group!.createdAt : current!.createdAt
    const total = parseFloat(isGroup ? group!.totalAmount : current!.totalAmount)
    const paid = parseFloat(isGroup ? group!.paidAmount : current!.paidAmount)
    const remaining = Math.max(0, total - paid)
    const status = isGroup ? group!.status : current!.status
    const payments: PreviewPayment[] = isGroup
        ? (group!.payments as ConsolidatedInvoicePayment[])
        : ((current!.payments ?? []) as OpticianShopBillPayment[])

    const paymentTarget: PaymentTarget = { kind: isGroup ? 'consolidated' : 'bill', id: isGroup ? group!.id : current!.id, total, paid, remaining }

    function handlePaymentDone() {
        onUpdated()
    }

    function paymentMethodLabel(p: PreviewPayment): string {
        if (p.method === 'cheque') return p.cheque?.type === 'traite' ? t('payments.traite') : t('payments.cheque')
        if (p.method === 'card') return t('payments.card')
        return t('payments.cash')
    }

    function instrumentBadge(p: PreviewPayment): { label: string; cls: string } | null {
        if (!p.cheque) return null
        if (p.cheque.status === 'cashed') return { label: t('payments.statusCleared'), cls: 'bg-green-100 text-green-700 border-green-200' }
        if (p.cheque.status === 'bounced') return { label: t('payments.statusBounced'), cls: 'bg-red-100 text-red-700 border-red-200' }
        return { label: t('payments.statusPending'), cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                {(isGroup ? groupLoading && !groupDetail : isLoading && !billDetail) ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[22px] font-bold text-green-600">Sofien Optic</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isGroup ? t('invoices.opticiens.groupInvoice') : t('payments.invoice')} &mdash; {number}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={BILL_STATUS_BADGE[status] || ''}>
                                    {status === 'paid' ? t('orders.fullyPaid') : status === 'partiallyPaid' ? t('orders.partiallyPaid') : t('orders.unpaid')}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5 text-sm">
                            <div className="space-y-2.5">
                                <FieldRow label={t('invoices.columns.shop')} value={shopName} />
                                <FieldRow label={t('invoices.columns.date')} value={formatDate(createdAt)} />
                            </div>
                            <div className="space-y-2.5">
                                <FieldRow label={t('invoices.columns.number')} value={number} />
                                <FieldRow label={t('payments.remaining')} value={`${remaining.toFixed(3)} TND`} />
                            </div>
                        </div>

                        {isGroup ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-green-600 text-white">
                                            <th className="p-2.5 text-left font-medium">{t('invoices.opticiens.groupSources')}</th>
                                            <th className="p-2.5 text-right font-medium">{t('invoices.opticiens.groupSourceAmount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {group!.items.map((item) => (
                                            <tr key={item.id} className="border-b">
                                                <td className="p-2.5">{t('invoices.opticiens.groupSourceBill', { number: item.sourceBillNumber })}</td>
                                                <td className="p-2.5 text-right">{formatCurrency(item.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-green-600 text-white">
                                            <th className="p-2.5 text-left font-medium">{t('invoices.print.designation')}</th>
                                            <th className="p-2.5 text-center font-medium">{t('invoices.print.qty')}</th>
                                            <th className="p-2.5 text-right font-medium">{t('invoices.print.unitPrice')}</th>
                                            <th className="p-2.5 text-right font-medium">{t('payments.total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {current!.items.map((item) => (
                                            <tr key={item.id} className="border-b">
                                                <td className="p-2.5">
                                                    {item.description
                                                        || (item.lensBlank ? `${item.lensBlank.brand} ${item.lensBlank.thickness}` : '')
                                                        || item.itemType}
                                                </td>
                                                <td className="p-2.5 text-center">{item.quantity}</td>
                                                <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                                                <td className="p-2.5 text-right">{formatCurrency((parseFloat(item.unitPrice) * item.quantity).toFixed(3))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex flex-col items-end gap-1.5 text-sm">
                            <div className="flex gap-6">
                                <span className="font-medium">{t('payments.total')}:</span>
                                <span className="w-24 text-right">{total.toFixed(3)} TND</span>
                            </div>
                            <div className="flex gap-6">
                                <span className="font-medium">{t('payments.paid')}:</span>
                                <span className="w-24 text-right">{paid.toFixed(3)} TND</span>
                            </div>
                            <div className="flex gap-6 text-base font-bold text-green-600 border-t-2 border-green-600 pt-1">
                                <span>{t('payments.remaining')}:</span>
                                <span className="w-24 text-right">{remaining.toFixed(3)} TND</span>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[340px]">
                            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('payments.history')}</p>
                            {payments.length === 0 ? (
                                <p className="text-xs text-muted-foreground">{t('payments.noPayments')}</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted sticky top-0 z-10">
                                            <th className="p-2 text-left font-medium">{t('payments.date')}</th>
                                            <th className="p-2 text-left font-medium">{t('payments.method')}</th>
                                            <th className="p-2 text-right font-medium">{t('payments.amount')}</th>
                                            <th className="p-2 text-left font-medium">{t('payments.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {payments.map((p) => {
                                            const badge = instrumentBadge(p)
                                            return (
                                                <tr key={p.id}>
                                                    <td className="p-2">{formatDate(p.paidAt)}</td>
                                                    <td className="p-2">
                                                        {paymentMethodLabel(p)}
                                                        {p.cheque?.number && <span className="text-muted-foreground"> · {p.cheque.number}</span>}
                                                    </td>
                                                    <td className="p-2 text-right">{formatCurrency(p.amount)}</td>
                                                    <td className="p-2">
                                                        {badge ? (
                                                            <Badge variant="outline" className={`px-1 py-0 text-[10px] ${badge.cls}`}>{badge.label}</Badge>
                                                        ) : '—'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                            {!isGroup && current!.groupedIntoId ? (
                                <p className="w-full text-xs text-muted-foreground">
                                    {t('workOrders.groupedHint', { invoiceNumber: current!.groupedInvoiceNumber ?? '—' })}
                                </p>
                            ) : (
                                remaining > EPSILON && (
                                    <Button size="sm" onClick={() => setPaymentOpen(true)}>
                                        <Wallet className="h-4 w-4 mr-1.5" />
                                        {t('payments.recordPayment')}
                                    </Button>
                                )
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => (isGroup ? downloadGroupedInvoice(group!) : downloadOpticianBill(current!))}
                            >
                                <Printer className="h-4 w-4 mr-1.5" />
                                {t('invoices.opticiens.print')}
                            </Button>
                        </div>
                    </div>
                )}

                <PaymentDialog
                    open={paymentOpen}
                    onOpenChange={setPaymentOpen}
                    target={paymentTarget}
                    onDone={handlePaymentDone}
                />
            </DialogContent>
        </Dialog>
    )
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="font-semibold shrink-0 w-28">{label}</span>
            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
            <span>{value}</span>
        </div>
    )
}
