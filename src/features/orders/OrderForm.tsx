'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
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
import { Trash2, Plus, Package, Wrench, QrCode, Camera, Loader2, X, Eye, Check } from 'lucide-react'
import { toast } from 'sonner'
import { fetchClients } from '@/features/clients/client.api'
import { fetchStockProducts } from '@/features/stock/stock.api'
import { fetchRepairServices } from '@/features/settings/settings.api'
import { fetchPrescriptions, createPrescription } from '@/features/prescriptions/prescriptions.api'
import { lookupQRCode } from '@/features/qrcode/qrcode.api'
import { useAuthStore } from '@/stores/auth-store'
import { Html5Qrcode } from 'html5-qrcode'

export interface OrderItemInput {
    productId: string
    quantity: number
    unitPrice: number
    name?: string
}

export interface OrderPaymentInput {
    amount: number
    type: 'full' | 'deposit' | 'balance'
    method?: 'cash' | 'cheque' | 'traite' | 'card' | 'transfer'
    chequeId?: string
    dueDate?: string
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
    price: string | number
    quantity?: number
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
    const user = useAuthStore((s) => s.user)
    const today = new Date().toISOString().split('T')[0]
    const [clients, setClients] = useState<Client[]>([])
    const [clientSearch, setClientSearch] = useState('')
    const [products, setProducts] = useState<Product[]>([])
    const [productSearch, setProductSearch] = useState('')
    const [orderType, setOrderType] = useState<'standard' | 'remounting' | 'direct_sale'>(forcedOrderType || defaultValues?.orderType || 'standard')
    const [selectedClientId, setSelectedClientId] = useState(defaultValues?.clientId || '')
    const [items, setItems] = useState<OrderItemInput[]>(defaultValues?.items || [])
    const [repairs, setRepairs] = useState<OrderRepairInput[]>(defaultValues?.repairs || [])
    const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque' | 'traite' | 'card' | 'transfer'>('cash')
    const [chequeNumber, setChequeNumber] = useState('')
    const [chequeBank, setChequeBank] = useState('')
    const [chequeDueDate, setChequeDueDate] = useState('')
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
    const [qrError, setQrError] = useState('')
    const qrReaderId = 'qr-reader-scanner'
    const html5QrRef = useRef<unknown>(null)
    const mountedRef = useRef(false)
    const [lensBlanks, setLensBlanks] = useState<any[]>([])
    const [lensBlankLoading, setLensBlankLoading] = useState(false)
    const [lbFilterThickness, setLbFilterThickness] = useState('')
    const [lbFilterLensType, setLbFilterLensType] = useState('')
    const [lbFilterMaterial, setLbFilterMaterial] = useState('')
    const [lbFilterCoating, setLbFilterCoating] = useState('')

    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    async function handleQrScan(result: string) {
        setQrScanning(false)
        try {
            const data = await lookupQRCode(result)
            if (!data.product) { toast.error('Product not found'); return }
            addItem(data.product)
            toast.success(`${data.product.name} added`)
            setQrScanOpen(false)
        } catch {
            toast.error('Failed to look up QR code')
        }
    }

    useEffect(() => {
        if (!qrScanOpen) return
        setQrScanning(false)
        setQrError('')
        let cancelled = false
        let reader: Html5Qrcode | null = null

        async function start() {
            try {
                reader = new Html5Qrcode(qrReaderId)
                html5QrRef.current = reader
                if (cancelled || !mountedRef.current) { reader.stop().catch(() => {}); return }
                setQrScanning(true)
                await reader.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText: string) => {
                        if (!cancelled && mountedRef.current) {
                            cancelled = true
                            if (reader) { reader.stop().catch(() => {}) }
                            handleQrScan(decodedText)
                        }
                    },
                    () => {},
                )
            } catch (err) {
                if (!cancelled && mountedRef.current) {
                    setQrError(err instanceof Error ? err.message : 'Camera access denied or not available')
                    setQrScanning(false)
                }
            }
        }

        const timer = setTimeout(start, 300)

