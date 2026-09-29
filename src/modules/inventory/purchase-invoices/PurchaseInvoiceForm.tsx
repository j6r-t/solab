'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { TUNISIAN_BANKS } from '@/lib/constants/banks'
import { fetchFournisseurs } from '@/modules/partners/fournisseurs/fournisseurs.api'
import { toast } from 'sonner'

const CATEGORIES = ['lunette', 'lentille', 'accessory', 'nettoyant_lentilles', 'nettoyant_monture'] as const
type Category = typeof CATEGORIES[number]

const LENS_TYPES = ['color', 'optic'] as const

interface ItemFields {
    name: string
    brand: string
    model: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sph: string
    cyl: string
    add: string
}

interface LineItem {
    key: string
    category: Category | ''
    fields: ItemFields
    quantity: number
    unitPrice: number
}

interface PaymentSplit {
    key: string
    amount: number
    method: 'cash' | 'cheque' | 'traite'
    number: string
    bank: string
    dueDate: string
}

interface FormData {
    invoiceNumber: string
    fournisseurId: string
    date: string
    items: LineItem[]
    payments: PaymentSplit[]
    notes: string
}

interface PurchaseInvoiceFormProps {
    onSubmit: (data: {
        invoiceNumber: string
        fournisseurId: string
        entity: 'shop' | 'atelier'
        date?: string
        items: { description: string; category: string; quantity: number; unitPrice: number }[]
        payments?: { amount: number; method: 'cash' | 'cheque' | 'traite'; chequeNumber?: string; chequeBank?: string; chequeDueDate?: string; chequeType?: string }[]
        notes?: string
    }) => Promise<void>
    onCancel: () => void
    saving?: boolean
    entity: 'shop' | 'atelier'
}

function emptyFields(): ItemFields {
    return { name: '', brand: '', model: '', lensType: '', material: '', coating: '', thickness: '', sph: '', cyl: '', add: '' }
}

function buildDescription(cat: Category, f: ItemFields): string {
    const parts: string[] = []
    if (f.brand && cat !== 'nettoyant_lentilles' && cat !== 'nettoyant_monture') parts.push(f.brand)
    if (f.name) parts.push(f.name)
    if (f.model) parts.push(f.model)
    if (cat === 'lentille') {
        if (f.lensType) parts.push(f.lensType)
        if (f.thickness) parts.push(f.thickness)
        if (f.lensType === 'optic') {
            const sph = f.sph ? `SPH${f.sph}` : ''
            const cyl = f.cyl ? `CYL${f.cyl}` : ''
            const add = f.add ? `ADD${f.add}` : ''
            const rx = [sph, cyl, add].filter(Boolean).join(' ')
            if (rx) parts.push(rx)
        }
    }
    if (cat === 'nettoyant_lentilles' || cat === 'nettoyant_monture') {
        if (f.thickness) parts.push(f.thickness)
    }
    return parts.join(' / ') || '—'
}

let itemKeyCounter = 0
function newItemKey() { return `item_${++itemKeyCounter}` }
let payKeyCounter = 0
function newPayKey() { return `pay_${++payKeyCounter}` }

