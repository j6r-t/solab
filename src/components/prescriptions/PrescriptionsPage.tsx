'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PrescriptionForm } from './PrescriptionForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Plus, FileText, User, Stethoscope, Calendar, Eye, EyeOff, Search, Pencil, Trash2 } from 'lucide-react'
import type { PrescriptionFormData } from '@/lib/validators'
import { toast } from 'sonner'

interface Prescription {
    id: string
    client: { id: string; name: string; familyName: string; phone: string }
    sphRight: string
    cylRight: string
    axisRight: number
    addRight: string
    pdRight: number
    sphLeft: string
    cylLeft: string
    axisLeft: number
    addLeft: string
    pdLeft: number
    doctorName: string
    createdAt: string
}

export function PrescriptionsPage() {
    const { t } = useTranslation()
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editPrescription, setEditPrescription] = useState<Prescription | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Prescription | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/prescriptions')
                if (res.ok) {
                    setPrescriptions(await res.json())
                }
            } catch (error) {
                console.error('Failed to fetch prescriptions:', error)
            }
        }
        load()
    }, [])

    async function reFetch() {
        const res = await fetch('/api/prescriptions')
        if (res.ok) setPrescriptions(await res.json())
    }

    async function handleCreate(data: PrescriptionFormData) {
        const res = await fetch('/api/prescriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        if (!res.ok) {
            const body = await res.json()
            throw new Error(JSON.stringify(body.error))
        }
        setDialogOpen(false)
        await reFetch()
        toast.success(t('prescriptions.created'))
    }

    async function handleUpdate(data: PrescriptionFormData) {
        if (!editPrescription) return
        const res = await fetch(`/api/prescriptions/${editPrescription.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        if (!res.ok) {
            const body = await res.json()
            throw new Error(JSON.stringify(body.error))
        }
        setEditPrescription(null)
        await reFetch()
        toast.success(t('prescriptions.updated'))
    }

    async function handleDelete(prescription: Prescription) {
        await fetch(`/api/prescriptions/${prescription.id}`, { method: 'DELETE' })
        setDeleteTarget(null)
        await reFetch()
        toast.success(t('prescriptions.deleted'))
    }

    const filtered = search
        ? prescriptions.filter((rx) =>
            `${rx.client.name} ${rx.client.familyName}`.toLowerCase().includes(search.toLowerCase())
          )
        : prescriptions

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{t('prescriptions.title')}</h1>
                    <Button onClick={() => { setEditPrescription(null); setDialogOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('prescriptions.newPrescription')}
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`${t('common.search')}...`}
                        className="pl-10"
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 rounded-xl empty-state-gradient text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                        <p>{t('prescriptions.noPrescriptions')}</p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {filtered.map((rx) => (
                            <div key={rx.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {rx.client.name} {rx.client.familyName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{rx.client.phone}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs gap-1 shrink-0">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(rx.createdAt).toLocaleDateString()}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                                        <Stethoscope className="h-3.5 w-3.5" />
                                        <span>{t('prescriptions.doctorName')}: <span className="font-medium text-foreground">{rx.doctorName}</span></span>
                                    </div>

                                    <div className="bg-card rounded-lg border p-2">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                <Eye className="h-3.5 w-3.5" />
                                                {t('prescriptions.rightEye')}
                                            </div>
                                            <div className="grid grid-cols-5 gap-1 bg-muted/30 rounded-lg p-2 text-center">
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.sph')}</p><p className="font-semibold text-xs">{rx.sphRight}</p></div>
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.cyl')}</p><p className="font-semibold text-xs">{rx.cylRight}</p></div>
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.axis')}</p><p className="font-semibold text-xs">{rx.axisRight}°</p></div>
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.add')}</p><p className="font-semibold text-xs">{rx.addRight}</p></div>
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.pd')}</p><p className="font-semibold text-xs">{rx.pdRight}</p></div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                <EyeOff className="h-3.5 w-3.5" />
                                                {t('prescriptions.leftEye')}
                                            </div>
                                            <div className="grid grid-cols-5 gap-1 bg-muted/30 rounded-lg p-2 text-center">
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.sph')}</p><p className="font-semibold text-xs">{rx.sphLeft}</p></div>
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.cyl')}</p><p className="font-semibold text-xs">{rx.cylLeft}</p></div>
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.axis')}</p><p className="font-semibold text-xs">{rx.axisLeft}°</p></div>
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.add')}</p><p className="font-semibold text-xs">{rx.addLeft}</p></div>
                                                <div className="rounded p-1.5 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.pd')}</p><p className="font-semibold text-xs">{rx.pdLeft}</p></div>
                                            </div>
                                        </div>
                                    </div>
                                    </div>

                                    <div className="flex justify-end gap-1 pt-1 border-t">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditPrescription(rx); setDialogOpen(true) }} title={t('common.edit')}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(rx)} title={t('common.delete')}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setEditPrescription(null); setDialogOpen(open) }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editPrescription ? t('common.edit') : t('prescriptions.newPrescription')}</DialogTitle>
                        </DialogHeader>
                        <PrescriptionForm
                            defaultValues={editPrescription ? {
                                clientId: editPrescription.client.id,
                                sphRight: parseFloat(editPrescription.sphRight),
                                cylRight: parseFloat(editPrescription.cylRight),
                                axisRight: editPrescription.axisRight,
                                addRight: parseFloat(editPrescription.addRight),
                                pdRight: editPrescription.pdRight,
                                sphLeft: parseFloat(editPrescription.sphLeft),
                                cylLeft: parseFloat(editPrescription.cylLeft),
                                axisLeft: editPrescription.axisLeft,
                                addLeft: parseFloat(editPrescription.addLeft),
                                pdLeft: editPrescription.pdLeft,
                                doctorName: editPrescription.doctorName,
                            } : undefined}
                            onSubmit={editPrescription ? handleUpdate : handleCreate}
                            onCancel={() => { setEditPrescription(null); setDialogOpen(false) }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('common.delete')}
                description={deleteTarget ? `${deleteTarget.client.name} ${deleteTarget.client.familyName}` : ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />
        </>
    )
}
