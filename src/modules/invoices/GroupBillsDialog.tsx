'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileStack, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { groupOpticianShopBills } from '@/modules/partners/consolidated-invoices/consolidated-invoices.api'

export interface GroupBillCandidate {
    id: string
    billNumber: string
    remaining: number
}

interface GroupBillsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    opticianShopId: string
    shopName: string
    bills: GroupBillCandidate[]
    onDone: () => void
}

export function GroupBillsDialog({ open, onOpenChange, opticianShopId, shopName, bills, onDone }: GroupBillsDialogProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)

    if (bills.length === 0) return null

    const total = bills.reduce((sum, b) => sum + b.remaining, 0)

    async function handleConfirm() {
        setLoading(true)
        try {
            await groupOpticianShopBills({
                opticianShopId,
                billIds: bills.map((b) => b.id),
            })
            toast.success(t('invoices.opticiens.groupSuccess'))
            onOpenChange(false)
            onDone()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('invoices.opticiens.groupError'))
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
                        {t('invoices.opticiens.groupTitle')}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t('invoices.opticiens.groupConfirmDesc', { n: bills.length, shop: shopName })}
                    </p>

                    <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                        {bills.map((bill) => (
                            <div key={bill.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                <span className="font-medium">{bill.billNumber}</span>
                                <span className="text-muted-foreground">{bill.remaining.toFixed(3)} TND</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold bg-muted/40">
                            <span>{t('invoices.opticiens.groupTotal')}</span>
                            <span className="text-green-600">{total.toFixed(3)} TND</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('invoices.opticiens.groupCta')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
