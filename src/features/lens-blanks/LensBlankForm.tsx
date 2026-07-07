'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { fetchFournisseurs } from '@/features/fournisseurs/fournisseurs.api'

interface LensBlankFormData {
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sphMin: number
    sphMax: number
    cylMin: number
    cylMax: number
    costPrice: number
    sellingPrice: number
    quantity: number
    fournisseurId?: string
}

interface LensBlankFormProps {
    defaultValues?: Partial<LensBlankFormData>
    onSubmit: (data: LensBlankFormData) => Promise<void>
    onCancel: () => void
    saving?: boolean
}

const LENS_TYPES = ['singleVision', 'progressive', 'bifocal', 'office', 'photochromic'] as const
const MATERIALS = ['cr39', 'polycarbonate', 'highIndex', 'trivex'] as const
const COATINGS = ['none', 'ar', 'scratchResistant', 'blueBlock', 'arScratch', 'arBlueBlock'] as const
const THICKNESS_OPTIONS = ['1.50', '1.53', '1.56', '1.59', '1.60', '1.67', '1.70', '1.74']

export function LensBlankForm({ defaultValues, onSubmit, onCancel, saving: externalSaving }: LensBlankFormProps) {
    const { t } = useTranslation()
    const [formData, setFormData] = useState<LensBlankFormData>({
        brand: defaultValues?.brand || '',
        lensType: defaultValues?.lensType || '',
        material: defaultValues?.material || '',
        coating: defaultValues?.coating || '',
        thickness: defaultValues?.thickness || '1.60',
        sphMin: defaultValues?.sphMin || 0,
        sphMax: defaultValues?.sphMax || 0,
        cylMin: defaultValues?.cylMin || 0,
        cylMax: defaultValues?.cylMax || 0,
        costPrice: defaultValues?.costPrice || 0,
        sellingPrice: defaultValues?.sellingPrice || 0,
        quantity: defaultValues?.quantity || 0,
        fournisseurId: defaultValues?.fournisseurId,
    })
    const [fournisseurs, setFournisseurs] = useState<{ id: string; name: string }[]>([])
    const [internalSaving, setInternalSaving] = useState(false)
    const loading = internalSaving || externalSaving || false

    useEffect(() => {
        fetchFournisseurs().then((data) => {
            const list = data || []
            setFournisseurs(list)
        }).catch(() => {})
    }, [])

    function handleChange(field: keyof LensBlankFormData, value: string | number | undefined) {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setInternalSaving(true)
        try {
            await onSubmit(formData)
        } finally {
            setInternalSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="brand">{t('lensBlank.brand')} *</Label>
                    <Input id="brand" value={formData.brand} onChange={(e) => handleChange('brand', e.target.value)} placeholder="Essilor" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="thickness">Thickness *</Label>
                    <Select value={formData.thickness} onValueChange={(val) => handleChange('thickness', val)}>
                        <SelectTrigger id="thickness"><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>
                            {THICKNESS_OPTIONS.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>{t('stock.lensType')}</Label>
                    <Select value={formData.lensType} onValueChange={(val) => handleChange('lensType', val)}>
                        <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>
                            {LENS_TYPES.map((lt) => (
                                <SelectItem key={lt} value={lt}>{t(`stock.${lt}`)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>{t('stock.material')}</Label>
                    <Select value={formData.material} onValueChange={(val) => handleChange('material', val)}>
                        <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>
                            {MATERIALS.map((m) => (
                                <SelectItem key={m} value={m}>{t(`stock.${m}`)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>{t('stock.coating')}</Label>
                    <Select value={formData.coating} onValueChange={(val) => handleChange('coating', val)}>
                        <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>
                            {COATINGS.map((c) => (
                                <SelectItem key={c} value={c}>{t(`stock.${c}`)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4 p-3 bg-muted/20 rounded-lg border">
                <p className="text-sm font-medium text-muted-foreground">Power Range</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>SPH min</Label>
                        <Input type="number" step="0.25" value={formData.sphMin} onChange={(e) => handleChange('sphMin', parseFloat(e.target.value) || 0)} placeholder="-6.00" />
                    </div>
                    <div className="space-y-2">
                        <Label>SPH max</Label>
                        <Input type="number" step="0.25" value={formData.sphMax} onChange={(e) => handleChange('sphMax', parseFloat(e.target.value) || 0)} placeholder="+4.00" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>CYL min</Label>
                        <Input type="number" step="0.25" value={formData.cylMin} onChange={(e) => handleChange('cylMin', parseFloat(e.target.value) || 0)} placeholder="-2.00" />
                    </div>
                    <div className="space-y-2">
                        <Label>CYL max</Label>
                        <Input type="number" step="0.25" value={formData.cylMax} onChange={(e) => handleChange('cylMax', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t('stock.costPrice')}</Label>
                    <Input type="number" step="0.001" min="0" value={formData.costPrice} onChange={(e) => handleChange('costPrice', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>{t('stock.sellingPrice')} *</Label>
                    <Input type="number" step="0.001" min="0" value={formData.sellingPrice} onChange={(e) => handleChange('sellingPrice', parseFloat(e.target.value) || 0)} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t('stock.quantity')}</Label>
                    <Input type="number" min="0" value={formData.quantity} onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>{t('stock.fournisseur')}</Label>
                    <SearchSelect
                        options={fournisseurs.map((f) => ({ value: f.id, label: f.name } as SearchSelectOption))}
                        value={formData.fournisseurId || ''}
                        onChange={(val) => handleChange('fournisseurId', val || undefined)}
                        placeholder={t('common.select')}
                        searchPlaceholder={t('common.search')}
                        emptyMessage={t('common.noResults')}
                        title={t('stock.fournisseur')}
                    />
                </div>
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
