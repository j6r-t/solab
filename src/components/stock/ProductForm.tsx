'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
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
import type { ProductFormData } from '@/lib/validators'
import { productSchema } from '@/lib/validators'

interface ProductFormProps {
    defaultValues?: Partial<ProductFormData>
    onSubmit: (data: ProductFormData) => Promise<void>
    onCancel: () => void
    saving?: boolean
}

const lensTypeEnums = ['singleVision', 'progressive', 'bifocal', 'office', 'photochromic'] as const
const materials = ['cr39', 'polycarbonate', 'highIndex', 'trivex'] as const
const coatings = ['none', 'ar', 'scratchResistant', 'blueBlock', 'arScratch', 'arBlueBlock'] as const

export function ProductForm({ defaultValues, onSubmit, onCancel, saving: externalSaving }: ProductFormProps) {
    const { t } = useTranslation()
    const [formData, setFormData] = useState<ProductFormData>({
        name: defaultValues?.name || '',
        brand: defaultValues?.brand || '',
        model: defaultValues?.model || '',
        category: defaultValues?.category || undefined,
        price: defaultValues?.price || 0,
        quantity: defaultValues?.quantity || 0,
        lensType: defaultValues?.lensType,
        material: defaultValues?.material,
        coating: defaultValues?.coating,
        sph: defaultValues?.sph,
        cyl: defaultValues?.cyl,
        add: defaultValues?.add,
    })
    const [lensTypes, setLensTypes] = useState<{ id: string; name: string }[]>([])
    const [lensBrands, setLensBrands] = useState<{ id: string; name: string }[]>([])
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [internalSaving, setInternalSaving] = useState(false)
    const loading = internalSaving || externalSaving || false

    useEffect(() => {
        fetch('/api/lens-catalogue').then((r) => r.ok && r.json()).then((data) => setLensTypes(data || [])).catch(() => {})
        fetch('/api/lens-brands').then((r) => r.ok && r.json()).then((data) => setLensBrands(data || [])).catch(() => {})
    }, [])
    const cat = formData.category

    function handleChange(field: keyof ProductFormData, value: string | number | undefined) {
        if (field === 'category') {
            const newCat = value as 'eyewear' | 'lens' | 'accessory' | undefined
            if (newCat === 'lens') {
                setFormData((prev) => ({
                    ...prev,
                    category: newCat,
                    model: '',
                    lensType: undefined,
                    material: undefined,
                    coating: undefined,
                    sph: undefined,
                    cyl: undefined,
                    add: undefined,
                }))
            } else if (newCat === 'accessory') {
                setFormData((prev) => ({
                    ...prev,
                    category: newCat,
                    brand: '',
                    model: '',
                    lensType: undefined,
                    material: undefined,
                    coating: undefined,
                    sph: undefined,
                    cyl: undefined,
                    add: undefined,
                }))
            } else {
                setFormData((prev) => ({
                    ...prev,
                    category: newCat,
                    lensType: undefined,
                    material: undefined,
                    coating: undefined,
                    sph: undefined,
                    cyl: undefined,
                    add: undefined,
                }))
            }
            setErrors((prev) => ({ ...prev, [field]: [], brand: [], model: [] }))
            return
        }
        setFormData((prev) => ({ ...prev, [field]: value }))
        setErrors((prev) => ({ ...prev, [field]: [] }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrors({})

        const result = productSchema.safeParse(formData)
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors)
            return
        }

        setInternalSaving(true)
        try {
            await onSubmit(formData)
        } catch (error: unknown) {
            if (error instanceof Response) {
                const body = await error.json()
                setErrors(body.error || {})
            }
        } finally {
            setInternalSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
                <Label htmlFor="category">{t('stock.category')}</Label>
                <Select
                    value={formData.category || ''}
                    onValueChange={(val) => handleChange('category', val || undefined)}
                >
                    <SelectTrigger id="category">
                        <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="eyewear">{t('stock.eyewear')}</SelectItem>
                        <SelectItem value="lens">{t('stock.lens')}</SelectItem>
                        <SelectItem value="accessory">{t('stock.accessory')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {cat === 'eyewear' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('stock.name')} *</Label>
                        <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Aviator" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="brand">{t('stock.brand')} *</Label>
                        <Input id="brand" value={formData.brand} onChange={(e) => handleChange('brand', e.target.value)} placeholder="Ray-Ban" />
                        {errors.brand && <p className="text-sm text-destructive">{errors.brand[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">{t('stock.model')} *</Label>
                        <Input id="model" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="RB3025" />
                        {errors.model && <p className="text-sm text-destructive">{errors.model[0]}</p>}
                    </div>
                </div>
            )}

            {cat === 'lens' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('stock.lensType')} *</Label>
                            <SearchSelect
                                options={lensTypes.map((lt) => ({ value: lt.name, label: lt.name } as SearchSelectOption))}
                                value={formData.name}
                                onChange={(val) => handleChange('name', val)}
                                placeholder={t('common.select')}
                                searchPlaceholder={t('common.search')}
                                emptyMessage={t('common.noResults')}
                                title={t('stock.lensType')}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>{t('stock.brand')} *</Label>
                            <SearchSelect
                                options={lensBrands.map((lb) => ({ value: lb.name, label: lb.name } as SearchSelectOption))}
                                value={formData.brand || ''}
                                onChange={(val) => handleChange('brand', val)}
                                placeholder={t('common.select')}
                                searchPlaceholder={t('common.search')}
                                emptyMessage={t('common.noResults')}
                                title={t('stock.brand')}
                            />
                            {errors.brand && <p className="text-sm text-destructive">{errors.brand[0]}</p>}
                        </div>
                    </div>

                    <div className="space-y-4 p-3 bg-muted/20 rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground">Lens Parameters</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>{t('stock.lensType')}</Label>
                                <Select value={formData.lensType || ''} onValueChange={(val) => handleChange('lensType', val || undefined)}>
                                    <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                                    <SelectContent>
                                        {lensTypeEnums.map((type) => (
                                            <SelectItem key={type} value={type}>{t(`stock.${type}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('stock.material')}</Label>
                                <Select value={formData.material || ''} onValueChange={(val) => handleChange('material', val || undefined)}>
                                    <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                                    <SelectContent>
                                        {materials.map((m) => (
                                            <SelectItem key={m} value={m}>{t(`stock.${m}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('stock.coating')}</Label>
                                <Select value={formData.coating || ''} onValueChange={(val) => handleChange('coating', val || undefined)}>
                                    <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                                    <SelectContent>
                                        {coatings.map((c) => (
                                            <SelectItem key={c} value={c}>{t(`stock.${c}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>{t('stock.sph')}</Label>
                                <Input type="number" step="0.25" value={formData.sph ?? ''} onChange={(e) => handleChange('sph', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="-2.00" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('stock.cyl')}</Label>
                                <Input type="number" step="0.25" value={formData.cyl ?? ''} onChange={(e) => handleChange('cyl', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="-0.75" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('stock.add')}</Label>
                                <Input type="number" step="0.25" value={formData.add ?? ''} onChange={(e) => handleChange('add', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="+2.00" />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {cat === 'accessory' && (
                <div className="space-y-2">
                    <Label htmlFor="name">{t('stock.name')} *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Cleaning cloth" />
                    {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">{t('stock.price')} *</Label>
                    <Input id="price" type="number" step="0.001" min="0" value={formData.price || ''} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} />
                    {errors.price && <p className="text-sm text-destructive">{errors.price[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="quantity">{t('stock.quantity')}</Label>
                    <Input id="quantity" type="number" min="0" value={formData.quantity || ''} onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)} />
                    {errors.quantity && <p className="text-sm text-destructive">{errors.quantity[0]}</p>}
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? t('common.saving') : t('common.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    )
}
