'use client'

import { useState } from 'react'
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
import type { ProductFormData } from '@/lib/validators'
import { productSchema } from '@/lib/validators'

interface ProductFormProps {
    defaultValues?: Partial<ProductFormData>
    onSubmit: (data: ProductFormData) => Promise<void>
    onCancel: () => void
}

export function ProductForm({ defaultValues, onSubmit, onCancel }: ProductFormProps) {
    const { t } = useTranslation()
    const [formData, setFormData] = useState<ProductFormData>({
        name: defaultValues?.name || '',
        brand: defaultValues?.brand || '',
        model: defaultValues?.model || '',
        category: defaultValues?.category || undefined,
        price: defaultValues?.price || 0,
        quantity: defaultValues?.quantity || 0,
    })
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [loading, setLoading] = useState(false)

    function handleChange(field: keyof ProductFormData, value: string | number | undefined) {
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

        setLoading(true)
        try {
            await onSubmit(formData)
        } catch (error: unknown) {
            if (error instanceof Response) {
                const body = await error.json()
                setErrors(body.error || {})
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('stock.name')} *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Ray-Ban Aviator"
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="brand">{t('stock.brand')} *</Label>
                    <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => handleChange('brand', e.target.value)}
                        placeholder="Ray-Ban"
                    />
                    {errors.brand && <p className="text-sm text-destructive">{errors.brand[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="model">{t('stock.model')} *</Label>
                    <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        placeholder="RB3025"
                    />
                    {errors.model && <p className="text-sm text-destructive">{errors.model[0]}</p>}
                </div>

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">{t('stock.price')} *</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.price || ''}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    />
                    {errors.price && <p className="text-sm text-destructive">{errors.price[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="quantity">{t('stock.quantity')}</Label>
                    <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={formData.quantity || ''}
                        onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                    />
                    {errors.quantity && <p className="text-sm text-destructive">{errors.quantity[0]}</p>}
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? t('common.loading') : t('common.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    )
}