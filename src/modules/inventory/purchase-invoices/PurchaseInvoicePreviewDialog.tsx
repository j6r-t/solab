'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { downloadPurchaseInvoice } from './purchase-invoice.print'

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
}

export function PurchaseInvoicePreviewDialog({ invoice, onClose }: Props) {
    if (!invoice) return null
    const inv = invoice
    const total = parseFloat(inv.totalAmount)
    const paid = parseFloat(inv.paidAmount)
    const balance = total - paid
    const statusColor = inv.paymentStatus === 'fullyPaid'
        ? 'bg-green-100 text-green-700 border-green-200'
        : inv.paymentStatus === 'partiallyPaid'
            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
            : 'bg-red-100 text-red-700 border-red-200'

    return (
        <Dialog open={!!invoice} onOpenChange={onClose}>
            <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="py-4">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-[22px] font-bold text-green-600">Sofien Optic</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Supplier Invoice &mdash; {inv.invoiceNumber}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" className="gap-1.5" onClick={() => downloadPurchaseInvoice(inv)}>
                                <Printer className="h-4 w-4 mr-1.5" />
                                Print / Download
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-5 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5 text-sm">
                            <div className="space-y-2.5">
                                <FieldRow label="Supplier:" value={inv.fournisseur.name} />
                                <FieldRow label="Phone:" value={inv.fournisseur.phone} />
                                <FieldRow label="Entity:" value={inv.entity === 'shop' ? 'Shop' : 'Atelier'} />
                            </div>
                            <div className="space-y-2.5">
                                <FieldRow label="Date:" value={new Date(inv.date).toLocaleDateString('fr-TN', { day: 'numeric', month: 'numeric', year: 'numeric' })} />
                                <FieldRow label="Invoice #:" value={inv.invoiceNumber} />
                                <FieldRow
                                    label="Status:"
                                    value={
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                                            {inv.paymentStatus === 'fullyPaid' ? 'Fully Paid' : inv.paymentStatus === 'partiallyPaid' ? 'Partially Paid' : 'Unpaid'}
                                        </span>
                                    }
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-green-600 text-white">
                                        <th className="p-2.5 text-left font-medium">Item</th>
                                        <th className="p-2.5 text-center font-medium">Qty</th>
                                        <th className="p-2.5 text-right font-medium">Unit Price</th>
                                        <th className="p-2.5 text-right font-medium">Total</th>
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

                        <div className="flex flex-col items-end gap-1.5 text-sm">
                            <div className="flex gap-6">
                                <span className="font-medium">Subtotal:</span>
                                <span className="w-24 text-right">{formatCurrency(inv.totalAmount)}</span>
                            </div>
                            <div className="flex gap-6">
                                <span className="font-medium">Paid:</span>
                                <span className="w-24 text-right">{formatCurrency(inv.paidAmount)}</span>
                            </div>
                            <div className="flex gap-6 text-base font-bold text-green-600 border-t-2 border-green-600 pt-1">
                                <span>Balance:</span>
                                <span className="w-24 text-right">{formatCurrency(balance.toFixed(3))}</span>
                            </div>
                        </div>

                        {inv.payments.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-2">Payment History</p>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50">
                                            <th className="p-2 text-left font-medium">Date</th>
                                            <th className="p-2 text-left font-medium">Method</th>
                                            <th className="p-2 text-right font-medium">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {inv.payments.map((p, i) => (
                                            <tr key={i}>
                                                <td className="p-2">{new Date(p.paidAt).toLocaleDateString('fr-TN')}</td>
                                                <td className="p-2 capitalize">{p.method}</td>
                                                <td className="p-2 text-right">{formatCurrency(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {inv.notes && (
                            <div className="p-3 bg-muted/30 rounded-lg text-sm">
                                <p className="font-semibold text-muted-foreground mb-1">Notes</p>
                                <p className="text-muted-foreground">{inv.notes}</p>
                            </div>
                        )}

                        <div className="border-t-2 border-green-600 pt-4 text-center text-xs text-muted-foreground leading-relaxed">
                            <p>Rue de la Liberte a cote Mosquee Omar ibn Elkhattab</p>
                            <p className="font-semibold text-green-600">Sofien Optic</p>
                            <p>24.398.692 &mdash; 24.248.632</p>
                        </div>
                    </div>
                </div>
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
