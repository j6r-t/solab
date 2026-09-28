'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchSelect } from '@/components/ui/search-select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TUNISIAN_BANKS } from '@/lib/constants/banks'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { recordBillPayment } from '@/modules/partners/optician-shop-bills/optician-shop-bills.api'
import { recordConsolidatedPayment } from '@/modules/partners/consolidated-invoices/consolidated-invoices.api'
import { addPurchaseInvoicePayment } from '@/modules/inventory/purchase-invoices/purchase-invoices.api'
import { recordSupplierConsolidatedPayment } from '@/modules/inventory/supplier-consolidated-invoices/supplier-consolidated-invoices.api'
import { recordWorkOrderPayment } from '../repairs/repairs.api'
import { addOrderPayments } from '@/modules/sales/orders/orders.api'

export interface PaymentTarget {
    kind: 'bill' | 'workorder' | 'consolidated' | 'purchaseInvoice' | 'supplierConsolidated' | 'order'
    id: string
    total: number
    paid: number
    remaining: number
}

interface PaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    target: PaymentTarget | null
    onDone: () => void
}

type MethodValue = 'cash' | 'card' | 'cheque' | 'traite'

const EPSILON = 0.000001

export function PaymentDialog({ open, onOpenChange, target, onDone }: PaymentDialogProps) {
    const { t } = useTranslation()
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState<MethodValue>('cash')
    const [chequeNumber, setChequeNumber] = useState('')
    const [chequeBankName, setChequeBankName] = useState('')
    const [chequeDueDate, setChequeDueDate] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const isWorkOrder = target?.kind === 'workorder'
    const isBillLike = target?.kind === 'bill' || target?.kind === 'consolidated'
    const isSupplierLike = target?.kind === 'purchaseInvoice' || target?.kind === 'supplierConsolidated'
    const isOrder = target?.kind === 'order'
    const isInstrument = (isBillLike || isSupplierLike) && (method === 'cheque' || method === 'traite')
    const showNotes = isBillLike || target?.kind === 'supplierConsolidated'

    // Prefill the remaining balance and reset fields whenever the dialog opens
    // for a target (render-phase state adjustment, cf. WorkOrderDetailDialog)
    const syncKey = open && target ? `${target.id}:${target.remaining}` : null
    const [syncedKey, setSyncedKey] = useState<string | null>(null)
    if (syncKey !== syncedKey) {
        setSyncedKey(syncKey)
        setAmount(target && syncKey !== null && target.remaining > EPSILON ? target.remaining.toFixed(3) : '')
        setMethod('cash')
        setChequeNumber('')
        setChequeBankName('')
        setChequeDueDate('')
        setNotes('')
    }

    if (!target) return null
    const tgt = target

    function validate(): string | null {
        const value = parseFloat(amount)
        if (isNaN(value) || value <= 0) return t('payments.errors.invalidAmount')
        if (value > tgt.remaining + EPSILON) return t('payments.errors.overpay')
        if (isInstrument && (!chequeNumber.trim() || !chequeDueDate)) return t('payments.errors.chequeRequired')
        return null
    }

    async function handleSubmit() {
        const error = validate()
        if (error) {
            toast.error(error)
            return
        }
        setLoading(true)
        try {
            if (isWorkOrder) {
                await recordWorkOrderPayment(tgt.id, parseFloat(amount))
            } else if (tgt.kind === 'order') {
                await addOrderPayments(tgt.id, [{ amount: parseFloat(amount), type: 'balance', method }])
            } else if (tgt.kind === 'consolidated') {
                await recordConsolidatedPayment(tgt.id, {
                    amount: parseFloat(amount),
                    method,
                    ...(isInstrument
                        ? {
                              chequeNumber: chequeNumber.trim(),
                              chequeBankName: chequeBankName.trim() || undefined,
                              chequeDueDate,
                          }
                        : {}),
                    notes: notes.trim() || undefined,
                })
            } else if (tgt.kind === 'supplierConsolidated') {
                await recordSupplierConsolidatedPayment(tgt.id, {
                    amount: parseFloat(amount),
                    method: method as 'cash' | 'cheque' | 'traite',
                    ...(isInstrument
                        ? {
                              chequeNumber: chequeNumber.trim(),
                              chequeBankName: chequeBankName.trim() || undefined,
                              chequeDueDate,
                          }
                        : {}),
                    notes: notes.trim() || undefined,
                })
            } else if (tgt.kind === 'purchaseInvoice') {
                await addPurchaseInvoicePayment(tgt.id, {
                    amount: parseFloat(amount),
                    method: method as 'cash' | 'cheque' | 'traite',
                    ...(isInstrument
                        ? {
                              chequeNumber: chequeNumber.trim(),
                              chequeBank: chequeBankName.trim() || undefined,
                              chequeDueDate,
                          }
                        : {}),
                })
            } else {
                await recordBillPayment(tgt.id, {
                    amount: parseFloat(amount),
                    method,
                    ...(isInstrument
                        ? {
                              chequeNumber: chequeNumber.trim(),
                              chequeBankName: chequeBankName.trim() || undefined,
                              chequeDueDate,
                          }
                        : {}),
                    notes: notes.trim() || undefined,
                })
            }
            if (!isOrder) toast.success(t('payments.success'))
            onOpenChange(false)
            onDone()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('payments.errors.failed'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('payments.recordPayment')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs">{t('payments.total')}</p>
                            <p className="font-medium">{target.total.toFixed(3)} TND</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{t('payments.paid')}</p>
                            <p className="font-medium">{target.paid.toFixed(3)} TND</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{t('payments.remaining')}</p>
                            <p className="font-medium text-destructive">{target.remaining.toFixed(3)} TND</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="payment-amount">{t('payments.amount')} (TND)</Label>
                        <Input
                            id="payment-amount"
                            type="number"
                            step="0.001"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    {(isBillLike || isSupplierLike || isOrder) && (
                        <>
                            <div className="space-y-1.5">
                                <Label htmlFor="payment-method">{t('payments.method')}</Label>
                                <select
                                    id="payment-method"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value as MethodValue)}
                                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                >
                                    <option value="cash">{t('payments.cash')}</option>
                                    {(isBillLike || isOrder) && <option value="card">{t('payments.card')}</option>}
                                    {!isOrder && <option value="cheque">{t('payments.cheque')}</option>}
                                    {!isOrder && <option value="traite">{t('payments.traite')}</option>}
                                </select>
                            </div>

                            {isInstrument && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="payment-cheque-number">{t('payments.instrumentNumber')} *</Label>
                                        <Input
                                            id="payment-cheque-number"
                                            value={chequeNumber}
                                            onChange={(e) => setChequeNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>{t('payments.bankName')}</Label>
                                        <SearchSelect
                                            options={TUNISIAN_BANKS.map((b) => ({ value: b, label: b }))}
                                            value={chequeBankName}
                                            onChange={setChequeBankName}
                                            placeholder={t('payments.bankName')}
                                            emptyMessage={t('common.noResults')}
                                            title={t('payments.bankName')}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="payment-cheque-due">{t('payments.dueDate')} *</Label>
                                        <Input
                                            id="payment-cheque-due"
                                            type="date"
                                            value={chequeDueDate}
                                            onChange={(e) => setChequeDueDate(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {showNotes && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="payment-notes">{t('payments.notes')}</Label>
                                    <Input
                                        id="payment-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !amount}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('payments.recordPayment')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
