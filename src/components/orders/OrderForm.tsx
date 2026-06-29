'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { Trash2, Plus, Package } from 'lucide-react'
import { toast } from 'sonner'

export interface OrderItemInput {
    productId: string
    quantity: number
    unitPrice: number
}

export interface OrderPaymentInput {
    amount: number
    type: 'full' | 'deposit' | 'balance'
}

export interface OrderRepairInput {
    type: string
    price: number
    expectedCompletionDate: string
}

export interface OrderFormData {
    clientId: string
    orderType: 'standard' | 'remounting' | 'direct_sale'
    items: OrderItemInput[]
    payments: OrderPaymentInput[]
    repairs: OrderRepairInput[]
    prescriptionId?: string
    turnaroundDays?: number
}

interface Client {
    id: string
    name: string
    familyName: string
    phone: string
}

interface Product {
    id: string
    name: string
    brand: string
    model: string
    price: string
    quantity: number
    category: string
}

interface PrescriptionOption {
    id: string
    doctorName: string
    createdAt: string
    client: { name: string; familyName: string }
}

interface OrderFormProps {
    defaultValues?: Partial<OrderFormData>
    onSubmit: (data: OrderFormData) => Promise<void>
    onCancel: () => void
}

export function OrderForm({ defaultValues, onSubmit, onCancel }: OrderFormProps) {
    const { t } = useTranslation()
    const [clients, setClients] = useState<Client[]>([])
    const [clientSearch, setClientSearch] = useState('')
    const [products, setProducts] = useState<Product[]>([])
    const [productSearch, setProductSearch] = useState('')
    const [orderType, setOrderType] = useState<'standard' | 'remounting' | 'direct_sale'>('standard')
    const [selectedClientId, setSelectedClientId] = useState(defaultValues?.clientId || '')
    const [items, setItems] = useState<OrderItemInput[]>(defaultValues?.items || [])
    const [repairs, setRepairs] = useState<OrderRepairInput[]>(defaultValues?.repairs || [])
    const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full')
    const [depositAmount, setDepositAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [prescriptions, setPrescriptions] = useState<PrescriptionOption[]>([])
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(defaultValues?.prescriptionId || '')
    const [turnaroundDays, setTurnaroundDays] = useState(defaultValues?.turnaroundDays?.toString() || '')

    useEffect(() => {
        fetch(`/api/clients?search=${encodeURIComponent(clientSearch)}`)
            .then((r) => r.ok && r.json())
            .then((data) => setClients(data || []))
            .catch(() => {})
    }, [clientSearch])

    useEffect(() => {
        fetch(`/api/stock?search=${encodeURIComponent(productSearch)}`)
            .then((r) => r.ok && r.json())
            .then((data) => setProducts(data || []))
            .catch(() => {})
    }, [productSearch])

    useEffect(() => {
        if (selectedClientId) {
            fetch(`/api/prescriptions?clientId=${selectedClientId}`)
                .then((r) => r.ok && r.json())
                .then((data) => setPrescriptions(data || []))
                .catch(() => {})
        } else {
            setPrescriptions([])
        }
    }, [selectedClientId])

    function addItem(product: Product) {
        setItems((prev) => [...prev, { productId: product.id, quantity: 1, unitPrice: parseFloat(product.price) }])
    }

    function updateItem(index: number, field: keyof OrderItemInput, value: number) {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index))
    }

    function addRepair() {
        const defaultDate = turnaroundDays
            ? new Date(Date.now() + parseInt(turnaroundDays) * 86400000).toISOString().split('T')[0]
            : ''
        setRepairs((prev) => [...prev, { type: '', price: 0, expectedCompletionDate: defaultDate }])
    }

    function updateRepair(index: number, field: keyof OrderRepairInput, value: string | number) {
        setRepairs((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
    }

    function removeRepair(index: number) {
        setRepairs((prev) => prev.filter((_, i) => i !== index))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const payments: OrderPaymentInput[] = []
            if (orderType === 'direct_sale') {
                payments.push({ amount: 0, type: 'full' })
            } else if (paymentType === 'full') {
                payments.push({ amount: 0, type: 'full' })
            } else {
                payments.push({ amount: parseFloat(depositAmount) || 0, type: 'deposit' })
            }
            await onSubmit({
                clientId: selectedClientId,
                orderType,
                items,
                payments,
                repairs,
                prescriptionId: selectedPrescriptionId || undefined,
                turnaroundDays: parseInt(turnaroundDays) || undefined,
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create order')
        } finally {
            setLoading(false)
        }
    }

    const clientOptions: SearchSelectOption[] = clients.map((c) => ({
        value: c.id,
        label: `${c.name} ${c.familyName}`,
        secondary: c.phone,
    }))

    const productOptions: SearchSelectOption[] = products
        .filter((p) => p.quantity > 0)
        .map((p) => ({
            value: p.id,
            label: `${p.name} (${p.brand})`,
            secondary: `${parseFloat(p.price).toFixed(3)} TND · ${p.quantity} in stock`,
        }))

    const prescriptionOptions: SearchSelectOption[] = prescriptions.map((p) => ({
        value: p.id,
        label: `Dr. ${p.doctorName}`,
        secondary: new Date(p.createdAt).toLocaleDateString(),
    }))

    const totalItemsPrice = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const totalRepairsPrice = repairs.reduce((s, r) => s + r.price, 0)
    const grandTotal = totalItemsPrice + totalRepairsPrice

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label>{t('orders.orderType')}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(['standard', 'remounting', 'direct_sale'] as const).map((type) => (
                        <Button
                            key={type}
                            type="button"
                            variant={orderType === type ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                setOrderType(type)
                                if (type === 'direct_sale') setPaymentType('full')
                            }}
                            className="h-auto flex-col items-start gap-1 py-3 px-3 text-left leading-tight whitespace-normal"
                        >
                            <span className="font-medium text-sm">{t(`orders.type_${type}`)}</span>
                            <span className="text-xs opacity-90 font-normal leading-relaxed text-pretty">{t(`orders.type_${type}_desc`)}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label>{t('orders.client')} *</Label>
                <SearchSelect
                    options={clientOptions}
                    value={selectedClientId}
                    onChange={(val) => { setSelectedClientId(val); setClientSearch('') }}
                    placeholder={t('common.search')}
                    searchPlaceholder={t('clients.searchPlaceholder')}
                    emptyMessage={t('clients.noClients')}
                    title={t('orders.client')}
                />
            </div>

            {(orderType === 'standard' || orderType === 'remounting') && selectedClientId && (
                <div className="space-y-2">
                    <Label>{t('prescriptions.title')}</Label>
                    {prescriptionOptions.length > 0 ? (
                        <SearchSelect
                            options={prescriptionOptions}
                            value={selectedPrescriptionId}
                            onChange={setSelectedPrescriptionId}
                            placeholder={t('common.select')}
                            searchPlaceholder={t('common.search')}
                            emptyMessage={t('prescriptions.noPrescriptions')}
                            title={t('prescriptions.title')}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground italic">{t('prescriptions.noPrescriptions')}</p>
                    )}
                </div>
            )}

            {(orderType === 'standard' || orderType === 'remounting') && (
                <div className="space-y-2">
                    <Label>{t('orders.turnaround')} <span className="text-muted-foreground font-normal">({t('orders.inDays')})</span></Label>
                    <Input
                        type="number"
                        min={1}
                        value={turnaroundDays}
                        onChange={(e) => setTurnaroundDays(e.target.value)}
                        placeholder={t('orders.turnaroundPlaceholder')}
                        className="h-9"
                    />
                </div>
            )}

            {(orderType === 'standard' || orderType === 'direct_sale') && (
                <div className="space-y-3">
                    <Label>{t('orders.items')}</Label>
                    <SearchSelect
                        options={productOptions}
                        value=""
                        onChange={(val) => {
                            const product = products.find((p) => p.id === val)
                            if (product) addItem(product)
                        }}
                        placeholder={t('stock.searchPlaceholder')}
                        searchPlaceholder={t('stock.searchPlaceholder')}
                        emptyMessage={t('stock.noProducts')}
                        title={t('orders.items')}
                    />
                    {items.length > 0 && (
                        <div className="space-y-1.5">
                            {items.map((item, i) => {
                                const product = products.find((p) => p.id === item.productId)
                                return (
                                    <div key={i} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border">
                                        <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="flex-1 text-sm font-medium truncate">{product?.name || item.productId}</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-14 h-7 text-xs"
                                        />
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="w-22 h-7 text-xs"
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-7 w-7 shrink-0">
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {(orderType === 'standard' || orderType === 'remounting') && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>{t('nav.repairs')}</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addRepair}>
                            <Plus className="h-3 w-3 mr-1" /> {t('common.add')}
                        </Button>
                    </div>
                    {repairs.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border">
                            <Input
                                value={r.type}
                                onChange={(e) => updateRepair(i, 'type', e.target.value)}
                                placeholder={t('repairs.type')}
                                className="flex-1 h-7 text-xs"
                            />
                            <Input
                                type="number"
                                step="0.001"
                                value={r.price || ''}
                                onChange={(e) => updateRepair(i, 'price', parseFloat(e.target.value) || 0)}
                                placeholder="Price"
                                className="w-20 h-7 text-xs"
                            />
                            <Input
                                type="date"
                                value={r.expectedCompletionDate}
                                onChange={(e) => updateRepair(i, 'expectedCompletionDate', e.target.value)}
                                className="w-34 h-7 text-xs"
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeRepair(i)} className="h-7 w-7 shrink-0">
                                <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                <Label>{t('orders.payment')}</Label>
                {orderType === 'direct_sale' ? (
                    <div className="rounded-lg bg-muted/30 p-3 border text-sm text-muted-foreground">
                        {t('orders.directSalePayment')}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button type="button" variant={paymentType === 'full' ? 'default' : 'outline'} size="sm" onClick={() => setPaymentType('full')}>
                            {t('orders.full')}
                        </Button>
                        <Button type="button" variant={paymentType === 'deposit' ? 'default' : 'outline'} size="sm" onClick={() => setPaymentType('deposit')}>
                            {t('orders.deposit')}
                        </Button>
                    </div>
                )}
                {paymentType === 'deposit' && (
                    <Input
                        type="number"
                        step="0.001"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder={t('orders.depositAmount')}
                        className="h-9"
                    />
                )}
            </div>

            <div className="rounded-lg bg-muted/30 border divide-y divide-border">
                {items.length > 0 && (
                    <div className="flex justify-between px-3 py-2 text-sm">
                        <span>{t('orders.items')}</span>
                        <span className="font-medium">{totalItemsPrice.toFixed(3)} TND</span>
                    </div>
                )}
                {repairs.length > 0 && (
                    <div className="flex justify-between px-3 py-2 text-sm">
                        <span>{t('nav.repairs')}</span>
                        <span className="font-medium">{totalRepairsPrice.toFixed(3)} TND</span>
                    </div>
                )}
                <div className="flex justify-between px-3 py-2.5 text-sm font-semibold text-base">
                    <span>{t('orders.total')}</span>
                    <span>{grandTotal.toFixed(3)} TND</span>
                </div>
            </div>

            <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={loading || !selectedClientId} className="flex-1 h-10">
                    {loading ? t('common.loading') : t('common.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="h-10">
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    )
}
