'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ClientFormData } from '@/lib/validators'
import { clientSchema } from '@/lib/validators'

interface ClientFormProps {
    defaultValues?: Partial<ClientFormData>
    onSubmit: (data: ClientFormData) => Promise<void>
    onCancel: () => void
    saving?: boolean
}

export function ClientForm({ defaultValues, onSubmit, onCancel, saving: externalSaving }: ClientFormProps) {
    const { t } = useTranslation()
    const [formData, setFormData] = useState<ClientFormData>({
        name: defaultValues?.name || '',
        familyName: defaultValues?.familyName || '',
        phone: defaultValues?.phone || '',
        address: defaultValues?.address || '',
        gender: defaultValues?.gender || undefined,
    })
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [internalSaving, setInternalSaving] = useState(false)
    const loading = internalSaving || externalSaving || false

    function handleChange(field: keyof ClientFormData, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value || undefined }))
        setErrors((prev) => ({ ...prev, [field]: [] }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrors({})

        const result = clientSchema.safeParse(formData)
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors)
            return
        }

        setInternalSaving(true)
        try {
            await onSubmit(formData)
        } catch (error: unknown) {
            const err = error as { json?: () => { error?: Record<string, string[]> } }
            if (err.json) {
                const body = await err.json()
                setErrors(body.error || {})
            }
        } finally {
            setInternalSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('clients.name')} *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Ahmed"
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="familyName">{t('clients.familyName')} *</Label>
                    <Input
                        id="familyName"
                        value={formData.familyName}
                        onChange={(e) => handleChange('familyName', e.target.value)}
                        placeholder="Ben Ali"
                    />
                    {errors.familyName && <p className="text-sm text-destructive">{errors.familyName[0]}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">{t('clients.phone')} *</Label>
                <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+216 22 123 456"
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone[0]}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">{t('clients.address')}</Label>
                <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Tunis, Tunisia"
                />
            </div>

            <div className="space-y-2">
                <Label>{t('clients.gender')}</Label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={formData.gender === 'male'}
                            onChange={(e) => handleChange('gender', e.target.value)}
                            className="accent-primary"
                        />
                        {t('clients.male')}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={formData.gender === 'female'}
                            onChange={(e) => handleChange('gender', e.target.value)}
                            className="accent-primary"
                        />
                        {t('clients.female')}
                    </label>
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