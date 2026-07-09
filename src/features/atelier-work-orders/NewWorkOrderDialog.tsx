'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { fetchOpticianShops, type OpticianShopItem } from '@/features/optician-shops/optician-shops.api'
import { fetchRepairServices } from '@/features/settings/settings.api'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'

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
    sphMin: string
    sphMax: string
    cylMin: string
    cylMax: string
    sellingPrice: string
    costPrice: string
    quantity: number
}

interface NewWorkOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: () => void
}

export function NewWorkOrderDialog({ open, onOpenChange, onCreated }: NewWorkOrderDialogProps) {
    const [shops, setShops] = useState<OpticianShopItem[]>([])
    const [repairServices, setRepairServices] = useState<RepairService[]>([])
    const [lensBlanks, setLensBlanks] = useState<LensBlank[]>([])
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)

    const [selectedShopId, setSelectedShopId] = useState('')
    const [workType, setWorkType] = useState('repair')
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [servicePrice, setServicePrice] = useState('')
    const [expectedDate, setExpectedDate] = useState('')
    const [lensBlankLeftId, setLensBlankLeftId] = useState('')
    const [lensBlankRightId, setLensBlankRightId] = useState('')
    const [lensBlankPrice, setLensBlankPrice] = useState('')
    const [frameFrom, setFrameFrom] = useState('optician')

    useEffect(() => {
        if (!open) return
        setFetching(true)
        Promise.all([
            fetchOpticianShops(),
            fetchRepairServices(),
            fetch('/api/lens-blanks?lowStock=false').then((r) => r.ok ? r.json() : []),
        ])
            .then(([shopsData, servicesData, blanksData]) => {
                setShops(shopsData || [])
                setRepairServices(servicesData || [])
                setLensBlanks(blanksData || [])
            })
            .catch(() => {})
            .finally(() => setFetching(false))
    }, [open])

    useEffect(() => {
        if (selectedServiceId) {
            const svc = repairServices.find((s) => s.id === selectedServiceId)
            if (svc) setServicePrice(parseFloat(svc.defaultPrice).toFixed(3))
        }
    }, [selectedServiceId, repairServices])

    useEffect(() => {
        const left = lensBlanks.find((lb) => lb.id === lensBlankLeftId)
        const right = lensBlanks.find((lb) => lb.id === lensBlankRightId)
        const total = (left ? parseFloat(left.sellingPrice) : 0) + (right ? parseFloat(right.sellingPrice) : 0)
        if (total > 0) setLensBlankPrice(total.toFixed(3))
    }, [lensBlankLeftId, lensBlankRightId, lensBlanks])

    async function handleSubmit() {
        if (!selectedShopId) { toast.error('Please select an optician shop'); return }
        if (!expectedDate) { toast.error('Please set expected completion date'); return }

        setLoading(true)
        try {
            const res = await fetch('/api/repairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    opticianShopId: selectedShopId,
                    type: workType,
                    servicePrice: parseFloat(servicePrice) || 0,
                    expectedCompletionDate: expectedDate,
                    repairServiceId: selectedServiceId || undefined,
                    lensBlankLeftId: lensBlankLeftId || undefined,
                    lensBlankRightId: lensBlankRightId || undefined,
                    lensBlankPrice: parseFloat(lensBlankPrice) || undefined,
                    frameFrom,
                }),
            })
            if (!res.ok) throw new Error('Failed to create work order')
            toast.success('Work order created')
            onCreated()
            onOpenChange(false)
            resetForm()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create')
        } finally {
            setLoading(false)
        }
    }

    function resetForm() {
        setSelectedShopId('')
        setWorkType('repair')
        setSelectedServiceId('')
        setServicePrice('')
        setExpectedDate('')
        setLensBlankLeftId('')
        setLensBlankRightId('')
        setLensBlankPrice('')
        setFrameFrom('optician')
    }

    const today = new Date().toISOString().split('T')[0]

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        New Work Order
                    </DialogTitle>
                </DialogHeader>

                {fetching ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Optician Shop *</Label>
                            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select shop..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {shops.map((shop) => (
                                        <SelectItem key={shop.id} value={shop.id}>
                                            {shop.name} ({shop.phone})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={workType} onValueChange={setWorkType}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="repair">Repair</SelectItem>
                                        <SelectItem value="mounting">Mounting</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Expected Date *</Label>
                                <Input type="date" min={today} value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="h-9" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Repair Service</Label>
                            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {repairServices.map((svc) => (
                                        <SelectItem key={svc.id} value={svc.id}>
                                            {svc.name} ({parseFloat(svc.defaultPrice).toFixed(3)} TND)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Service Price (TND)</Label>
                            <Input type="number" step="0.001" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} className="h-9" />
                        </div>

                        <div className="p-3 bg-muted/20 rounded-lg border space-y-3">
                            <Label className="text-sm font-medium">Lens Blanks (Atelier Stock)</Label>
                            {(() => {
                                const blankOptions: SearchSelectOption[] = lensBlanks
                                    .filter((lb) => lb.quantity > 0)
                                    .map((lb) => ({
                                        value: lb.id,
                                        label: `${lb.brand} ${lb.lensType} ${lb.thickness} (${lb.quantity})`,
                                        secondary: `SPH ${lb.sphMin}, ${lb.sphMax}  CYL ${lb.cylMin}, ${lb.cylMax}`,
                                    }))
                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Left Eye</Label>
                                            <SearchSelect
                                                options={[{ value: '', label: 'None' }, ...blankOptions]}
                                                value={lensBlankLeftId}
                                                onChange={setLensBlankLeftId}
                                                placeholder="None"
                                                title="Left Eye Lens Blank"
                                                searchPlaceholder="Search by brand, type..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Right Eye</Label>
                                            <SearchSelect
                                                options={[{ value: '', label: 'None' }, ...blankOptions]}
                                                value={lensBlankRightId}
                                                onChange={setLensBlankRightId}
                                                placeholder="None"
                                                title="Right Eye Lens Blank"
                                                searchPlaceholder="Search by brand, type..."
                                            />
                                        </div>
                                    </div>
                                )
                            })()}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Frame / Blank Source</Label>
                                    <Select value={frameFrom} onValueChange={setFrameFrom}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="shop">Atelier Shop</SelectItem>
                                            <SelectItem value="optician">Optician Shop</SelectItem>
                                            <SelectItem value="external">External Service</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Blank Price (TND)</Label>
                                    <Input type="number" step="0.001" value={lensBlankPrice} onChange={(e) => setLensBlankPrice(e.target.value)} className="h-9" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleSubmit} disabled={loading || !selectedShopId || !expectedDate} className="flex-1">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create Work Order
                            </Button>
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
