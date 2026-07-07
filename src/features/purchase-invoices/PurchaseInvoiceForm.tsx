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
import { fetchFournisseurs } from '@/features/fournisseurs/fournisseurs.api'
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
    method: 'cheque' | 'traite'
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
        payments?: { amount: number; method: 'cheque' | 'traite'; chequeNumber?: string; chequeBank?: string; chequeDueDate?: string }[]
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

    function updateItem(key: string, field: 'category' | 'quantity' | 'unitPrice', value: any) {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((item) => {
                if (item.key !== key) return item
                if (field === 'category') {
                    return { ...item, category: value, fields: emptyFields() }
                }
                return { ...item, [field]: value }
            }),
        }))
    }

    function addPayment() {
        setFormData((prev) => ({
            ...prev,
            payments: [...prev.payments, { key: newPayKey(), amount: 0, method: 'cheque', number: '', bank: '', dueDate: '' }],
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
            toast.error('Please select a supplier'); return
        }
        if (!formData.invoiceNumber.trim()) {
            toast.error('Invoice number is required'); return
        }
        if (formData.items.length === 0) {
            toast.error('At least one item is required'); return
        }
        for (const item of formData.items) {
            if (!item.category) {
                toast.error('Each item must have a category selected'); return
            }
            if (item.category === 'lunette' && (!item.fields.name.trim() || !item.fields.brand.trim())) {
                toast.error('Frames need a brand and name'); return
            }
            if (item.category === 'lentille' && !item.fields.name.trim()) {
                toast.error('Contact lenses need a name'); return
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
                    chequeNumber: p.number,
                    chequeBank: p.bank,
                    chequeDueDate: p.dueDate || undefined,
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
                    <Label className="text-sm font-medium">Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={!formData.fournisseurId}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                    </Button>
                </div>
                {formData.items.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Select a supplier, then add items by category.</p>
                )}
                {formData.items.map((item, index) => (
                    <div key={item.key} className="flex flex-col gap-2 p-3 bg-muted/20 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Item #{index + 1}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.key)} disabled={formData.items.length === 1}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">Category *</Label>
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
                                    <Label className="text-xs text-muted-foreground">Brand *</Label>
                                    <Input value={item.fields.brand} onChange={(e) => updateItemField(item.key, 'brand', e.target.value)} placeholder="Ray-Ban..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Name *</Label>
                                    <Input value={item.fields.name} onChange={(e) => updateItemField(item.key, 'name', e.target.value)} placeholder="Aviator..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Model / Ref</Label>
                                    <Input value={item.fields.model} onChange={(e) => updateItemField(item.key, 'model', e.target.value)} placeholder="RB3025..." className="h-9" />
                                </div>
                            </div>
                        )}
                        {item.category === 'lentille' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Brand</Label>
                                    <Input value={item.fields.brand} onChange={(e) => updateItemField(item.key, 'brand', e.target.value)} placeholder="CooperVision..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Name *</Label>
                                    <Input value={item.fields.name} onChange={(e) => updateItemField(item.key, 'name', e.target.value)} placeholder="Biofinity..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Type</Label>
                                    <Select value={item.fields.lensType} onValueChange={(val) => updateItemField(item.key, 'lensType', val)}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="--" /></SelectTrigger>
                                        <SelectContent>
                                            {LENS_TYPES.map((lt) => (
                                                <SelectItem key={lt} value={lt}>{lt === 'color' ? 'Color' : 'Optic'}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Size / Diameter</Label>
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
                                    <Label className="text-xs text-muted-foreground">Brand</Label>
                                    <Input value={item.fields.brand} onChange={(e) => updateItemField(item.key, 'brand', e.target.value)} placeholder="Brand..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Name</Label>
                                    <Input value={item.fields.name} onChange={(e) => updateItemField(item.key, 'name', e.target.value)} placeholder="Étui Cuir..." className="h-9" />
                                </div>
                            </div>
                        )}
                        {(item.category === 'nettoyant_lentilles' || item.category === 'nettoyant_monture') && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Name</Label>
                                    <Input value={item.fields.name} onChange={(e) => updateItemField(item.key, 'name', e.target.value)} placeholder="Solution Lentilles..." className="h-9" />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Size</Label>
                                    <Input value={item.fields.thickness} onChange={(e) => updateItemField(item.key, 'thickness', e.target.value)} placeholder="e.g. 50ml, 100ml..." className="h-9" />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-muted-foreground">Qty</Label>
                                <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.key, 'quantity', parseInt(e.target.value) || 1)} className="h-9" />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Unit Cost Price</Label>
                                <Input type="number" step="0.001" min="0" value={item.unitPrice} onChange={(e) => updateItem(item.key, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-9" />
                            </div>
                        </div>

                        {item.category && (
                            <p className="text-xs text-muted-foreground italic">
                                Description: {buildDescription(item.category as Category, item.fields)}
                            </p>
                        )}
                    </div>
                ))}
                <div className="text-right text-sm font-medium pt-1">
                    Total: {totalAmount.toFixed(3)} TND
                </div>
            </div>

            <div className="space-y-3 p-3 bg-muted/20 rounded-lg border">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Payments (Cheque / Traite)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPayment}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Payment
                    </Button>
                </div>
                {formData.payments.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No payments added. Invoice will be marked unpaid.</p>
                )}
                {formData.payments.map((pay, index) => (
                    <div key={pay.key} className="flex flex-col gap-2 p-3 bg-background rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Payment #{index + 1}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePayment(pay.key)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Amount *</Label>
                                <Input type="number" step="0.001" min="0" value={pay.amount} onChange={(e) => updatePayment(pay.key, 'amount', parseFloat(e.target.value) || 0)} className="h-9" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Type *</Label>
                                <Select value={pay.method} onValueChange={(val) => updatePayment(pay.key, 'method', val)}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="traite">Traite</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{pay.method === 'cheque' ? 'Cheque' : 'Traite'} # *</Label>
                                <Input value={pay.number} onChange={(e) => updatePayment(pay.key, 'number', e.target.value)} placeholder={pay.method === 'cheque' ? 'CHQ-001' : 'TRT-001'} className="h-9" />
                            </div>
                            {pay.method === 'cheque' && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Bank *</Label>
                                    <Input value={pay.bank} onChange={(e) => updatePayment(pay.key, 'bank', e.target.value)} placeholder="BIAT" className="h-9" />
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Due Date *</Label>
                                <Input type="date" value={pay.dueDate} onChange={(e) => updatePayment(pay.key, 'dueDate', e.target.value)} className="h-9" />
                            </div>
                        </div>
                    </div>
                ))}
                {formData.payments.length > 0 && (
                    <div className="flex justify-end gap-4 text-sm pt-1">
                        <span>Total paid: <strong>{totalPaid.toFixed(3)} TND</strong></span>
                        <span className={totalPaid > totalAmount ? 'text-destructive' : totalPaid === totalAmount ? 'text-green-600' : ''}>
                            Balance: <strong>{(totalAmount - totalPaid).toFixed(3)} TND</strong>
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>Notes</Label>
                <textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Optional notes..." rows={2} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
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
