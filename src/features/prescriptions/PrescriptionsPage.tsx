'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PrescriptionForm } from './PrescriptionForm'
import { PrescriptionCards } from './PrescriptionCards'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Plus, FileText, Search, Loader2 } from 'lucide-react'
import type { PrescriptionFormData } from './prescription.schema'
import { fetchPrescriptions, createPrescription, updatePrescription, deletePrescription } from './prescriptions.api'
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
    doctor: { id: string; name: string } | null
    dateWritten: string | null
    createdAt: string
}

export function PrescriptionsPage() {
    const { t } = useTranslation()
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editPrescription, setEditPrescription] = useState<Prescription | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Prescription | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const data = await fetchPrescriptions()
                setPrescriptions(data)
            } catch (error) {
                console.error('Failed to fetch prescriptions:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    async function reFetch() {
        const data = await fetchPrescriptions()
        setPrescriptions(data)
    }

    async function handleCreate(data: PrescriptionFormData) {
        setSaving(true)
        try {
            await createPrescription(data)
            toast.success(t('prescriptions.created'))
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create prescription')
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdate(data: PrescriptionFormData) {
        if (!editPrescription) return
        setSaving(true)
        try {
            await updatePrescription(editPrescription.id, data)
            toast.success(t('prescriptions.updated'))
            setEditPrescription(null)
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update prescription')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(prescription: Prescription) {
        try {
            await deletePrescription(prescription.id)
            toast.success(t('prescriptions.deleted'))
            setDeleteTarget(null)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete prescription')
        }
    }

    const filtered = debouncedSearch
        ? prescriptions.filter((rx) =>
            `${rx.client.name} ${rx.client.familyName}`.toLowerCase().includes(debouncedSearch.toLowerCase())
          )
        : prescriptions

    const showEmptyState = !loading && prescriptions.length === 0
    const showNoResults = filtered.length === 0 && prescriptions.length > 0

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

                {loading && prescriptions.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                    </div>
                ) : showEmptyState ? (
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-4">
                        <FileText className="w-12 h-12 text-muted-foreground/50 mb-6" />
                        <h2 className="text-lg font-medium text-foreground mb-2">{t('empty.noPrescriptions')}</h2>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">{t('empty.noPrescriptionsDesc')}</p>
                        <Button onClick={() => { setEditPrescription(null); setDialogOpen(true) }}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('empty.noPrescriptionsAction')}
                        </Button>
                    </div>
                ) : showNoResults ? (
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-4">
                        <Search className="w-12 h-12 text-muted-foreground/50 mb-6" />
                        <h2 className="text-lg font-medium text-foreground mb-2">{t('common.noResults')}</h2>
                        <p className="text-sm text-muted-foreground">{t('empty.noResults')}</p>
                    </div>
                ) : (
                    <PrescriptionCards
                        prescriptions={filtered}
                        onEdit={(rx) => { setEditPrescription(rx); setDialogOpen(true) }}
                        onDelete={(rx) => setDeleteTarget(rx)}
                    />
                )}

                <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setEditPrescription(null); setDialogOpen(open) }}>
                    <DialogContent className="w-full sm:max-w-lg">
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
                                doctorId: editPrescription.doctor?.id || '',
                                dateWritten: editPrescription.dateWritten || undefined,
                            } : undefined}
                            onSubmit={editPrescription ? handleUpdate : handleCreate}
                            onCancel={() => { setEditPrescription(null); setDialogOpen(false) }}
                            saving={saving}
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
