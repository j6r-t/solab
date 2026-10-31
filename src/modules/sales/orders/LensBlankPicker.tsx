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
import { formatCurrency } from '@/lib/utils/currency'

interface LensBlankPickerProps {
    prescriptions: PrescriptionOption[]
    selectedPrescriptionId: string
    onAddBlank: (blank: LensBlankOption) => void
    t: (key: string, vars?: Record<string, string | number>) => string
}

function distinctValues(values: (string | null | undefined)[]): string[] {
    return [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b))
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

    // Filter dropdown options come from ALL blanks in inventory (not just current results),
    // so mom can always pick any type/material/coating/thickness the shop carries.
    const { data: allData } = useQuery({
        queryKey: ['lens-blanks', 'picker-options'],
        queryFn: async () => {
            const r = await fetch('/api/lens-blanks?limit=200')
            const json: PaginatedResponse<LensBlankOption> | LensBlankOption[] = await r.json()
            return Array.isArray(json) ? json : (json?.data ?? [])
        },
        enabled: !!debouncedId && prescriptions.length > 0 && !!debouncedRx,
        staleTime: 60_000,
    })
    const allBlanks = allData ?? []
    const thicknessOptions = distinctValues(allBlanks.map((b) => b.thickness))
    const lensTypeOptions = distinctValues(allBlanks.map((b) => b.lensType))
    const materialOptions = distinctValues(allBlanks.map((b) => b.material))
    const coatingOptions = distinctValues(allBlanks.map((b) => b.coating))

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
                        <select value={lbFilterThickness} onChange={(e) => setLbFilterThickness(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm">
                            <option value="">{t('common.all')}</option>
                            {thicknessOptions.map((th) => (
                                <option key={th} value={th}>{th}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('stock.lensType')}</Label>
                        <select value={lbFilterLensType} onChange={(e) => setLbFilterLensType(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm">
                            <option value="">{t('common.all')}</option>
                            {lensTypeOptions.map((lt) => (
                                <option key={lt} value={lt}>{t(`stock.${lt}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('stock.material')}</Label>
                        <select value={lbFilterMaterial} onChange={(e) => setLbFilterMaterial(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm">
                            <option value="">{t('common.all')}</option>
                            {materialOptions.map((m) => (
                                <option key={m} value={m}>{t(`stock.${m}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('stock.coating')}</Label>
                        <select value={lbFilterCoating} onChange={(e) => setLbFilterCoating(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm">
                            <option value="">{t('common.all')}</option>
                            {coatingOptions.map((c) => (
                                <option key={c} value={c}>{t(`stock.${c}`)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">{prescriptionLabel(selectedRx)}</span>
                    {!lensBlankLoading && (
                        <span className="font-medium">{t('orders.matchingCount', { n: lensBlanks.length })}</span>
                    )}
                </div>
                {lensBlankLoading ? (
                    <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('common.loading')}
                    </div>
                ) : lensBlanks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">{t('orders.noMatchingLensBlanks')}</p>
                ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {lensBlanks.map((blank) => {
                            const qty = blank.quantity ?? 0
                            const inStock = qty > 0
                            return (
                                <div key={blank.id} className={`flex items-center gap-2 p-2.5 rounded-lg border ${inStock ? 'bg-background' : 'bg-muted/30 opacity-60'}`}>
                                    <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-sm font-medium truncate">{blank.brand}</span>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t(`stock.${blank.lensType}`)}</Badge>
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t(`stock.${blank.material}`)}</Badge>
                                            {blank.coating !== 'none' && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t(`stock.${blank.coating}`)}</Badge>}
                                            {inStock ? (
                                                <Badge className="text-[10px] px-1.5 py-0" aria-label={t('common.inStockSuffix', { n: qty })}>×{qty}</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{t('stock.outOfStock')}</Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {blank.thickness} · SPH {blank.sph} · CYL {blank.cyl} · {formatCurrency(blank.sellingPrice)} · {t('common.inStockSuffix', { n: qty })}
                                        </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => onAddBlank(blank)} disabled={!inStock} className="h-8 px-2 shrink-0">
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
