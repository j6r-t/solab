'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { prescriptionSchema, type PrescriptionFormData } from '@/lib/validators'

interface ClientOption {
    id: string
    name: string
    familyName: string
    phone: string
}

interface PrescriptionFormProps {
    defaultValues?: Partial<PrescriptionFormData>
    onSubmit: (data: PrescriptionFormData) => Promise<void>
    onCancel: () => void
}

export function PrescriptionForm({ defaultValues, onSubmit, onCancel }: PrescriptionFormProps) {
    const { t } = useTranslation()
    const [clients, setClients] = useState<ClientOption[]>([])
    const [clientSearch, setClientSearch] = useState('')
    const [formData, setFormData] = useState<PrescriptionFormData>({
        clientId: defaultValues?.clientId || '',
        sphRight: defaultValues?.sphRight ?? 0,
        cylRight: defaultValues?.cylRight ?? 0,
        axisRight: defaultValues?.axisRight ?? 0,
        addRight: defaultValues?.addRight ?? 0,
        pdRight: defaultValues?.pdRight ?? 0,
        sphLeft: defaultValues?.sphLeft ?? 0,
        cylLeft: defaultValues?.cylLeft ?? 0,
        axisLeft: defaultValues?.axisLeft ?? 0,
        addLeft: defaultValues?.addLeft ?? 0,
        pdLeft: defaultValues?.pdLeft ?? 0,
        doctorName: defaultValues?.doctorName || '',
    })
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/clients?search=${encodeURIComponent(clientSearch)}`)
                if (res.ok) {
                    const data = await res.json()
                    setClients(data)
                }
            } catch (error) {
                console.error('Failed to fetch clients:', error)
            }
        }
        load()
    }, [clientSearch])

    const clientOptions: SearchSelectOption[] = clients.map((c) => ({
        value: c.id,
        label: `${c.name} ${c.familyName}`,
        secondary: c.phone,
    }))

    function handleChange(field: keyof PrescriptionFormData, value: string | number) {
        setFormData((prev) => ({ ...prev, [field]: value }))
        setErrors((prev) => ({ ...prev, [field]: [] }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrors({})

        const result = prescriptionSchema.safeParse(formData)
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
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label>{t('orders.client')} *</Label>
                <SearchSelect
                    options={clientOptions}
                    value={formData.clientId}
                    onChange={(val) => handleChange('clientId', val)}
                    placeholder={t('clients.searchPlaceholder')}
                    searchPlaceholder={t('clients.searchPlaceholder')}
                    emptyMessage={t('clients.noClients')}
                    title={t('orders.client')}
                />
                {errors.clientId && <p className="text-sm text-destructive">{errors.clientId[0]}</p>}
            </div>

            <Separator />

            <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-primary/60" />
                    {t('prescriptions.rightEye')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {(['sphRight', 'cylRight', 'axisRight', 'addRight', 'pdRight'] as const).map((field) => (
                        <div key={field} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                                {t(`prescriptions.${field.replace('Right', '').toLowerCase()}`)}
                            </Label>
                            <Input
                                type="number"
                                step={field === 'axisRight' || field === 'pdRight' ? '1' : '0.25'}
                                min={field === 'axisRight' ? '0' : undefined}
                                max={field === 'axisRight' ? '180' : undefined}
                                value={formData[field] || ''}
                                onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
                                className="h-8 text-xs"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    {t('prescriptions.leftEye')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {(['sphLeft', 'cylLeft', 'axisLeft', 'addLeft', 'pdLeft'] as const).map((field) => (
                        <div key={field} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                                {t(`prescriptions.${field.replace('Left', '').toLowerCase()}`)}
                            </Label>
                            <Input
                                type="number"
                                step={field === 'axisLeft' || field === 'pdLeft' ? '1' : '0.25'}
                                min={field === 'axisLeft' ? '0' : undefined}
                                max={field === 'axisLeft' ? '180' : undefined}
                                value={formData[field] || ''}
                                onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
                                className="h-8 text-xs"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            <div className="space-y-2">
                <Label htmlFor="doctorName">{t('prescriptions.doctorName')} *</Label>
                <Input
                    id="doctorName"
                    value={formData.doctorName}
                    onChange={(e) => handleChange('doctorName', e.target.value)}
                    placeholder="Dr. ..."
                    className="h-9"
                />
                {errors.doctorName && <p className="text-sm text-destructive">{errors.doctorName[0]}</p>}
            </div>

            <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={loading} className="flex-1 h-10">
                    {loading ? t('common.loading') : t('common.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="h-10">
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    )
}