export function PurchaseInvoiceForm({ onSubmit, onCancel, saving: externalSaving, entity }: PurchaseInvoiceFormProps) {
    const { t } = useTranslation()
    const [formData, setFormData] = useState<FormData>({
        invoiceNumber: '',
        fournisseurId: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        payments: [],
        notes: '',
    })
    const [fournisseurs, setFournisseurs] = useState<{ id: string; name: string }[]>([])
    const [internalSaving, setInternalSaving] = useState(false)
    const loading = internalSaving || externalSaving || false

    useEffect(() => {
        fetchFournisseurs({ entity }).then((data) => {
            setFournisseurs(data || [])
        }).catch(() => {})
    }, [entity])

    useEffect(() => {
        if (formData.fournisseurId) {
            fetch(`/api/purchase-invoices?generate=next-number&fournisseurId=${formData.fournisseurId}`)
                .then((r) => r.json())
                .then((data) => {
                    if (data?.invoiceNumber) {
                        setFormData((prev) => ({ ...prev, invoiceNumber: data.invoiceNumber }))
                    }
                })
                .catch(() => {})
        }
    }, [formData.fournisseurId])

    function addItem() {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { key: newItemKey(), category: '', fields: emptyFields(), quantity: 1, unitPrice: 0 }],
        }))
    }

    function removeItem(key: string) {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.key !== key),
        }))
    }

    function updateItemField(key: string, field: keyof ItemFields, value: string) {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.key === key ? { ...item, fields: { ...item.fields, [field]: value } } : item
            ),
        }))
    }

    function updateItem(key: string, field: 'category' | 'quantity' | 'unitPrice', value: string | number) {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((item) => {
                if (item.key !== key) return item
                if (field === 'category') {
                    return { ...item, category: value as Category, fields: emptyFields() }
                }
                return { ...item, [field]: value }
            }),
        }))
    }

    function addPayment() {
        setFormData((prev) => ({
            ...prev,
            payments: [...prev.payments, { key: newPayKey(), amount: 0, method: 'cash', number: '', bank: '', dueDate: '' }],
        }))
    }

    function removePayment(key: string) {
        setFormData((prev) => ({
            ...prev,
            payments: prev.payments.filter((p) => p.key !== key),
        }))
    }

    function updatePayment(key: string, field: keyof PaymentSplit, value: string | number) {
        setFormData((prev) => ({
            ...prev,
            payments: prev.payments.map((p) => p.key === key ? { ...p, [field]: value } : p),
        }))
    }

    const totalAmount = formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const totalPaid = formData.payments.reduce((sum, p) => sum + p.amount, 0)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.fournisseurId) {
            toast.error(t('purchaseInvoice.errorSupplierRequired')); return
        }
        if (!formData.invoiceNumber.trim()) {
            toast.error(t('purchaseInvoice.errorInvoiceNumberRequired')); return
        }
        if (formData.items.length === 0) {
            toast.error(t('purchaseInvoice.errorItemRequired')); return
        }
        for (const item of formData.items) {
            if (!item.category) {
                toast.error(t('purchaseInvoice.errorCategoryRequired')); return
            }
            if (item.category === 'lunette' && (!item.fields.name.trim() || !item.fields.brand.trim())) {
                toast.error(t('purchaseInvoice.errorFramesBrandName')); return
            }
            if (item.category === 'lentille' && !item.fields.name.trim()) {
                toast.error(t('purchaseInvoice.errorLensesName')); return
            }
        }

        setInternalSaving(true)
        try {
            await onSubmit({
                invoiceNumber: formData.invoiceNumber.trim(),
                fournisseurId: formData.fournisseurId,
                entity,
                date: formData.date || undefined,
                items: formData.items.map((item) => ({
                    description: buildDescription(item.category as Category, item.fields),
                    category: item.category,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                payments: formData.payments.length > 0 ? formData.payments.map((p) => ({
                    amount: p.amount,
                    method: p.method,
                    chequeNumber: (p.method === 'cheque' || p.method === 'traite') ? p.number : undefined,
                    chequeBank: (p.method === 'cheque' || p.method === 'traite') ? p.bank : undefined,
                    chequeDueDate: (p.method === 'cheque' || p.method === 'traite') ? (p.dueDate || undefined) : undefined,
                    chequeType: p.method === 'traite' ? 'traite' : undefined,
                })) : undefined,
                notes: formData.notes || undefined,
            })
        } finally {
            setInternalSaving(false)
        }
    }

    function catLabel(cat: string): string {
        const key = `stock.${cat}`
        const label = t(key)
        return label !== key ? label : cat
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t('purchaseInvoice.invoiceNumber')} *</Label>
                    <Input value={formData.invoiceNumber} onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))} placeholder="FAC-SUP-001" />
                </div>
                <div className="space-y-2">
                    <Label>{t('purchaseInvoice.supplier')} *</Label>
                    <SearchSelect
                        options={fournisseurs.map((f) => ({ value: f.id, label: f.name } as SearchSelectOption))}
                        value={formData.fournisseurId}
                        onChange={(val) => setFormData((prev) => ({ ...prev, fournisseurId: val }))}
                        placeholder={t('common.select')}
                        searchPlaceholder={t('common.search')}
                        emptyMessage={t('common.noResults')}
                        title={t('purchaseInvoice.supplier')}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>{t('purchaseInvoice.date')}</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))} />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t('purchaseInvoice.items')}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={!formData.fournisseurId}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> {t('purchaseInvoice.addItem')}
                    </Button>
                </div>
                {formData.items.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">{t('purchaseInvoice.itemsHint')}</p>
                )}
                {formData.items.map((item, index) => (
                    <div key={item.key} className="flex flex-col gap-2 p-3 bg-muted/20 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">{t('purchaseInvoice.itemNumber', { n: index + 1 })}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.key)} disabled={formData.items.length === 1}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">{t('stock.category')} *</Label>
                            <Select value={item.category} onValueChange={(val) => updateItem(item.key, 'category', val)}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="--" /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c}>{catLabel(c)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {item.category === 'lunette' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('stock.brand')} *</Label>
                                    <Input value={item.fields.brand} onChange={(e) => updateItemField(item.key, 'brand', e.target.value)} placeholder="Ray-Ban..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('stock.name')} *</Label>
                                    <Input value={item.fields.name} onChange={(e) => updateItemField(item.key, 'name', e.target.value)} placeholder="Aviator..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('stock.model')}</Label>
                                    <Input value={item.fields.model} onChange={(e) => updateItemField(item.key, 'model', e.target.value)} placeholder="RB3025..." className="h-9" />
                                </div>
                            </div>
                        )}
                        {item.category === 'lentille' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('stock.brand')}</Label>
                                    <Input value={item.fields.brand} onChange={(e) => updateItemField(item.key, 'brand', e.target.value)} placeholder="CooperVision..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('stock.name')} *</Label>
                                    <Input value={item.fields.name} onChange={(e) => updateItemField(item.key, 'name', e.target.value)} placeholder="Biofinity..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('orders.type')}</Label>
                                    <Select value={item.fields.lensType} onValueChange={(val) => updateItemField(item.key, 'lensType', val)}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="--" /></SelectTrigger>
                                        <SelectContent>
                                            {LENS_TYPES.map((lt) => (
                                                <SelectItem key={lt} value={lt}>{lt === 'color' ? t('purchaseInvoice.lensTypeColor') : t('purchaseInvoice.lensTypeOptic')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('purchaseInvoice.sizeDiameter')}</Label>
                                    <Input value={item.fields.thickness} onChange={(e) => updateItemField(item.key, 'thickness', e.target.value)} placeholder="e.g. 14.2mm" className="h-9" />
                                </div>
                                {item.fields.lensType === 'optic' && (
                                    <>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">SPH</Label>
                                            <Input value={item.fields.sph} onChange={(e) => updateItemField(item.key, 'sph', e.target.value)} placeholder="e.g. -2.00" className="h-9" />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">CYL</Label>
                                            <Input value={item.fields.cyl} onChange={(e) => updateItemField(item.key, 'cyl', e.target.value)} placeholder="e.g. -0.75" className="h-9" />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">ADD</Label>
                                            <Input value={item.fields.add} onChange={(e) => updateItemField(item.key, 'add', e.target.value)} placeholder="e.g. 2.50" className="h-9" />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        {item.category === 'accessory' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('stock.brand')}</Label>
                                    <Input value={item.fields.brand} onChange={(e) => updateItemField(item.key, 'brand', e.target.value)} placeholder="Brand..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('stock.name')}</Label>
                                    <Input value={item.fields.name} onChange={(e) => updateItemField(item.key, 'name', e.target.value)} placeholder="Étui Cuir..." className="h-9" />
                                </div>
                            </div>
                        )}
                        {(item.category === 'nettoyant_lentilles' || item.category === 'nettoyant_monture') && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('stock.name')}</Label>
                                    <Input value={item.fields.name} onChange={(e) => updateItemField(item.key, 'name', e.target.value)} placeholder="Solution Lentilles..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t('stock.size')}</Label>
                                    <Input value={item.fields.thickness} onChange={(e) => updateItemField(item.key, 'thickness', e.target.value)} placeholder="e.g. 50ml, 100ml..." className="h-9" />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-muted-foreground">{t('reports.qty')}</Label>
                                <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.key, 'quantity', parseInt(e.target.value) || 1)} className="h-9" />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">{t('purchaseInvoice.unitCostPrice')}</Label>
                                <Input type="number" step="0.001" min="0" value={item.unitPrice} onChange={(e) => updateItem(item.key, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-9" />
                            </div>
                        </div>

                        {item.category && (
                            <p className="text-xs text-muted-foreground italic">
                                {t('purchaseInvoice.itemDescription')} {buildDescription(item.category as Category, item.fields)}
                            </p>
                        )}
                    </div>
                ))}
                <div className="text-right text-sm font-medium pt-1">
                    {t('orders.total')}: {totalAmount.toFixed(3)} TND
                </div>
            </div>

            <div className="space-y-3 p-3 bg-muted/20 rounded-lg border">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t('purchaseInvoice.payments')}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPayment}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> {t('purchaseInvoice.addPayment')}
                    </Button>
                </div>
                {formData.payments.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">{t('purchaseInvoice.noPaymentsHint')}</p>
                )}
                {formData.payments.map((pay, index) => (
                    <div key={pay.key} className="flex flex-col gap-2 p-3 bg-background rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">{t('purchaseInvoice.paymentNumber', { n: index + 1 })}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePayment(pay.key)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('payments.amount')} *</Label>
                                <Input type="number" step="0.001" min="0" value={pay.amount} onChange={(e) => updatePayment(pay.key, 'amount', parseFloat(e.target.value) || 0)} className="h-9" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('payments.method')} *</Label>
                                <Select value={pay.method} onValueChange={(val) => updatePayment(pay.key, 'method', val)}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">{t('payments.cash')}</SelectItem>
                                        <SelectItem value="cheque">{t('payments.cheque')}</SelectItem>
                                        <SelectItem value="traite">{t('payments.traite')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {pay.method !== 'cash' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {(pay.method === 'cheque' || pay.method === 'traite') && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">{pay.method === 'traite' ? t('payments.traite') : t('payments.cheque')} # *</Label>
                                        <Input value={pay.number} onChange={(e) => updatePayment(pay.key, 'number', e.target.value)} placeholder={pay.method === 'traite' ? 'TRT-001' : 'CHQ-001'} className="h-9" />
                                    </div>
                                )}
                                {(pay.method === 'cheque' || pay.method === 'traite') && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">{t('payments.bankName')} *</Label>
                                        <SearchSelect
                                            options={TUNISIAN_BANKS.map((b) => ({ value: b, label: b }))}
                                            value={pay.bank}
                                            onChange={(val) => updatePayment(pay.key, 'bank', val)}
                                            placeholder="BIAT"
                                            emptyMessage={t('common.noResults')}
                                            title={t('payments.bankName')}
                                        />
                                    </div>
                                )}
                                {(pay.method === 'cheque' || pay.method === 'traite') && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">{t('payments.dueDate')} *</Label>
                                        <Input type="date" value={pay.dueDate} onChange={(e) => updatePayment(pay.key, 'dueDate', e.target.value)} className="h-9" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {formData.payments.length > 0 && (
                    <div className="flex justify-end gap-4 text-sm pt-1">
                        <span>{t('payments.totalPaid')} <strong>{totalPaid.toFixed(3)} TND</strong></span>
                        <span className={totalPaid > totalAmount ? 'text-destructive' : totalPaid === totalAmount ? 'text-green-600' : ''}>
                            {t('payments.balance')} <strong>{(totalAmount - totalPaid).toFixed(3)} TND</strong>
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>{t('clients.notes')}</Label>
                <textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder={t('common.notesPlaceholder')} rows={2} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" disabled={loading} className="w-full sm:flex-1">
                    {loading ? t('common.saving') : t('common.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    )
}
