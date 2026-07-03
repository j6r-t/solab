'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Trash2, Plus, Package, Wrench, QrCode, Camera, Loader2, X } from 'lucide-react'
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
    repairServiceId?: string
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
    doctor: { name: string } | null
    createdAt: string
    client: { name: string; familyName: string }
}

interface RepairService {
    id: string
    name: string
    defaultPrice: string
}

interface OrderFormProps {
    defaultValues?: Partial<OrderFormData>
    onSubmit: (data: OrderFormData) => Promise<void>
    onCancel: () => void
    saving?: boolean
    forcedOrderType?: 'standard' | 'remounting' | 'direct_sale'
}

export function OrderForm({ defaultValues, onSubmit, onCancel, saving: externalSaving, forcedOrderType }: OrderFormProps) {
    const { t } = useTranslation()
    const [clients, setClients] = useState<Client[]>([])
    const [clientSearch, setClientSearch] = useState('')
    const [products, setProducts] = useState<Product[]>([])
    const [productSearch, setProductSearch] = useState('')
    const [orderType, setOrderType] = useState<'standard' | 'remounting' | 'direct_sale'>(forcedOrderType || defaultValues?.orderType || 'standard')
    const [selectedClientId, setSelectedClientId] = useState(defaultValues?.clientId || '')
    const [items, setItems] = useState<OrderItemInput[]>(defaultValues?.items || [])
    const [repairs, setRepairs] = useState<OrderRepairInput[]>(defaultValues?.repairs || [])
    const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full')
    const [depositAmount, setDepositAmount] = useState('')
    const [internalSaving, setInternalSaving] = useState(false)
    const saving = internalSaving || externalSaving
    const [prescriptions, setPrescriptions] = useState<PrescriptionOption[]>([])
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(defaultValues?.prescriptionId || '')
    const [expectedCompletionDate, setExpectedCompletionDate] = useState('')
    const [repairServices, setRepairServices] = useState<RepairService[]>([])
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
    const [showNewRx, setShowNewRx] = useState(false)
    const [newRxRight, setNewRxRight] = useState({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
    const [newRxLeft, setNewRxLeft] = useState({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
    const [creatingRx, setCreatingRx] = useState(false)
    const [qrScanOpen, setQrScanOpen] = useState(false)
    const [qrScanning, setQrScanning] = useState(false)
    const qrReaderRef = useRef<HTMLDivElement>(null)
    const html5QrRef = useRef<unknown>(null)

    async function handleQrScan(result: string) {
        setQrScanning(false)
        try {
            const res = await fetch(`/api/qrcode?code=${encodeURIComponent(result)}`)
            if (!res.ok) {
                toast.error('Product not found for this QR code')
                return
            }
            const product = await res.json()
            addItem(product)
            toast.success(`${product.name} added`)
            setQrScanOpen(false)
        } catch {
            toast.error('Failed to look up QR code')
        }
    }

    useEffect(() => {
        if (!qrScanOpen || !qrReaderRef.current) return
        let cancelled = false
        async function start() {
            try {
                const { Html5Qrcode } = await import('html5-qrcode')
                if (cancelled) return
                const reader = new Html5Qrcode('qr-reader')
                html5QrRef.current = reader
                setQrScanning(true)
                await reader.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText: string) => {
                        if (!cancelled) {
                            reader.stop().catch(() => {})
                            handleQrScan(decodedText)
                        }
                    },
                    () => {},
                )
            } catch {
                if (!cancelled) {
                    toast.error('Camera access denied or not supported')
                    setQrScanOpen(false)
                }
            }
        }
        start()
        return () => {
            cancelled = true
            setQrScanning(false)
            const reader = html5QrRef.current as { stop: () => Promise<void> } | null
            if (reader) { reader.stop().catch(() => {}); html5QrRef.current = null }
        }
    }, [qrScanOpen])

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
            setSelectedPrescriptionId('')
            fetch(`/api/prescriptions?clientId=${selectedClientId}`)
                .then((r) => r.ok && r.json())
                .then((data) => setPrescriptions(data || []))
                .catch(() => {})
        } else {
            setPrescriptions([])
            setSelectedPrescriptionId('')
        }
    }, [selectedClientId])

    useEffect(() => {
        if (prescriptions.length > 0 && !selectedPrescriptionId) {
            setSelectedPrescriptionId(prescriptions[0].id)
        }
    }, [prescriptions, selectedPrescriptionId])

    useEffect(() => {
        fetch('/api/repair-services')
            .then((r) => r.ok && r.json())
            .then((data) => setRepairServices(data || []))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (forcedOrderType) setOrderType(forcedOrderType)
    }, [forcedOrderType])

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
        const date = expectedCompletionDate || new Date().toISOString().split('T')[0]
        setRepairs((prev) => [...prev, { type: '', price: 0, expectedCompletionDate: date }])
    }

    function updateRepair(index: number, field: keyof OrderRepairInput, value: string | number) {
        setRepairs((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
    }

    function removeRepair(index: number) {
        setRepairs((prev) => prev.filter((_, i) => i !== index))
    }

    function toggleRepairService(service: RepairService) {
        const isSelected = selectedServiceIds.includes(service.id)
        if (isSelected) {
            setSelectedServiceIds((prev) => prev.filter((id) => id !== service.id))
            setRepairs((prev) => prev.filter((r) => r.repairServiceId !== service.id))
        } else {
            setSelectedServiceIds((prev) => [...prev, service.id])
            const date = expectedCompletionDate || new Date().toISOString().split('T')[0]
            setRepairs((prev) => [
                ...prev,
                {
                    type: service.name,
                    price: parseFloat(service.defaultPrice),
                    expectedCompletionDate: date,
                    repairServiceId: service.id,
                },
            ])
        }
    }

    async function handleCreatePrescription() {
        setCreatingRx(true)
        try {
            const res = await fetch('/api/prescriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClientId,
                    sphRight: newRxRight.sph, cylRight: newRxRight.cyl, axisRight: newRxRight.axis, addRight: newRxRight.add, pdRight: newRxRight.pd,
                    sphLeft: newRxLeft.sph, cylLeft: newRxLeft.cyl, axisLeft: newRxLeft.axis, addLeft: newRxLeft.add, pdLeft: newRxLeft.pd,
                }),
            })
            if (res.ok) {
                const created = await res.json()
                const refreshed = await fetch(`/api/prescriptions?clientId=${selectedClientId}`)
                if (refreshed.ok) setPrescriptions(await refreshed.json())
                setSelectedPrescriptionId(created.id)
                setShowNewRx(false)
                setNewRxRight({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
                setNewRxLeft({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
            }
        } finally {
            setCreatingRx(false)
        }
    }

    function updateServiceRepairDate(serviceId: string, date: string) {
        setRepairs((prev) => prev.map((r) => (r.repairServiceId === serviceId ? { ...r, expectedCompletionDate: date } : r)))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setInternalSaving(true)
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
                turnaroundDays: expectedCompletionDate
                    ? Math.ceil((new Date(expectedCompletionDate).getTime() - Date.now()) / 86400000)
                    : undefined,
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create order')
        } finally {
            setInternalSaving(false)
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
        label: `Dr. ${p.doctor?.name || '—'}`,
        secondary: new Date(p.createdAt).toLocaleDateString(),
    }))

    const totalItemsPrice = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const totalRepairsPrice = repairs.reduce((s, r) => s + r.price, 0)
    const grandTotal = totalItemsPrice + totalRepairsPrice

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {forcedOrderType ? (
                <div className="rounded-lg bg-muted/30 p-3 border text-sm">
                    <span className="font-medium">{t(`orders.type_${forcedOrderType}`)}</span>
                    <span className="text-muted-foreground ml-2">— {t(`orders.type_${forcedOrderType}_desc`)}</span>
                </div>
            ) : (
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
            )}

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
                        <div>
                            <p className="text-sm text-muted-foreground italic mb-2">{t('prescriptions.noPrescriptions')}</p>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowNewRx(true)}>
                                <Plus className="h-3 w-3 mr-1" /> {t('prescriptions.newPrescription')}
                            </Button>
                            {showNewRx && (
                                <div className="mt-3 p-3 border rounded-lg space-y-3">
                                    <div className="grid grid-cols-5 gap-2">
                                        {(['sph', 'cyl', 'axis', 'add', 'pd'] as const).map((field) => (
                                            <div key={field} className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">{t(`prescriptions.${field}`)} R</Label>
                                                <Input type="number" step={field === 'axis' || field === 'pd' ? '1' : '0.25'}
                                                    min={field === 'axis' ? '0' : undefined} max={field === 'axis' ? '180' : undefined}
                                                    value={newRxRight[field] || ''}
                                                    onChange={(e) => setNewRxRight((prev) => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }))}
                                                    className="h-7 text-xs" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        {(['sph', 'cyl', 'axis', 'add', 'pd'] as const).map((field) => (
                                            <div key={field} className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">{t(`prescriptions.${field}`)} L</Label>
                                                <Input type="number" step={field === 'axis' || field === 'pd' ? '1' : '0.25'}
                                                    min={field === 'axis' ? '0' : undefined} max={field === 'axis' ? '180' : undefined}
                                                    value={newRxLeft[field] || ''}
                                                    onChange={(e) => setNewRxLeft((prev) => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }))}
                                                    className="h-7 text-xs" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" onClick={handleCreatePrescription} disabled={creatingRx}>
                                            {creatingRx ? t('common.saving') : t('common.save')}
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setShowNewRx(false)}>
                                            {t('common.cancel')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {(orderType === 'standard' || orderType === 'remounting') && (
                <div className="space-y-2">
                    <Label>{t('orders.expectedCompletion')}</Label>
                    <Input
                        type="date"
                        value={expectedCompletionDate}
                        onChange={(e) => setExpectedCompletionDate(e.target.value)}
                        className="h-9"
                    />
                </div>
            )}

            {(orderType === 'standard' || orderType === 'direct_sale') && (
                <div className="space-y-3">
                    <Label>{t('orders.items')}</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
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
                        </div>
                        <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setQrScanOpen(true)} title="Scan QR code">
                            <QrCode className="h-4 w-4" />
                        </Button>
                    </div>
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
                    <Label>{t('nav.repairs')}</Label>
                    {repairServices.length > 0 ? (
                        <div className="space-y-2">
                            {repairServices.map((service) => {
                                const checked = selectedServiceIds.includes(service.id)
                                const repairObj = repairs.find((r) => r.repairServiceId === service.id)
                                return (
                                    <div key={service.id} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg border">
                                        <Checkbox
                                            id={`service-${service.id}`}
                                            checked={checked}
                                            onCheckedChange={() => toggleRepairService(service)}
                                        />
                                        <label htmlFor={`service-${service.id}`} className="flex-1 flex items-center gap-2 text-sm cursor-pointer">
                                            <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <span className="font-medium">{service.name}</span>
                                            <span className="text-muted-foreground">({parseFloat(service.defaultPrice).toFixed(3)} TND)</span>
                                        </label>
                                        {checked && (
                                            <Input
                                                type="date"
                                                value={repairObj?.expectedCompletionDate || ''}
                                                onChange={(e) => updateServiceRepairDate(service.id, e.target.value)}
                                                className="w-36 h-7 text-xs"
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-muted-foreground italic mb-2">{t('repairs.noServicesConfigured')}</p>
                            <div className="space-y-1.5">
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
                                <Button type="button" variant="outline" size="sm" onClick={addRepair}>
                                    <Plus className="h-3 w-3 mr-1" /> {t('common.add')}
                                </Button>
                            </div>
                        </div>
                    )}
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
                <Button type="submit" disabled={saving || !selectedClientId} className="flex-1 h-10">
                    {saving ? t('common.saving') : t('common.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="h-10">
                    {t('common.cancel')}
                </Button>
            </div>

            <Dialog open={qrScanOpen} onOpenChange={(open) => { if (!open) { setQrScanOpen(false); setQrScanning(false) } }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Scan QR Code
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-3 py-2">
                        <div id="qr-reader" ref={qrReaderRef} className={qrScanning ? '' : 'hidden'} />
                        {!qrScanning && qrScanOpen && (
                            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spinner" />
                                <p className="text-sm">Starting camera...</p>
                            </div>
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={() => { setQrScanOpen(false); setQrScanning(false) }}>
                            <X className="h-4 w-4 mr-1" />
                            {t('common.cancel')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </form>
    )
}
