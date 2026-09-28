'use client'

import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/lib/hooks/useDebounce'
import type { PaginatedResponse } from '@/lib/api/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Check, Eye, Loader2, Package } from 'lucide-react'
import { prescriptionLabel, type LensBlankOption, type PrescriptionOption } from './order-form.types'

interface LensBlankPickerProps {
    prescriptions: PrescriptionOption[]
    selectedPrescriptionId: string
    onAddBlank: (blank: LensBlankOption) => void
    t: (key: string) => string
}

export function LensBlankPicker({ prescriptions, selectedPrescriptionId, onAddBlank, t }: LensBlankPickerProps) {
    const [lbFilterThickness, setLbFilterThickness] = useState('')
    const [lbFilterLensType, setLbFilterLensType] = useState('')
    const [lbFilterMaterial, setLbFilterMaterial] = useState('')
    const [lbFilterCoating, setLbFilterCoating] = useState('')

    const debouncedId = useDebounce(selectedPrescriptionId, 300)
    const debouncedThickness = useDebounce(lbFilterThickness, 300)
    const debouncedLensType = useDebounce(lbFilterLensType, 300)
    const debouncedMaterial = useDebounce(lbFilterMaterial, 300)
    const debouncedCoating = useDebounce(lbFilterCoating, 300)

    const selectedRx = prescriptions.find((p) => p.id === selectedPrescriptionId)
    const debouncedRx = prescriptions.find((p) => p.id === debouncedId)

    const params: Record<string, string> = {}
    if (debouncedRx) {
        if (debouncedRx.sphRight && debouncedRx.sphRight !== '0') params.sphRight = debouncedRx.sphRight
        if (debouncedRx.cylRight && debouncedRx.cylRight !== '0') params.cylRight = debouncedRx.cylRight
        if (debouncedRx.sphLeft && debouncedRx.sphLeft !== '0') params.sphLeft = debouncedRx.sphLeft
        if (debouncedRx.cylLeft && debouncedRx.cylLeft !== '0') params.cylLeft = debouncedRx.cylLeft
    }
    if (debouncedThickness) params.thickness = debouncedThickness
    if (debouncedLensType) params.lensType = debouncedLensType
    if (debouncedMaterial) params.material = debouncedMaterial
    if (debouncedCoating) params.coating = debouncedCoating

    const { data, isFetching: lensBlankLoading } = useQuery({
        queryKey: ['lens-blanks', params],
        queryFn: async () => {
            const qs = new URLSearchParams(params).toString()
            const r = await fetch(`/api/lens-blanks?${qs}`)
            const json: PaginatedResponse<LensBlankOption> | LensBlankOption[] = await r.json()
            return Array.isArray(json) ? json : (json?.data ?? [])
        },
        enabled: !!debouncedId && prescriptions.length > 0 && !!debouncedRx,
        placeholderData: keepPreviousData,
    })
    const lensBlanks = data ?? []

    if (!selectedRx) return null

    return (
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
                            {[...new Set(lensBlanks.map((b) => b.thickness).filter((v): v is string => !!v))].map((th) => (
                                <option key={th} value={th}>{th}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('stock.lensType')}</Label>
                        <select value={lbFilterLensType} onChange={(e) => setLbFilterLensType(e.target.value)} className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                            <option value="">{t('common.all')}</option>
                            {[...new Set(lensBlanks.map((b) => b.lensType).filter((v): v is string => !!v))].map((lt) => (
                                <option key={lt} value={lt}>{t(`stock.${lt}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('stock.material')}</Label>
                        <select value={lbFilterMaterial} onChange={(e) => setLbFilterMaterial(e.target.value)} className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                            <option value="">{t('common.all')}</option>
                            {[...new Set(lensBlanks.map((b) => b.material).filter((v): v is string => !!v))].map((m) => (
                                <option key={m} value={m}>{t(`stock.${m}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('stock.coating')}</Label>
                        <select value={lbFilterCoating} onChange={(e) => setLbFilterCoating(e.target.value)} className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                            <option value="">{t('common.all')}</option>
                            {[...new Set(lensBlanks.map((b) => b.coating).filter((v): v is string => !!v))].map((c) => (
                                <option key={c} value={c}>{t(`stock.${c}`)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">{prescriptionLabel(selectedRx)}</div>
                {lensBlankLoading ? (
                    <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('common.loading')}
                    </div>
                ) : lensBlanks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">{t('orders.noMatchingLensBlanks')}</p>
                ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {lensBlanks.map((blank) => {
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
                                            {blank.thickness} Â· SPH {blank.sph} Â· CYL {blank.cyl} Â· {Number(blank.sellingPrice).toFixed(3)} TND Â· {blank.quantity ?? 0} in stock
                                        </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => onAddBlank(blank)} disabled={!inStock} className="h-7 px-2 shrink-0">
                                        <Check className="h-3 w-3 mr-1" /> {t('common.add')}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