        return () => {
            clearTimeout(timer)
            setQrScanning(false)
            if (reader && !cancelled) { reader.stop().catch(() => {}) }
            html5QrRef.current = null
        }
    }, [qrScanOpen])

    useEffect(() => {
        fetchClients({ search: clientSearch || undefined })
            .then((data) => setClients(data || []))
            .catch(() => {})
    }, [clientSearch])

    useEffect(() => {
        fetchStockProducts({ search: productSearch || undefined })
            .then((data) => setProducts(data || []))
            .catch(() => {})
    }, [productSearch])

    useEffect(() => {
        if (selectedClientId) {
            setSelectedPrescriptionId('')
            fetchPrescriptions({ clientId: selectedClientId })
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
        fetchRepairServices()
            .then((data) => setRepairServices(data || []))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (forcedOrderType) setOrderType(forcedOrderType)
    }, [forcedOrderType])

    useEffect(() => {
        if (!selectedPrescriptionId || !prescriptions.length) {
            setLensBlanks([])
            return
        }
        const rx = prescriptions.find((p) => p.id === selectedPrescriptionId)
        if (!rx) { setLensBlanks([]); return }

        setLensBlankLoading(true)
        const params: Record<string, string> = {}
        if (rx.sphRight && rx.sphRight !== '0') params.sphRight = rx.sphRight
        if (rx.cylRight && rx.cylRight !== '0') params.cylRight = rx.cylRight
        if (rx.sphLeft && rx.sphLeft !== '0') params.sphLeft = rx.sphLeft
        if (rx.cylLeft && rx.cylLeft !== '0') params.cylLeft = rx.cylLeft
        if (lbFilterThickness) params.thickness = lbFilterThickness
        if (lbFilterLensType) params.lensType = lbFilterLensType
        if (lbFilterMaterial) params.material = lbFilterMaterial
        if (lbFilterCoating) params.coating = lbFilterCoating

        const qs = new URLSearchParams(params).toString()
        fetch(`/api/lens-blanks?${qs}`)
            .then((r) => r.json())
            .then((data) => { if (mountedRef.current) setLensBlanks(data || []) })
            .catch(() => { if (mountedRef.current) setLensBlanks([]) })
            .finally(() => { if (mountedRef.current) setLensBlankLoading(false) })
    }, [selectedPrescriptionId, prescriptions, lbFilterThickness, lbFilterLensType, lbFilterMaterial, lbFilterCoating])

    function addItem(product: Product) {
        setItems((prev) => [...prev, { productId: product.id, quantity: 1, unitPrice: Number(product.price) || 0 }])
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
            const created = await createPrescription({
                clientId: selectedClientId,
                sphRight: newRxRight.sph, cylRight: newRxRight.cyl, axisRight: newRxRight.axis, addRight: newRxRight.add, pdRight: newRxRight.pd,
                sphLeft: newRxLeft.sph, cylLeft: newRxLeft.cyl, axisLeft: newRxLeft.axis, addLeft: newRxLeft.add, pdLeft: newRxLeft.pd,
            })
            const refreshed = await fetchPrescriptions({ clientId: selectedClientId })
            setPrescriptions(refreshed || [])
            setSelectedPrescriptionId(created.id)
            setShowNewRx(false)
            setNewRxRight({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
            setNewRxLeft({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
        } finally {
            setCreatingRx(false)
        }
    }

    function updateServiceRepairDate(serviceId: string, date: string) {
        setRepairs((prev) => prev.map((r) => (r.repairServiceId === serviceId ? { ...r, expectedCompletionDate: date } : r)))
    }

    function addLensBlankAsItem(blank: any) {
        const isShop = user?.role === 'shop'
        const price = isShop ? Number(blank.costPrice) || 0 : Number(blank.sellingPrice) || 0
        const displayName = `${blank.brand} ${blank.lensType} ${blank.material} ${blank.thickness}`
        const existingIndex = items.findIndex((item) => item.productId === blank.id)
        if (existingIndex >= 0) {
            updateItem(existingIndex, 'quantity', items[existingIndex].quantity + 1)
        } else {
            setItems((prev) => [...prev, { productId: blank.id, quantity: 1, unitPrice: price, name: displayName }])
        }
        toast.success(`${blank.brand} added to order`)
    }

    const selectedRx = prescriptions.find((p) => p.id === selectedPrescriptionId)
    const showLensBlankPicker = (orderType === 'standard' || orderType === 'remounting') && selectedPrescriptionId && selectedRx

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setInternalSaving(true)
        try {
            const payments: OrderPaymentInput[] = []
            const basePayment = {
                method: paymentMethod,
                ...(paymentMethod === 'cheque' ? { dueDate: chequeDueDate || undefined } : {}),
            }
            if (orderType === 'direct_sale') {
                payments.push({ amount: 0, type: 'full', ...basePayment })
            } else if (paymentType === 'full') {
                payments.push({ amount: 0, type: 'full', ...basePayment })
            } else {
                payments.push({ amount: parseFloat(depositAmount) || 0, type: 'deposit', ...basePayment })
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
        .filter((p) => (p.quantity ?? 0) > 0)
        .map((p) => ({
            value: p.id,
            label: `${p.name} (${p.brand})`,
            secondary: `${Number(p.price).toFixed(3)} TND · ${p.quantity ?? 0} in stock`,
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
                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2">
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

            {showLensBlankPicker && (
                <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        {t('orders.lensBlanks')}
                    </Label>
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('stock.thickness')}</Label>
                                <select value={lbFilterThickness} onChange={(e) => setLbFilterThickness(e.target.value)} className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                                    <option value="">{t('common.all')}</option>
                                    {[...new Set(lensBlanks.map((b: any) => b.thickness).filter(Boolean))].map((th) => (
                                        <option key={th} value={th}>{th}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('stock.lensType')}</Label>
                                <select value={lbFilterLensType} onChange={(e) => setLbFilterLensType(e.target.value)} className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                                    <option value="">{t('common.all')}</option>
                                    {[...new Set(lensBlanks.map((b: any) => b.lensType).filter(Boolean))].map((lt) => (
                                        <option key={lt} value={lt}>{t(`stock.${lt}`)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('stock.material')}</Label>
                                <select value={lbFilterMaterial} onChange={(e) => setLbFilterMaterial(e.target.value)} className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                                    <option value="">{t('common.all')}</option>
                                    {[...new Set(lensBlanks.map((b: any) => b.material).filter(Boolean))].map((m) => (
                                        <option key={m} value={m}>{t(`stock.${m}`)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('stock.coating')}</Label>
                                <select value={lbFilterCoating} onChange={(e) => setLbFilterCoating(e.target.value)} className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                                    <option value="">{t('common.all')}</option>
                                    {[...new Set(lensBlanks.map((b: any) => b.coating).filter(Boolean))].map((c) => (
                                        <option key={c} value={c}>{t(`stock.${c}`)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-3">
                            <span>{t('prescriptions.sph')} R: {selectedRx.sphRight}</span>
                            <span>{t('prescriptions.cyl')} R: {selectedRx.cylRight}</span>
                            <span>{t('prescriptions.sph')} L: {selectedRx.sphLeft}</span>
                            <span>{t('prescriptions.cyl')} L: {selectedRx.cylLeft}</span>
                        </div>
                        {lensBlankLoading ? (
                            <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('common.loading')}
                            </div>
                        ) : lensBlanks.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-2">{t('orders.noMatchingLensBlanks')}</p>
                        ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {lensBlanks.map((blank: any) => {
                                    const inStock = (blank.quantity ?? 0) > 0
                                    return (
                                        <div key={blank.id} className={`flex items-center gap-2 p-2.5 rounded-lg border ${inStock ? 'bg-background' : 'bg-muted/30 opacity-60'}`}>
                                            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium truncate">{blank.brand}</span>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t(`stock.${blank.lensType}`)}</Badge>
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t(`stock.${blank.material}`)}</Badge>
                                                    {blank.coating !== 'none' && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t(`stock.${blank.coating}`)}</Badge>}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {blank.thickness} · SPH {blank.sphMin}→{blank.sphMax} · CYL {blank.cylMin}→{blank.cylMax} · {Number(blank.sellingPrice).toFixed(3)} TND · {blank.quantity ?? 0} in stock
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => addLensBlankAsItem(blank)} disabled={!inStock} className="h-7 px-2 shrink-0">
                                                <Check className="h-3 w-3 mr-1" /> {t('common.add')}
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(orderType === 'standard' || orderType === 'remounting') && (
                <div className="space-y-2">
                    <Label>{t('orders.expectedCompletion')}</Label>
                    <Input
                        type="date"
                        min={today}
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
                                const displayName = item.name || product?.name || item.productId
                                return (
                                    <div key={i} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border">
                                        <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="flex-1 text-sm font-medium truncate">{displayName}</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-14 h-7 text-xs"
                                        />
                                        {item.name && user?.role === 'shop' ? (
                                            <span className="w-22 text-xs text-right text-muted-foreground">{item.unitPrice.toFixed(3)}</span>
                                        ) : (
                                            <Input
                                                type="number"
                                                step="0.001"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="w-22 h-7 text-xs"
                                            />
                                        )}
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
                                                min={today}
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
                                            min={today}
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
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant={paymentType === 'full' ? 'default' : 'outline'} size="sm" onClick={() => setPaymentType('full')} className="flex-1 sm:flex-none">
                            {t('orders.full')}
                        </Button>
                        <Button type="button" variant={paymentType === 'deposit' ? 'default' : 'outline'} size="sm" onClick={() => setPaymentType('deposit')} className="flex-1 sm:flex-none">
                            {t('orders.deposit')}
                        </Button>
                    </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                    {(['cash', 'cheque', 'traite', 'card', 'transfer'] as const).map((m) => (
                        <Button
                            key={m}
                            type="button"
                            variant={paymentMethod === m ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod(m)}
                            className="flex-1 sm:flex-none text-xs"
                        >
                            {m === 'cash' ? 'Cash' : m === 'cheque' ? 'Chèque' : m === 'traite' ? 'Traite' : m === 'card' ? 'Carte' : 'Virement'}
                        </Button>
                    ))}
                </div>
                {paymentMethod === 'cheque' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                        <Input
                            type="text"
                            value={chequeNumber}
                            onChange={(e) => setChequeNumber(e.target.value)}
                            placeholder="Chèque N°"
                            className="h-9"
                        />
                        <Input
                            type="text"
                            value={chequeBank}
                            onChange={(e) => setChequeBank(e.target.value)}
                            placeholder="Banque"
                            className="h-9"
                        />
                        <Input
                            type="date"
                            value={chequeDueDate}
                            onChange={(e) => setChequeDueDate(e.target.value)}
                            className="h-9"
                        />
                    </div>
                )}
                {paymentMethod === 'traite' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <Input
                            type="text"
                            value={chequeNumber}
                            onChange={(e) => setChequeNumber(e.target.value)}
                            placeholder="Traite N°"
                            className="h-9"
                        />
                        <Input
                            type="date"
                            value={chequeDueDate}
                            onChange={(e) => setChequeDueDate(e.target.value)}
                            className="h-9"
                        />
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

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button type="submit" disabled={saving || !selectedClientId} className="w-full sm:flex-1 h-10">
                    {saving ? t('common.saving') : t('common.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto h-10">
                    {t('common.cancel')}
                </Button>
            </div>

            <Dialog open={qrScanOpen} onOpenChange={(open) => { if (!open) { setQrScanOpen(false); setQrScanning(false); setQrError('') } }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Scan QR Code
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-3 py-2">
                        <div id={qrReaderId} className="w-full" />
                        {qrError && (
                            <p className="text-sm text-destructive text-center">{qrError}</p>
                        )}
                        {!qrScanning && !qrError && (
                            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spinner" />
                                <p className="text-sm">Starting camera...</p>
                            </div>
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={() => { setQrScanOpen(false); setQrScanning(false); setQrError('') }}>
                            <X className="h-4 w-4 mr-1" />
                            {t('common.cancel')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </form>
    )
}
