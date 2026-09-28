'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileStack, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { groupPurchaseInvoices } from '@/modules/inventory/supplier-consolidated-invoices/supplier-consolidated-invoices.api'

export interface GroupSupplierInvoiceCandidate {
    id: string
    invoiceNumber: string
    remaining: number
}

interface GroupSupplierInvoicesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fournisseurId: string
    fournisseurName: string
    invoices: GroupSupplierInvoiceCandidate[]
    onDone: () => void
}

export function GroupSupplierInvoicesDialog({ open, onOpenChange, fournisseurId, fournisseurName, invoices, onDone }: GroupSupplierInvoicesDialogProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)

    if (invoices.length === 0) return null

    const total = invoices.reduce((sum, inv) => sum + inv.remaining, 0)

    async function handleConfirm() {
        setLoading(true)
        try {
            await groupPurchaseInvoices({
                fournisseurId,
                invoiceIds: invoices.map((inv) => inv.id),
            })
            toast.success(t('invoices.fournisseurs.groupSuccess'))
            onOpenChange(false)
            onDone()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('invoices.fournisseurs.groupError'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileStack className="h-5 w-5 text-green-600" />
                        {t('invoices.fournisseurs.groupTitle')}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t('invoices.fournisseurs.groupConfirmDesc', { n: invoices.length, supplier: fournisseurName })}
                    </p>

                    <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                        {invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                <span className="font-medium">{inv.invoiceNumber}</span>
                                <span className="text-muted-foreground">{inv.remaining.toFixed(3)} TND</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold bg-muted/40">
                            <span>{t('invoices.fournisseurs.groupTotal')}</span>
                            <span className="text-green-600">{total.toFixed(3)} TND</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('invoices.fournisseurs.groupCta')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
