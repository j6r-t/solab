'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { fetchDoctors } from '@/modules/partners/doctors/doctors.api'
import { prescriptionSchema, type PrescriptionFormData } from './prescription.schema'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { PaginatedResponse } from '@/lib/api/pagination'

interface ClientOption {
    id: string
    name: string
    familyName: string
    phone: string
}

interface DoctorOption {
    id: string
    name: string
    phone: string
}

interface PrescriptionFormProps {
    defaultValues?: Partial<PrescriptionFormData>
    onSubmit: (data: PrescriptionFormData) => Promise<void>
    onCancel: () => void
    saving?: boolean
    preselectedClientId?: string
    preselectedClientName?: string
}

export function PrescriptionForm({ defaultValues, onSubmit, onCancel, saving: externalSaving, preselectedClientId, preselectedClientName }: PrescriptionFormProps) {
    const { t } = useTranslation()
    const [clients, setClients] = useState<ClientOption[]>([])
    const [clientSearch] = useState('')
    const [doctors, setDoctors] = useState<DoctorOption[]>([])
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
        doctorId: defaultValues?.doctorId || '',
        dateWritten: defaultValues?.dateWritten || '',
    })
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [internalSaving, setInternalSaving] = useState(false)
    const [ocrLoading, setOcrLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const loading = internalSaving || externalSaving || false

    // Sync preselected client when it arrives/changes (render-phase state adjustment)
    const [syncedPreselect, setSyncedPreselect] = useState(preselectedClientId)
    if (preselectedClientId && preselectedClientId !== syncedPreselect) {
        setSyncedPreselect(preselectedClientId)
        setFormData((prev) => ({ ...prev, clientId: preselectedClientId }))
    }

    useEffect(() => {
        if (preselectedClientId) return
        async function load() {
            try {
                const res = await fetch(`/api/clients?search=${encodeURIComponent(clientSearch)}`)
                if (res.ok) {
                    const json: PaginatedResponse<ClientOption> | ClientOption[] = await res.json()
                    setClients(Array.isArray(json) ? json : (json?.data ?? []))
                }
            } catch (error) {
                console.error('Failed to fetch clients:', error)
            }
        }
        load()
    }, [clientSearch, preselectedClientId])

    useEffect(() => {
        fetchDoctors().then((data) => setDoctors(data || [])).catch(() => {})
    }, [])

    const clientOptions: SearchSelectOption[] = clients.map((c) => ({
        value: c.id,
        label: `${c.name} ${c.familyName}`,
        secondary: c.phone,
    }))

    const doctorOptions: SearchSelectOption[] = doctors.map((d) => ({
        value: d.id,
        label: d.name,
        secondary: d.phone,
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

    async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setOcrLoading(true)
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(new Error('Failed to read file'))
                reader.readAsDataURL(file)
            })

            const commaIndex = base64.indexOf(',')
            const header = base64.slice(0, commaIndex)
            const rawData = base64.slice(commaIndex + 1)
            const detectedMime = header.replace('data:', '').replace(';base64', '')

            const res = await fetch('/api/ocr-prescription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: rawData, mimeType: detectedMime }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Erreur lors de la lecture de l\'ordonnance. Veuillez réessayer.')
            }

            const data = await res.json()

            const fieldMap: Array<{ apiKey: string; formField: keyof PrescriptionFormData }> = [
                { apiKey: 'od_sph', formField: 'sphRight' },
                { apiKey: 'od_cyl', formField: 'cylRight' },
                { apiKey: 'od_axis', formField: 'axisRight' },
                { apiKey: 'os_sph', formField: 'sphLeft' },
                { apiKey: 'os_cyl', formField: 'cylLeft' },
                { apiKey: 'os_axis', formField: 'axisLeft' },
            ]

            for (const { apiKey, formField } of fieldMap) {
                const val = data[apiKey as keyof typeof data]
                if (val != null) {
                    handleChange(formField, val)
                }
            }

            if (data.add != null) {
                handleChange('addRight', data.add)
                handleChange('addLeft', data.add)
            }
            if (data.pd != null) {
                handleChange('pdRight', data.pd)
                handleChange('pdLeft', data.pd)
            }

            toast.success(t('common.ocrSuccess'))
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la lecture de l\'ordonnance. Veuillez réessayer.'
            toast.error(message)
        } finally {
            setOcrLoading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {preselectedClientId ? (
                <div className="rounded-lg bg-muted/30 p-3 border text-sm">
                    <span className="text-muted-foreground">{t('orders.client')}: </span>
                    <span className="font-medium">{preselectedClientName}</span>
                </div>
            ) : (
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
            )}

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t('prescriptions.doctor')}</Label>
                    <SearchSelect
                        options={doctorOptions}
                        value={formData.doctorId || ''}
                        onChange={(val) => handleChange('doctorId', val)}
                        placeholder={t('common.select')}
                        searchPlaceholder={t('common.search')}
                        emptyMessage={t('common.noResults')}
                        title={t('prescriptions.doctor')}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dateWritten">{t('prescriptions.dateWritten')}</Label>
                    <Input
                        id="dateWritten"
                        type="date"
                        value={formData.dateWritten || ''}
                        onChange={(e) => handleChange('dateWritten', e.target.value)}
                        className="h-9"
                    />
                </div>
            </div>

            <Separator />

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleOcrUpload}
            />
            <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="w-full h-10"
            >
                {ocrLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                    <Upload className="h-4 w-4 mr-2" />
                )}
                {ocrLoading ? t('common.loading') : t('prescriptions.uploadPrescription')}
            </Button>

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

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button type="submit" disabled={loading} className="w-full sm:flex-1 h-10">
                    {loading ? t('common.saving') : t('common.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto h-10">
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    )
}
