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
import { downloadPurchaseInvoice } from './purchase-invoice.print'
import {
    fetchSupplierConsolidatedInvoice,
    type SupplierConsolidatedInvoice,
} from '@/modules/inventory/supplier-consolidated-invoices/supplier-consolidated-invoices.api'
import { PaymentDialog, type PaymentTarget } from '@/modules/sales/atelier-work-orders/PaymentDialog'
import { downloadGroupedSupplierInvoice } from '@/modules/invoices/grouped-supplier-invoice.print'

interface PreviewInvoice {
    id: string
    invoiceNumber: string
    fournisseur: { id: string; name: string; phone: string }
    entity: string
    date: string
    totalAmount: string
    paidAmount: string
    paymentStatus: 'unpaid' | 'partiallyPaid' | 'fullyPaid'
    items: Array<{
        product: { name: string; brand: string } | null
        lensBlank: { brand: string; thickness: string } | null
        description: string | null
        category: string | null
        quantity: number
        unitPrice: string
    }>
    payments: Array<{
        amount: string
        method: string
        paidAt: string
    }>
    notes: string | null
    createdAt: string
}

interface Props {
    invoice: PreviewInvoice | null
    onClose: () => void
    consolidated?: SupplierConsolidatedInvoice | null
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

export function PurchaseInvoicePreviewDialog({ invoice, onClose, consolidated }: Props) {
    const { t } = useTranslation()
    const [paymentOpen, setPaymentOpen] = useState(false)

    const isGroup = !!consolidated

    // Fresh consolidated invoice (with payment history) fetched while the dialog is open
    const { data: groupDetail, isLoading: groupLoading } = useQuery({
        queryKey: ['supplier-consolidated-invoice', consolidated?.id],
        queryFn: () => fetchSupplierConsolidatedInvoice(consolidated!.id),
        enabled: isGroup && !!consolidated?.id,
    })

    if (!isGroup && !invoice) return null
    const inv = invoice!

    const group: SupplierConsolidatedInvoice | null = isGroup ? (groupDetail ?? consolidated!) : null
    if (isGroup && !group) return null

    const total = parseFloat(isGroup ? group!.totalAmount : inv.totalAmount)
    const paid = parseFloat(isGroup ? group!.paidAmount : inv.paidAmount)
    const balance = total - paid
    const status = isGroup ? group!.status : inv.paymentStatus
    const statusColor = status === 'paid' || status === 'fullyPaid'
        ? 'bg-green-100 text-green-700 border-green-200'
        : status === 'partiallyPaid'
            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
            : 'bg-red-100 text-red-700 border-red-200'
    const statusLabel = status === 'paid' || status === 'fullyPaid'
        ? t('purchaseInvoice.fullyPaid')
        : status === 'partiallyPaid'
            ? t('purchaseInvoice.partiallyPaid')
            : t('purchaseInvoice.unpaid')

    const number = isGroup ? group!.invoiceNumber : inv.invoiceNumber
    const supplierName = (isGroup ? group!.fournisseur?.name : inv.fournisseur.name) || '—'
    const date = isGroup ? group!.createdAt : inv.date
    const payments: PreviewPayment[] = isGroup
        ? group!.payments
        : []

    const paymentTarget: PaymentTarget = isGroup
        ? { kind: 'supplierConsolidated', id: group!.id, total, paid, remaining: Math.max(0, total - paid) }
        : { kind: 'purchaseInvoice', id: inv.id, total, paid, remaining: Math.max(0, total - paid) }

    function paymentMethodLabel(p: PreviewPayment): string {
        if (p.method === 'cheque') return p.cheque?.type === 'traite' ? t('payments.traite') : t('payments.cheque')
        if (p.method === 'card') return t('payments.card')
        return t('payments.cash')
    }

    function instrumentBadge(p: PreviewPayment): { label: string; cls: string } | null {
        if (!p.cheque) return null
        if (p.cheque.status === 'paid') return { label: t('invoices.echeances.statusPaid'), cls: 'bg-green-100 text-green-700 border-green-200' }
        if (p.cheque.status === 'bounced') return { label: t('payments.statusBounced'), cls: 'bg-red-100 text-red-700 border-red-200' }
        return { label: t('payments.statusPending'), cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    }

    return (
        <Dialog open={!!invoice || !!consolidated} onOpenChange={onClose}>
            <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                {isGroup && groupLoading && !groupDetail ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                    </div>
                ) : (
                <div className="py-4">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-[22px] font-bold text-green-600">Sofien Optic</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isGroup ? t('invoices.fournisseurs.groupInvoice') : t('purchaseInvoice.supplierInvoiceTitle')} &mdash; {number}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={statusColor}>
                                {statusLabel}
                            </Badge>
                            {!isGroup && (
                                <Button size="sm" className="gap-1.5" onClick={() => downloadPurchaseInvoice(inv)}>
                                    <Printer className="h-4 w-4 mr-1.5" />
                                    {t('purchaseInvoice.printDownload')}
                                </Button>
                            )}
                            {isGroup && (
                                <Button
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() =>
                                        downloadGroupedSupplierInvoice({
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
                                >
                                    <Printer className="h-4 w-4 mr-1.5" />
                                    {t('purchaseInvoice.printDownload')}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-5 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5 text-sm">
                            <div className="space-y-2.5">
                                <FieldRow label={`${t('purchaseInvoice.supplier')}:`} value={supplierName} />
                                {!isGroup && <FieldRow label={`${t('clients.phone')}:`} value={inv.fournisseur.phone} />}
                                <FieldRow label={`${t('purchaseInvoice.entity')}:`} value={(isGroup ? group!.entity : inv.entity) === 'shop' ? t('role.shop') : t('role.atelier')} />
                            </div>
                            <div className="space-y-2.5">
                                <FieldRow label={`${t('payments.date')}:`} value={formatDate(date)} />
                                <FieldRow label={`${t('purchaseInvoice.invoiceNumber')}:`} value={number} />
                                <FieldRow
                                    label={`${t('payments.status')}:`}
                                    value={
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    }
                                />
                            </div>
                        </div>

                        {isGroup ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-green-600 text-white">
                                            <th className="p-2.5 text-left font-medium">{t('invoices.fournisseurs.groupSources')}</th>
                                            <th className="p-2.5 text-right font-medium">{t('invoices.fournisseurs.groupSourceAmount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {group!.items.map((item) => (
                                            <tr key={item.id} className="border-b">
                                                <td className="p-2.5">{t('invoices.fournisseurs.groupSourceInvoice', { number: item.sourceInvoiceNumber })}</td>
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
                                        <th className="p-2.5 text-left font-medium">{t('purchaseInvoice.item')}</th>
                                        <th className="p-2.5 text-center font-medium">{t('reports.qty')}</th>
                                        <th className="p-2.5 text-right font-medium">{t('purchaseInvoice.unitPrice')}</th>
                                        <th className="p-2.5 text-right font-medium">{t('orders.total')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {inv.items.map((item, i) => {
                                        const name = item.description
                                            || (item.product ? `${item.product.brand} ${item.product.name}` : '')
                                            || (item.lensBlank ? `${item.lensBlank.brand} ${item.lensBlank.thickness}` : '')
                                            || '\u2014'
                                        return (
                                            <tr key={i} className="border-b">
                                                <td className="p-2.5">{name}</td>
                                                <td className="p-2.5 text-center">{item.quantity}</td>
                                                <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                                                <td className="p-2.5 text-right">{formatCurrency((parseFloat(item.unitPrice) * item.quantity).toFixed(3))}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        )}

                        <div className="flex flex-col items-end gap-1.5 text-sm">
                            <div className="flex gap-6">
                                <span className="font-medium">{t('purchaseInvoice.subtotal')}</span>
                                <span className="w-24 text-right">{formatCurrency(isGroup ? group!.totalAmount : inv.totalAmount)}</span>
                            </div>
                            <div className="flex gap-6">
                                <span className="font-medium">{t('payments.paid')}:</span>
                                <span className="w-24 text-right">{formatCurrency(isGroup ? group!.paidAmount : inv.paidAmount)}</span>
                            </div>
                            <div className="flex gap-6 text-base font-bold text-green-600 border-t-2 border-green-600 pt-1">
                                <span>{t('payments.balance')}</span>
                                <span className="w-24 text-right">{formatCurrency(balance.toFixed(3))}</span>
                            </div>
                        </div>

                        {isGroup && (
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
                        )}

                        {!isGroup && inv.payments.length > 0 && (
                            <div className="overflow-y-auto max-h-[340px]">
                                <p className="text-sm font-semibold text-muted-foreground mb-2">{t('payments.history')}</p>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted sticky top-0 z-10">
                                            <th className="p-2 text-left font-medium">{t('payments.date')}</th>
                                            <th className="p-2 text-left font-medium">{t('payments.method')}</th>
                                            <th className="p-2 text-right font-medium">{t('payments.amount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {inv.payments.map((p, i) => (
                                            <tr key={i}>
                                                <td className="p-2">{formatDate(p.paidAt)}</td>
                                                <td className="p-2 capitalize">{p.method}</td>
                                                <td className="p-2 text-right">{formatCurrency(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {(isGroup ? group!.notes : inv.notes) && (
                            <div className="p-3 bg-muted/30 rounded-lg text-sm">
                                <p className="font-semibold text-muted-foreground mb-1">{t('clients.notes')}</p>
                                <p className="text-muted-foreground">{isGroup ? group!.notes : inv.notes}</p>
                            </div>
                        )}

                        <div className="border-t-2 border-green-600 pt-4 text-center text-xs text-muted-foreground leading-relaxed">
                            <p>Rue de la Liberte a cote Mosquee Omar ibn Elkhattab</p>
                            <p className="font-semibold text-green-600">Sofien Optic</p>
                            <p>24.398.692 &mdash; 24.248.632</p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                            {balance > 0.000001 && (
                                <Button size="sm" onClick={() => setPaymentOpen(true)}>
                                    <Wallet className="h-4 w-4 mr-1.5" />
                                    {t('payments.recordPayment')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                )}

                <PaymentDialog
                    open={paymentOpen}
                    onOpenChange={setPaymentOpen}
                    target={paymentTarget}
                    onDone={onClose}
                />
            </DialogContent>
        </Dialog>
    )
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="font-semibold shrink-0 w-24">{label}</span>
            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
            <span>{value}</span>
        </div>
    )
}
