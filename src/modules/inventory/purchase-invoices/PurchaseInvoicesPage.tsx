'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Loader2, Download, Eye } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { PurchaseInvoiceForm } from './PurchaseInvoiceForm'
import { downloadPurchaseInvoice } from './purchase-invoice.print'
import { PurchaseInvoicePreviewDialog } from './PurchaseInvoicePreviewDialog'
import { usePurchaseInvoices, type PurchaseInvoice } from './usePurchaseInvoices'
import { toast } from 'sonner'

export function PurchaseInvoicesPage() {
    const { t } = useTranslation()
    const { user } = useAuthStore()
    const entity = user?.role === 'atelier' ? 'atelier' : 'shop'
    const [paymentFilter, setPaymentFilter] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [previewInvoice, setPreviewInvoice] = useState<PurchaseInvoice | null>(null)

    const { data: invoicesData, isLoading: loading, refetch: reFetch } = usePurchaseInvoices({ entity, paymentStatus: paymentFilter || undefined })
    const invoices = invoicesData ?? []

    async function handleCreate(data: object) {
        setSaving(true)
        try {
            const res = await fetch('/api/purchase-invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to create invoice')
            }
            toast.success('Invoice created')
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create')
        } finally {
            setSaving(false)
        }
    }

    const totalAmount = invoices.reduce((s, inv) => s + parseFloat(inv.totalAmount), 0)
    const totalPaid = invoices.reduce((s, inv) => s + parseFloat(inv.paidAmount), 0)
    const totalBalance = totalAmount - totalPaid

    return (
        <div className="space-y-6 max-w-[1000px]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-medium">{t('purchaseInvoice.title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage supplier invoices for shop and atelier</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('purchaseInvoice.newInvoice')}
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t('purchaseInvoice.totalAmount')}</p>
                    <p className="text-xl font-semibold mt-1">{totalAmount.toFixed(3)} TND</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t('purchaseInvoice.totalPaid')}</p>
                    <p className="text-xl font-semibold mt-1 text-green-600">{totalPaid.toFixed(3)} TND</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t('purchaseInvoice.totalBalance')}</p>
                    <p className="text-xl font-semibold mt-1 text-destructive">{totalBalance.toFixed(3)} TND</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search invoices..." className="pl-10 h-10" />
                </div>
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

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : invoices.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('purchaseInvoice.noInvoices')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">Create your first supplier invoice to track purchases.</p>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                    </Button>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/30 border-b">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('purchaseInvoice.invoiceNumber')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('purchaseInvoice.supplier')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('purchaseInvoice.date')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('purchaseInvoice.totalAmount')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('purchaseInvoice.paid')}</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">{t('purchaseInvoice.paymentStatus')}</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground" colSpan={2}></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {invoices.map((inv) => {
                                const statusColor = inv.paymentStatus === 'fullyPaid' ? 'bg-green-100 text-green-700 border-green-200' : inv.paymentStatus === 'partiallyPaid' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200'
                                return (
                                    <tr key={inv.id} className="row-hover">
                                        <td className="py-3 px-4 font-medium">{inv.invoiceNumber}</td>
                                        <td className="py-3 px-4">{inv.fournisseur.name}</td>
                                        <td className="py-3 px-4 text-sm">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 text-right">{parseFloat(inv.totalAmount).toFixed(3)}</td>
                                        <td className="py-3 px-4 text-right">{parseFloat(inv.paidAmount).toFixed(3)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant="outline" className={`${statusColor} text-xs`}>
                                                {inv.paymentStatus === 'fullyPaid' ? t('purchaseInvoice.fullyPaid') : inv.paymentStatus === 'partiallyPaid' ? t('purchaseInvoice.partiallyPaid') : t('purchaseInvoice.unpaid')}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewInvoice(inv)} title="Preview invoice">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadPurchaseInvoice(inv)} title="Download invoice">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('purchaseInvoice.newInvoice')}</DialogTitle>
                    </DialogHeader>
                    <PurchaseInvoiceForm
                        entity={entity}
                        onSubmit={handleCreate}
                        onCancel={() => setDialogOpen(false)}
                        saving={saving}
                    />
                </DialogContent>
            </Dialog>

            <PurchaseInvoicePreviewDialog
                invoice={previewInvoice}
                onClose={() => setPreviewInvoice(null)}
            />
        </div>
    )
}
