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
import type { ProductFormData } from './stock.schema'
import { fetchFournisseurs } from '@/modules/partners/fournisseurs/fournisseurs.api'
import { fetchNamedItems } from '@/modules/system/settings/settings.api'
import { productSchema } from './stock.schema'
import { computePriceAfterTax } from '@/lib/utils/pricing'

interface ProductFormProps {
    defaultValues?: Partial<ProductFormData>
    onSubmit: (data: ProductFormData) => Promise<void>
    onCancel: () => void
    saving?: boolean
    role?: string
}

const lensTypeEnums = ['singleVision', 'progressive', 'bifocal', 'office', 'photochromic'] as const
const materials = ['cr39', 'polycarbonate', 'highIndex', 'trivex'] as const
const coatings = ['none', 'ar', 'scratchResistant', 'blueBlock', 'arScratch', 'arBlueBlock'] as const
const thicknessOptions = ['1.50', '1.53', '1.56', '1.59', '1.60', '1.67', '1.70', '1.74']

export function ProductForm({ defaultValues, onSubmit, onCancel, saving: externalSaving, role }: ProductFormProps) {
    const { t } = useTranslation()
    const isShop = role === 'shop'
    const [formData, setFormData] = useState<ProductFormData>({
        name: defaultValues?.name || '',
        brand: defaultValues?.brand || '',
        model: defaultValues?.model || '',
        category: defaultValues?.category || undefined,
        price: defaultValues?.price || 0,
        priceAfterTax: defaultValues?.priceAfterTax,
        costPrice: defaultValues?.costPrice,
        quantity: defaultValues?.quantity || 0,
        thickness: defaultValues?.thickness,
        lensType: defaultValues?.lensType,
        material: defaultValues?.material,
        coating: defaultValues?.coating,
        sph: defaultValues?.sph,
        cyl: defaultValues?.cyl,
        add: defaultValues?.add,
        fournisseurId: defaultValues?.fournisseurId,
    })
    const [fournisseurs, setFournisseurs] = useState<{ id: string; name: string }[]>([])
    const [lensBrands, setLensBrands] = useState<{ id: string; name: string }[]>([])
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [internalSaving, setInternalSaving] = useState(false)
    const loading = internalSaving || externalSaving || false

    useEffect(() => {
        fetchNamedItems('/api/lens-brands').then((data) => setLensBrands(data || [])).catch(() => {})
        fetchFournisseurs().then((data) => {
            const list = data || []
            setFournisseurs(list)
            if (list.length === 1 && !defaultValues?.fournisseurId) {
                setFormData((prev) => ({ ...prev, fournisseurId: list[0].id }))
            }
        }).catch(() => {})
    }, [defaultValues?.fournisseurId])
    const cat = formData.category

    function handleChange(field: keyof ProductFormData, value: string | number | undefined) {
        if (field === 'category') {
            const newCat = value as 'lunette' | 'lentille' | 'verre' | 'accessory' | 'nettoyant_lentilles' | 'nettoyant_monture' | undefined
            if (newCat === 'accessory') {
                setFormData((prev) => ({
                    ...prev,
                    category: newCat,
                    brand: '',
                    model: '',
                    thickness: undefined,
                    lensType: undefined,
                    material: undefined,
                    coating: undefined,
                    sph: undefined,
                    cyl: undefined,
                    add: undefined,
                }));
                return
            } else if (newCat === 'verre') {
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
            } else {
                setFormData((prev) => ({
                    ...prev,
                    category: newCat,
                    thickness: newCat === 'nettoyant_monture' ? '50ml' : undefined,
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
        if (field === 'price') {
            const price = typeof value === 'number' ? value : parseFloat(value ?? '') || 0
            setFormData((prev) => ({ ...prev, price, priceAfterTax: computePriceAfterTax(price) }))
            setErrors((prev) => ({ ...prev, price: [] }))
            return
        }
        setFormData((prev) => ({ ...prev, [field]: value }))
        setErrors((prev) => ({ ...prev, [field]: [] }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrors({})

        const payload = { ...formData }
        if (payload.category === 'nettoyant_monture' && !payload.name) {
            payload.name = 'Nettoyant Monture'
        }

        const result = productSchema.safeParse(payload)
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors)
            return
        }

        setInternalSaving(true)
        try {
            await onSubmit(payload)
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
                        <SelectItem value="lunette">{t('stock.lunette')}</SelectItem>
                        <SelectItem value="lentille">{t('stock.lentille')}</SelectItem>
                        {!isShop && <SelectItem value="verre">{t('stock.verre')}</SelectItem>}
                        <SelectItem value="accessory">{t('stock.accessory')}</SelectItem>
                        <SelectItem value="nettoyant_lentilles">{t('stock.nettoyant_lentilles')}</SelectItem>
                        <SelectItem value="nettoyant_monture">{t('stock.nettoyant_monture')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {cat === 'lunette' && (
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
                        <Label htmlFor="model">{t('stock.ref')} *</Label>
                        <Input id="model" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="RB3025" />
                        {errors.model && <p className="text-sm text-destructive">{errors.model[0]}</p>}
                    </div>
                </div>
            )}

            {cat === 'lentille' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('stock.name')} *</Label>
                            <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Daily" />
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
                        <p className="text-sm font-medium text-muted-foreground">{t('stock.lensParameters')}</p>
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

            {cat === 'verre' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('stock.name')} *</Label>
                            <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Organic" />
                            {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand">{t('stock.brand')} *</Label>
                            <Input id="brand" value={formData.brand} onChange={(e) => handleChange('brand', e.target.value)} placeholder="Essilor" />
                            {errors.brand && <p className="text-sm text-destructive">{errors.brand[0]}</p>}
                        </div>
                    </div>

                    <div className="space-y-4 p-3 bg-muted/20 rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground">{t('stock.lensParameters')}</p>
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
                                <Label>{t('stock.thickness')}</Label>
                                <Select value={formData.thickness || ''} onValueChange={(val) => handleChange('thickness', val || undefined)}>
                                    <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                                    <SelectContent>
                                        {thicknessOptions.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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

            {(cat === 'nettoyant_lentilles' || cat === 'nettoyant_monture') && (
                <div className="space-y-4">
                    {cat !== 'nettoyant_monture' && (
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('stock.name')} *</Label>
                            <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder={cat === 'nettoyant_lentilles' ? 'Lens Cleaning Solution' : 'Frame Cleaner'} />
                            {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>{t('stock.size')}</Label>
                        <Select value={formData.thickness || ''} onValueChange={(val) => handleChange('thickness', val || undefined)}>
                            <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                            <SelectContent>
                                {cat === 'nettoyant_lentilles' ? (
                                    <>
                                        <SelectItem value="50ml">50ml</SelectItem>
                                        <SelectItem value="100ml">100ml</SelectItem>
                                        <SelectItem value="360ml">360ml</SelectItem>
                                        <SelectItem value="400ml">400ml</SelectItem>
                                    </>
                                ) : (
                                    <SelectItem value="50ml">50ml</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">{t('stock.sellingPrice')} *</Label>
                    <Input id="price" type="number" step="0.001" min="0" value={formData.price || ''} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} />
                    {errors.price && <p className="text-sm text-destructive">{errors.price[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="priceAfterTax">{t('stock.priceAfterTax')}</Label>
                    <Input id="priceAfterTax" type="number" step="0.001" min="0" value={formData.priceAfterTax ?? ''} onChange={(e) => handleChange('priceAfterTax', e.target.value ? parseFloat(e.target.value) : undefined)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="costPrice">{t('stock.costPrice')}</Label>
                    <Input id="costPrice" type="number" step="0.001" min="0" value={formData.costPrice ?? ''} onChange={(e) => handleChange('costPrice', e.target.value ? parseFloat(e.target.value) : undefined)} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="quantity">{t('stock.quantity')}</Label>
                    <Input id="quantity" type="number" min="0" value={formData.quantity || ''} onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)} />
                    {errors.quantity && <p className="text-sm text-destructive">{errors.quantity[0]}</p>}
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
