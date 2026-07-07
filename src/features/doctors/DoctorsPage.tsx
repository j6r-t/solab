'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DoctorFormDialog } from './DoctorFormDialog'
import { DoctorPatientsDialog } from './DoctorPatientsDialog'
import { Search, Stethoscope, Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Doctor {
    id: string
    name: string
    phone: string
    address: string | null
    specialization: string | null
    _count: { prescriptions: number }
}

export function DoctorsPage() {
    const { t } = useTranslation()
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editDoctor, setEditDoctor] = useState<Doctor | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null)
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [patients, setPatients] = useState<{ id: string; client: { name: string; familyName: string; phone: string }; createdAt: string }[]>([])
    const [patientsLoading, setPatientsLoading] = useState(false)
    const [patientsOpen, setPatientsOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formName, setFormName] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formAddress, setFormAddress] = useState('')
    const [formSpecialization, setFormSpecialization] = useState('')
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (debouncedSearch) params.set('search', debouncedSearch)
                const res = await fetch(`/api/doctors?${params}`)
                if (!res.ok) throw new Error('Failed to fetch doctors')
                setDoctors(await res.json())
            } catch (error) {
                console.error(error)
                toast.error('Failed to load doctors')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [debouncedSearch])

    async function reFetch() {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        const res = await fetch(`/api/doctors?${params}`)
        if (res.ok) setDoctors(await res.json())
    }

    function openForm(doctor?: Doctor) {
        setEditDoctor(doctor || null)
        setFormName(doctor?.name || '')
        setFormPhone(doctor?.phone || '')
        setFormAddress(doctor?.address || '')
        setFormSpecialization(doctor?.specialization || '')
        setDialogOpen(true)
    }

    async function handleSave() {
        if (!formName.trim()) return toast.error('Name is required')
        setSaving(true)
        try {
            const url = editDoctor ? `/api/doctors/${editDoctor.id}` : '/api/doctors'
            const method = editDoctor ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formName, phone: formPhone, address: formAddress, specialization: formSpecialization }),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.error || 'Failed to save')
            }
            toast.success(editDoctor ? 'Doctor updated' : 'Doctor created')
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save doctor')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(doctor: Doctor) {
        try {
            const res = await fetch(`/api/doctors/${doctor.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.error || 'Failed to delete')
            }
            toast.success('Doctor deleted')
            setDeleteTarget(null)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete doctor')
        }
    }

    async function showPatients(doctor: Doctor) {
        setSelectedDoctor(doctor)
        setPatientsOpen(true)
        setPatientsLoading(true)
        try {
            const res = await fetch(`/api/prescriptions?doctorId=${doctor.id}&includeClient=true`)
            if (!res.ok) throw new Error('Failed to fetch patients')
            const data = await res.json()
            setPatients(data.map((p: { id: string; client: { name: string; familyName: string; phone: string }; createdAt: string }) => ({
                id: p.id,
                client: p.client,
                createdAt: p.createdAt,
            })))
        } catch (error) {
            console.error(error)
            toast.error('Failed to load patients')
        } finally {
            setPatientsLoading(false)
        }
    }

    const showEmptyState = !loading && doctors.length === 0 && !debouncedSearch
    const showNoResults = !loading && doctors.length === 0 && debouncedSearch

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('nav.doctors') || 'Doctors'}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('doctors.description')}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, phone or specialization..."
                        className="pl-10"
                    />
                </div>
                <Button onClick={() => openForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Doctor
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : showEmptyState ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Stethoscope className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">No doctors yet</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">Add your first doctor to link them with patient prescriptions.</p>
                    <Button onClick={() => openForm()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Doctor
                    </Button>
                </div>
            ) : showNoResults ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('common.noResults')}</h2>
                </div>
            ) : (
                <div className="space-y-2">
                    {doctors.map((doctor) => (
                        <div
                            key={doctor.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => showPatients(doctor)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Stethoscope className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{doctor.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                        <span>{doctor.phone}</span>
                                        {doctor.specialization && <span className="text-primary">&#183; {doctor.specialization}</span>}
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                            <Users className="h-3 w-3 mr-0.5" />
                                            {doctor._count.prescriptions}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" onClick={() => openForm(doctor)} title="Edit">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(doctor)} title="Delete">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <DoctorFormDialog
                open={dialogOpen}
                onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditDoctor(null) }}}
                editingDoctor={editDoctor}
                formName={formName}
                onFormNameChange={setFormName}
                formPhone={formPhone}
                onFormPhoneChange={setFormPhone}
                formSpecialization={formSpecialization}
                onFormSpecializationChange={setFormSpecialization}
                formAddress={formAddress}
                onFormAddressChange={setFormAddress}
                onSave={handleSave}
                saving={saving}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title="Delete Doctor"
                description={deleteTarget?.name || ''}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />

            <DoctorPatientsDialog
                open={patientsOpen}
                onOpenChange={setPatientsOpen}
                doctor={selectedDoctor}
                patients={patients}
            />
        </div>
    )
}
