'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { fetchDoctors } from '@/modules/partners/doctors/doctors.api'
import { createPrescription, type Prescription } from '@/modules/sales/prescriptions/prescriptions.api'

interface NewPrescriptionDialogProps {
    open: boolean
    clientId: string
    onClose: () => void
    onCreated: (prescription: Prescription) => void
    t: (key: string) => string
}

export function NewPrescriptionDialog({ open, clientId, onClose, onCreated, t }: NewPrescriptionDialogProps) {
    const today = new Date().toISOString().split('T')[0]
    const [newRxDoctorId, setNewRxDoctorId] = useState('')
    const [newRxDate, setNewRxDate] = useState(today)
    const [newRxRight, setNewRxRight] = useState({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
    const [newRxLeft, setNewRxLeft] = useState({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
    const [creatingRx, setCreatingRx] = useState(false)

    const { data: rxDoctorsData } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => fetchDoctors(),
        enabled: open,
    })
    const rxDoctors = rxDoctorsData ?? []

    const rxDoctorOptions: SearchSelectOption[] = rxDoctors.map((d) => ({
        value: d.id,
        label: d.name,
        secondary: d.phone,
    }))

    async function handleCreatePrescription() {
        setCreatingRx(true)
        try {
            const created = await createPrescription({
                clientId,
                sphRight: newRxRight.sph, cylRight: newRxRight.cyl, axisRight: newRxRight.axis, addRight: newRxRight.add, pdRight: newRxRight.pd,
                sphLeft: newRxLeft.sph, cylLeft: newRxLeft.cyl, axisLeft: newRxLeft.axis, addLeft: newRxLeft.add, pdLeft: newRxLeft.pd,
                ...(newRxDoctorId ? { doctorId: newRxDoctorId } : {}),
                ...(newRxDate ? { dateWritten: newRxDate } : {}),
            })
            onCreated(created)
            onClose()
            setNewRxRight({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
            setNewRxLeft({ sph: 0, cyl: 0, axis: 0, add: 0, pd: 0 })
            setNewRxDoctorId('')
            setNewRxDate(today)
            toast.success(t('prescriptions.created'))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create prescription')
        } finally {
            setCreatingRx(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setNewRxDoctorId(''); setNewRxDate(today) } }}>
            <DialogContent className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('prescriptions.newPrescription')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t('prescriptions.doctor')}</Label>
                            <SearchSelect
                                options={rxDoctorOptions}
                                value={newRxDoctorId}
                                onChange={setNewRxDoctorId}
                                placeholder={t('common.select')}
                                searchPlaceholder={t('common.search')}
                                emptyMessage={t('common.noResults')}
                                title={t('prescriptions.doctor')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t('prescriptions.dateWritten')}</Label>
                            <Input
                                type="date"
                                value={newRxDate}
                                onChange={(e) => setNewRxDate(e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {(['sph', 'cyl', 'axis', 'add', 'pd'] as const).map((field) => (
                            <div key={field} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t(`prescriptions.${field}`)} R</Label>
                                <Input type="number" step={field === 'axis' || field === 'pd' ? '1' : '0.25'}
                                    min={field === 'axis' ? '0' : undefined} max={field === 'axis' ? '180' : undefined}
                                    value={newRxRight[field] || ''}
                                    onChange={(e) => setNewRxRight((prev) => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }))}
                                    className="h-8 text-xs" />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {(['sph', 'cyl', 'axis', 'add', 'pd'] as const).map((field) => (
                            <div key={field} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t(`prescriptions.${field}`)} L</Label>
                                <Input type="number" step={field === 'axis' || field === 'pd' ? '1' : '0.25'}
                                    min={field === 'axis' ? '0' : undefined} max={field === 'axis' ? '180' : undefined}
                                    value={newRxLeft[field] || ''}
                                    onChange={(e) => setNewRxLeft((prev) => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }))}
                                    className="h-8 text-xs" />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="button" size="sm" onClick={handleCreatePrescription} disabled={creatingRx}>
                            {creatingRx ? t('common.saving') : t('common.save')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
