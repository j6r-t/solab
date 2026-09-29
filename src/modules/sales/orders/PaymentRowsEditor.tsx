'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchSelect } from '@/components/ui/search-select'
import { TUNISIAN_BANKS } from '@/lib/constants/banks'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { newPaymentRow, type PaymentRow, type PaymentRowMethod } from './order-form.types'

interface PaymentRowsEditorProps {
    rows: PaymentRow[]
    onChange: (updater: (prev: PaymentRow[]) => PaymentRow[]) => void
    paymentType: 'full' | 'deposit'
    onPaymentTypeChange: (type: 'full' | 'deposit') => void
    orderType: 'standard' | 'remounting' | 'direct_sale'
    grandTotal: number
    t: (key: string) => string
}

export function PaymentRowsEditor({ rows, onChange, paymentType, onPaymentTypeChange, orderType, grandTotal, t }: PaymentRowsEditorProps) {
    const paymentsTotal = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

    function addPaymentRow() {
        onChange((prev) => [...prev, newPaymentRow()])
    }

    function removePaymentRow(key: string) {
        onChange((prev) => prev.filter((p) => p.key !== key))
    }

    function updatePaymentRow(key: string, field: keyof PaymentRow, value: string) {
        onChange((prev) => prev.map((p) => {
            if (p.key !== key) return p
            if (field === 'method') return { ...p, method: value as PaymentRowMethod }
            return { ...p, [field]: value }
        }))
    }

    return (
        <div className="space-y-2">
            <Label>{t('orders.payment')}</Label>
            {orderType === 'direct_sale' ? (
                <div className="rounded-lg bg-muted/30 p-3 border text-sm text-muted-foreground">
                    {t('orders.directSalePayment')}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant={paymentType === 'full' ? 'default' : 'outline'} size="sm" onClick={() => onPaymentTypeChange('full')} className="flex-1 sm:flex-none">
                        {t('orders.full')}
                    </Button>
                    <Button type="button" variant={paymentType === 'deposit' ? 'default' : 'outline'} size="sm" onClick={() => onPaymentTypeChange('deposit')} className="flex-1 sm:flex-none">
                        {t('orders.deposit')}
                    </Button>
                </div>
            )}
            <div className="space-y-2 mt-2">
                <div className="flex justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={addPaymentRow}>
                        <Plus className="h-3 w-3 mr-1" /> {t('common.add')}
                    </Button>
                </div>
                {rows.map((row, index) => (
                    <div key={row.key} className="flex flex-col gap-2 p-3 bg-muted/20 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">{t('orders.payment')} #{index + 1}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removePaymentRow(row.key)}
                                disabled={rows.length === 1}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('payments.amount')} *</Label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={row.amount}
                                    onChange={(e) => updatePaymentRow(row.key, 'amount', e.target.value)}
                                    placeholder={paymentType === 'full' && grandTotal > 0 ? grandTotal.toFixed(3) : '0.000'}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('payments.method')} *</Label>
                                <Select value={row.method} onValueChange={(val) => updatePaymentRow(row.key, 'method', val)}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">{t('payments.cash')}</SelectItem>
                                        <SelectItem value="card">{t('payments.card')}</SelectItem>
                                        <SelectItem value="cheque">{t('payments.cheque')}</SelectItem>
                                        <SelectItem value="traite">{t('payments.traite')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {(row.method === 'cheque' || row.method === 'traite') && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('payments.instrumentNumber')} *</Label>
                                    <Input
                                        value={row.number}
                                        onChange={(e) => updatePaymentRow(row.key, 'number', e.target.value)}
                                        placeholder={row.method === 'traite' ? 'TRT-001' : 'CHQ-001'}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('payments.bankName')} *</Label>
                                    <SearchSelect
                                        options={TUNISIAN_BANKS.map((b) => ({ value: b, label: b }))}
                                        value={row.bank}
                                        onChange={(val) => updatePaymentRow(row.key, 'bank', val)}
                                        placeholder="BIAT"
                                        emptyMessage={t('common.noResults')}
                                        title={t('payments.bankName')}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('payments.dueDate')} *</Label>
                                    <Input
                                        type="date"
                                        value={row.dueDate}
                                        onChange={(e) => updatePaymentRow(row.key, 'dueDate', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {orderType !== 'direct_sale' && (
                    <div className="flex flex-wrap justify-end gap-4 text-sm pt-1">
                        <span>{t('payments.totalPaid')} <strong>{paymentsTotal.toFixed(3)} TND</strong></span>
                        <span className={paymentsTotal > grandTotal + 0.0001 ? 'text-destructive' : paymentsTotal === grandTotal ? 'text-green-600' : ''}>
                            {t('payments.balance')} <strong>{Math.max(grandTotal - paymentsTotal, 0).toFixed(3)} TND</strong>
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
