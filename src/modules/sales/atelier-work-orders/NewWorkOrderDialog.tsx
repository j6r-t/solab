'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { Loader2, Plus, Package, Eye, Upload, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import { fetchOpticianShops, type OpticianShopItem } from '@/modules/partners/optician-shops/optician-shops.api'
import { fetchRepairServices } from '@/modules/system/settings/settings.api'
import type { PaginatedResponse } from '@/lib/api/pagination'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface RepairService {
    id: string
    name: string
    defaultPrice: string
}

interface LensBlank {
    id: string
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sph: string
    cyl: string
    sellingPrice: string
    costPrice: string
    quantity: number
}

const LENS_TYPES = ['singleVision', 'progressive', 'bifocal', 'office', 'photochromic'] as const
const LENS_MATERIALS = ['cr39', 'polycarbonate', 'highIndex', 'trivex'] as const
const LENS_COATINGS = ['none', 'ar', 'scratchResistant', 'blueBlock', 'arScratch', 'arBlueBlock'] as const

interface NewWorkOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: () => void
}

export function NewWorkOrderDialog({ open, onOpenChange, onCreated }: NewWorkOrderDialogProps) {
    const { t } = useTranslation()
    const [shops, setShops] = useState<OpticianShopItem[]>([])
    const [repairServices, setRepairServices] = useState<RepairService[]>([])
    const [loading, setLoading] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [ocrLoading, setOcrLoading] = useState(false)
    const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Step 1: Shop
    const [selectedShopId, setSelectedShopId] = useState('')

    // Step 2: Services (multi-select)
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

    // Step 3: Expected date
    const [expectedDate, setExpectedDate] = useState('')

    // Step 4: Lens source
    const [lensSource, setLensSource] = useState<'stock' | 'optician'>('optician')

    // Prescription
    const [rx, setRx] = useState({
        sphRight: 0, cylRight: 0, axisRight: 0, addRight: 0, pdRight: 0,
        sphLeft: 0, cylLeft: 0, axisLeft: 0, addLeft: 0, pdLeft: 0,
    })
    const [thickness, setThickness] = useState('')
    const [lensType, setLensType] = useState('')
    const [material, setMaterial] = useState('')
    const [coating, setCoating] = useState('')
    const [prescriptionNotes, setPrescriptionNotes] = useState('')

    // Lens blanks (when from stock)
    const [lensBlanks, setLensBlanks] = useState<LensBlank[]>([])
    const [lensBlankLoading, setLensBlankLoading] = useState(false)
    const [lensBlankLeftId, setLensBlankLeftId] = useState('')
    const [lensBlankRightId, setLensBlankRightId] = useState('')

    useEffect(() => {
        if (!open) return
        Promise.all([
            fetchOpticianShops(),
            fetchRepairServices(),
        ])
            .then(([shopsData, servicesData]) => {
                setShops(shopsData || [])
                setRepairServices(servicesData || [])
            })
            .catch(() => {})
            .finally(() => setLoaded(true))
    }, [open])
    const fetching = open && !loaded

    // Auto-fetch matching lens blanks when prescription + preferences change (debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (lensSource !== 'stock') { setLensBlanks([]); return }

            const hasRx = rx.sphRight !== 0 || rx.cylRight !== 0 || rx.sphLeft !== 0 || rx.cylLeft !== 0
            if (!hasRx && !thickness && !lensType && !material && !coating) {
                setLensBlanks([])
                return
            }

            setLensBlankLoading(true)
            try {
                const params = new URLSearchParams()
                if (rx.sphRight) params.set('sphRight', String(rx.sphRight))
                if (rx.cylRight) params.set('cylRight', String(rx.cylRight))
                if (rx.sphLeft) params.set('sphLeft', String(rx.sphLeft))
                if (rx.cylLeft) params.set('cylLeft', String(rx.cylLeft))
                if (thickness) params.set('thickness', thickness)
                if (lensType) params.set('lensType', lensType)
                if (material) params.set('material', material)
                if (coating) params.set('coating', coating)
                const res = await fetch(`/api/lens-blanks?${params.toString()}`)
                if (res.ok) {
                    const json: PaginatedResponse<LensBlank> | LensBlank[] = await res.json()
                    setLensBlanks(Array.isArray(json) ? json : (json?.data ?? []))
                }
            } catch {
                setLensBlanks([])
            } finally {
                setLensBlankLoading(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [lensSource, rx.sphRight, rx.cylRight, rx.sphLeft, rx.cylLeft, thickness, lensType, material, coating])

    function triggerSearch() {
        const hasRx = rx.sphRight !== 0 || rx.cylRight !== 0 || rx.sphLeft !== 0 || rx.cylLeft !== 0
        if (!hasRx && !thickness && !lensType && !material && !coating) {
            toast.error(t('workOrders.fillRxField'))
            return
        }
        setLensBlankLoading(true)
        const params = new URLSearchParams()
        if (rx.sphRight) params.set('sphRight', String(rx.sphRight))
        if (rx.cylRight) params.set('cylRight', String(rx.cylRight))
        if (rx.sphLeft) params.set('sphLeft', String(rx.sphLeft))
        if (rx.cylLeft) params.set('cylLeft', String(rx.cylLeft))
        if (thickness) params.set('thickness', thickness)
        if (lensType) params.set('lensType', lensType)
        if (material) params.set('material', material)
        if (coating) params.set('coating', coating)
        fetch(`/api/lens-blanks?${params.toString()}`)
            .then((res): Promise<PaginatedResponse<LensBlank> | LensBlank[]> => res.ok ? res.json() : Promise.resolve([]))
            .then((json) => setLensBlanks(Array.isArray(json) ? json : (json?.data ?? [])))
            .catch(() => setLensBlanks([]))
            .finally(() => setLensBlankLoading(false))
    }

    function changeLensSource(source: 'stock' | 'optician') {
        setLensSource(source)
        setLensBlankLeftId('')
        setLensBlankRightId('')
        setLensBlanks([])
    }

    function toggleService(serviceId: string) {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
        )
    }

    async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setOcrLoading(true)
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(new Error(t('common.fileReadFailed')))
                reader.readAsDataURL(file)
            })

            setOcrPreviewUrl(base64)

            const commaIndex = base64.indexOf(',')
            const rawData = base64.slice(commaIndex + 1)
            const header = base64.slice(0, commaIndex)
            const detectedMime = header.replace('data:', '').replace(';base64', '')

            const res = await fetch('/api/ocr-prescription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: rawData, mimeType: detectedMime }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || t('common.ocrError'))
            }

            const data = await res.json()

            setRx((prev) => ({
                ...prev,
                sphRight: data.od_sph ?? prev.sphRight,
                cylRight: data.od_cyl ?? prev.cylRight,
                axisRight: data.od_axis ?? prev.axisRight,
                sphLeft: data.os_sph ?? prev.sphLeft,
                cylLeft: data.os_cyl ?? prev.cylLeft,
                axisLeft: data.os_axis ?? prev.axisLeft,
                addRight: data.add ?? prev.addRight,
                addLeft: data.add ?? prev.addLeft,
                pdRight: data.pd ?? prev.pdRight,
                pdLeft: data.pd ?? prev.pdLeft,
            }))

            toast.success(t('common.ocrSuccess'))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('common.ocrError'))
        } finally {
            setOcrLoading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const selectedServices = repairServices.filter((s) => selectedServiceIds.includes(s.id))
    const totalServicePrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.defaultPrice), 0)

    const leftBlank = lensBlanks.find((b) => b.id === lensBlankLeftId)
    const rightBlank = lensBlanks.find((b) => b.id === lensBlankRightId)
    const totalLensBlankPrice = (leftBlank ? parseFloat(leftBlank.sellingPrice) : 0) + (rightBlank ? parseFloat(rightBlank.sellingPrice) : 0)
    const grandTotal = totalServicePrice + (lensSource === 'stock' ? totalLensBlankPrice : 0)

    const blankOptions: SearchSelectOption[] = lensBlanks
        .filter((lb) => lb.quantity > 0)
        .map((lb) => ({
            value: lb.id,
            label: `${lb.brand} ${lb.lensType} ${lb.thickness}`,
            secondary: `SPH ${lb.sph} · CYL ${lb.cyl} · ${Number(lb.sellingPrice).toFixed(3)} TND · ${t('common.inStockSuffix', { n: lb.quantity })}`,
        }))

    async function handleSubmit() {
        if (!selectedShopId) { toast.error(t('workOrders.selectShopRequired')); return }
        if (selectedServiceIds.length === 0) { toast.error(t('workOrders.selectServiceRequired')); return }
        if (!expectedDate) { toast.error(t('workOrders.expectedDateRequired')); return }

        setLoading(true)
        try {
            const res = await fetch('/api/repairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    opticianShopId: selectedShopId,
                    serviceIds: selectedServiceIds,
                    expectedCompletionDate: expectedDate,
                    lensSource,
                    sphRight: rx.sphRight,
                    cylRight: rx.cylRight,
                    axisRight: rx.axisRight,
                    addRight: rx.addRight,
                    pdRight: rx.pdRight,
                    sphLeft: rx.sphLeft,
                    cylLeft: rx.cylLeft,
                    axisLeft: rx.axisLeft,
                    addLeft: rx.addLeft,
                    pdLeft: rx.pdLeft,
                    thickness: thickness || undefined,
                    lensType: lensType || undefined,
                    material: material || undefined,
                    coating: coating || undefined,
                    prescriptionNotes: prescriptionNotes || undefined,
                    lensBlankLeftId: lensSource === 'stock' && lensBlankLeftId ? lensBlankLeftId : undefined,
                    lensBlankRightId: lensSource === 'stock' && lensBlankRightId ? lensBlankRightId : undefined,
                    lensBlankPrice: lensSource === 'stock' ? totalLensBlankPrice : undefined,
                }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || t('workOrders.createFailed'))
            }
            toast.success(t('workOrders.created'))
            onCreated()
            onOpenChange(false)
            resetForm()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('workOrders.createFailed'))
        } finally {
            setLoading(false)
        }
    }

    function resetForm() {
        setSelectedShopId('')
        setSelectedServiceIds([])
        setExpectedDate('')
        setLensSource('optician')
        setLensBlankLeftId('')
        setLensBlankRightId('')
        setLensBlanks([])
        setRx({ sphRight: 0, cylRight: 0, axisRight: 0, addRight: 0, pdRight: 0, sphLeft: 0, cylLeft: 0, axisLeft: 0, addLeft: 0, pdLeft: 0 })
        setThickness('')
        setLensType('')
        setMaterial('')
        setCoating('')
        setPrescriptionNotes('')
        setLensBlankLeftId('')
        setLensBlankRightId('')
        setLensBlanks([])
        setOcrLoading(false)
        setOcrPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const today = new Date().toISOString().split('T')[0]

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {t('workOrders.new')}
                    </DialogTitle>
                </DialogHeader>

                {fetching ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Step 1: Shop */}
                        <div className="space-y-2">
                            <Label>{t('workOrders.opticianShop')}</Label>
                            <SearchSelect
                                options={shops.map((s) => ({ value: s.id, label: s.name, secondary: s.phone }))}
                                value={selectedShopId}
                                onChange={setSelectedShopId}
                                placeholder={t('workOrders.selectShopPlaceholder')}
                                searchPlaceholder={t('workOrders.searchShopsPlaceholder')}
                                emptyMessage={t('workOrders.noShopsFound')}
                                title={t('workOrders.opticianShopLabel')}
                            />
                        </div>

                        {/* Step 2: Services (multi-select) */}
                        <div className="space-y-2">
                            <Label>{t('workOrders.servicesLabel')}</Label>
                            <div className="space-y-1.5">
                                {repairServices.map((service) => {
                                    const checked = selectedServiceIds.includes(service.id)
                                    return (
                                        <div key={service.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${checked ? 'bg-primary/5 border-primary/30' : 'bg-muted/20'}`}
                                            onClick={() => toggleService(service.id)}>
                                            <Checkbox checked={checked} onCheckedChange={() => toggleService(service.id)} />
                                            <span className="flex-1 text-sm font-medium">{service.name}</span>
                                            <span className="text-sm text-muted-foreground">{parseFloat(service.defaultPrice).toFixed(3)} TND</span>
                                        </div>
                                    )
                                })}
                            </div>
                            {selectedServiceIds.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                    {t('workOrders.totalServices')} <strong>{totalServicePrice.toFixed(3)} TND</strong>
                                </div>
                            )}
                        </div>

                        {/* Step 3: Expected date */}
                        <div className="space-y-2">
                            <Label>{t('workOrders.expectedDate')} *</Label>
                            <Input type="date" min={today} value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="h-9" />
                        </div>

                        {/* Step 4: Lens source */}
                        <div className="space-y-2">
                            <Label>{t('workOrders.lensSourceLabel')}</Label>
                            <div className="flex gap-3">
                                <Button type="button" variant={lensSource === 'stock' ? 'default' : 'outline'} size="sm"
                                    onClick={() => changeLensSource('stock')} className="flex-1">
                                    <Package className="h-4 w-4 mr-2" />
                                    {t('workOrders.ourStock')}
                                </Button>
                                <Button type="button" variant={lensSource === 'optician' ? 'default' : 'outline'} size="sm"
                                    onClick={() => changeLensSource('optician')} className="flex-1">
                                    {t('workOrders.opticianSource')}
                                </Button>
                            </div>
                        </div>

                        {/* Prescription (always shown) */}
                        <div className="p-3 bg-muted/20 rounded-lg border space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    {t('workOrders.prescription')}
                                </Label>
                                <div>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleOcrUpload} />
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={ocrLoading}>
                                        {ocrLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                                        {t('workOrders.importPhoto')}
                                    </Button>
                                </div>
                            </div>
                            {ocrPreviewUrl && (
                                <div className="relative rounded-md overflow-hidden border">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- local object/data URL preview */}
                            <img src={ocrPreviewUrl} alt={t('workOrders.importedRxAlt')} className="w-full max-h-48 object-contain bg-white" />
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6"
                                        onClick={() => { setOcrPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">{t('prescriptions.rightEye')}</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {(['sphRight', 'cylRight', 'axisRight', 'addRight', 'pdRight'] as const).map((field) => {
                                            const base = field.replace('Right', '')
                                            return (
                                                <div key={field} className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">{base.toUpperCase()}</Label>
                                                    <Input type="number" step={base === 'axis' || base === 'pd' ? '1' : '0.25'}
                                                        value={rx[field] || ''} onChange={(e) => { const v = parseFloat(e.target.value); setRx((prev) => ({ ...prev, [field]: isNaN(v) ? 0 : v })) }}
                                                        className="h-9 text-sm" />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">{t('prescriptions.leftEye')}</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {(['sphLeft', 'cylLeft', 'axisLeft', 'addLeft', 'pdLeft'] as const).map((field) => {
                                            const base = field.replace('Left', '')
                                            return (
                                                <div key={field} className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">{base.toUpperCase()}</Label>
                                                    <Input type="number" step={base === 'axis' || base === 'pd' ? '1' : '0.25'}
                                                        value={rx[field] || ''} onChange={(e) => { const v = parseFloat(e.target.value); setRx((prev) => ({ ...prev, [field]: isNaN(v) ? 0 : v })) }}
                                                        className="h-9 text-sm" />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('stock.thickness')}</Label>
                                    <Select value={thickness} onValueChange={setThickness}>
                                        <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">—</SelectItem>
                                            {['1.5', '1.56', '1.6', '1.67', '1.74'].map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('orders.type')}</Label>
                                    <Select value={lensType} onValueChange={setLensType}>
                                        <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">—</SelectItem>
                                            {LENS_TYPES.map((lt) => (
                                                <SelectItem key={lt} value={lt}>{lt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('stock.material')}</Label>
                                    <Select value={material} onValueChange={setMaterial}>
                                        <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">—</SelectItem>
                                            {LENS_MATERIALS.map((m) => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('stock.coating')}</Label>
                                    <Select value={coating} onValueChange={setCoating}>
                                        <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">—</SelectItem>
                                            {LENS_COATINGS.map((c) => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('clients.notes')}</Label>
                                <Input value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} placeholder={t('workOrders.notesPlaceholder')} className="h-9 text-sm" />
                            </div>
                        </div>

                        {/* Lens blanks (only when from stock) */}
                        {lensSource === 'stock' && (
                            <div className="p-3 bg-muted/20 rounded-lg border space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">{t('workOrders.stockLenses')}</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={triggerSearch} disabled={lensBlankLoading}>
                                        {lensBlankLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
                                        {t('common.search')}
                                    </Button>
                                </div>
                                {lensBlankLoading ? (
                                    <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('workOrders.searchingBlanks')}
                                    </div>
                                ) : blankOptions.length === 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-amber-600 font-medium">{t('common.blanksNotInStock')}</p>
                                        <p className="text-xs text-muted-foreground">{t('common.opticianWillProvide')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">{t('prescriptions.leftEye')}</Label>
                                            <SearchSelect
                                                options={[{ value: '', label: t('stock.none') }, ...blankOptions]}
                                                value={lensBlankLeftId}
                                                onChange={setLensBlankLeftId}
                                                placeholder={t('stock.none')}
                                                title={t('workOrders.leftEyeBlank')}
                                                searchPlaceholder={t('common.search')}
                                            />
                                            {lensBlankLeftId ? (
                                                <p className="text-xs text-green-600">{t('common.inStock')}</p>
                                            ) : (
                                                <p className="text-xs text-amber-600">{t('common.notAssigned')}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">{t('prescriptions.rightEye')}</Label>
                                            <SearchSelect
                                                options={[{ value: '', label: t('stock.none') }, ...blankOptions]}
                                                value={lensBlankRightId}
                                                onChange={setLensBlankRightId}
                                                placeholder={t('stock.none')}
                                                title={t('workOrders.rightEyeBlank')}
                                                searchPlaceholder={t('common.search')}
                                            />
                                            {lensBlankRightId ? (
                                                <p className="text-xs text-green-600">{t('common.inStock')}</p>
                                            ) : (
                                                <p className="text-xs text-amber-600">{t('common.notAssigned')}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {blankOptions.length > 0 && totalLensBlankPrice > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        {t('workOrders.totalLenses')} <strong>{totalLensBlankPrice.toFixed(3)} TND</strong>
                                    </div>
                                )}
                                {!lensBlankLoading && blankOptions.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">{t('workOrders.missingBlanksProvidedByOptician')}</p>
                                )}
                            </div>
                        )}

                        {/* Summary */}
                        <div className="rounded-lg bg-muted/30 border divide-y divide-border">
                            {selectedServices.length > 0 && (
                                <div className="flex justify-between px-3 py-2 text-sm">
                                    <span>{t('workOrders.servicesCount', { count: selectedServices.length })}</span>
                                    <span className="font-medium">{totalServicePrice.toFixed(3)} TND</span>
                                </div>
                            )}
                            {lensSource === 'stock' && totalLensBlankPrice > 0 && (
                                <div className="flex justify-between px-3 py-2 text-sm">
                                    <span>{t('workOrders.lensesCount', { count: 2 })}</span>
                                    <span className="font-medium">{totalLensBlankPrice.toFixed(3)} TND</span>
                                </div>
                            )}
                            <div className="flex justify-between px-3 py-2.5 text-sm font-semibold">
                                <span>{t('orders.total')}</span>
                                <span>{grandTotal.toFixed(3)} TND</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleSubmit} disabled={loading || !selectedShopId || selectedServiceIds.length === 0 || !expectedDate} className="flex-1">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {t('workOrders.create')}
                            </Button>
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
