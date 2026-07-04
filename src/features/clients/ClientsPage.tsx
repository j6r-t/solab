'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientForm } from '@/features/clients/ClientForm'
import { PrescriptionForm } from '@/features/prescriptions/PrescriptionForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, Users, Pencil, Trash2, Loader2 } from 'lucide-react'
import type { ClientFormData } from './client.schema'
import { toast } from 'sonner'
import { fetchClients, createClient, updateClient, deleteClient, type Client } from './client.api'

export function ClientsPage() {
    const { t } = useTranslation()
    const [clients, setClients] = useState<Client[]>([])
    const [search, setSearch] = useState('')
    const [genderFilter, setGenderFilter] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editClient, setEditClient] = useState<Client | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [wizardOpen, setWizardOpen] = useState(false)
    const [wizardStep, setWizardStep] = useState(1)
    const [newClientId, setNewClientId] = useState('')
    const [newClientName, setNewClientName] = useState('')
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const data = await fetchClients({ search: debouncedSearch, gender: genderFilter })
                setClients(data)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to fetch clients')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [debouncedSearch, genderFilter])

    async function reFetch() {
        const data = await fetchClients({ search: debouncedSearch, gender: genderFilter })
        setClients(data)
    }

    async function handleCreate(data: ClientFormData) {
        setSaving(true)
        try {
            await createClient(data as Record<string, unknown>)
            toast.success(t('clients.created'))
            await new Promise((r) => setTimeout(r, 1500))
            setDialogOpen(false)
            await reFetch()
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdate(data: ClientFormData) {
        if (!editClient) return
        setSaving(true)
        try {
            await updateClient(editClient.id, data as Record<string, unknown>)
            toast.success(t('clients.updated'))
            await new Promise((r) => setTimeout(r, 1500))
            setEditClient(null)
            await reFetch()
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(client: Client) {
        await deleteClient(client.id)
        setDeleteTarget(null)
        await reFetch()
        toast.success(t('clients.deleted'))
    }

    const showEmptyState = !loading && clients.length === 0 && !debouncedSearch
    const showNoResults = !loading && clients.length === 0 && debouncedSearch

    return (
        <>
            <div className="space-y-6 max-w-[900px]">
                <div>
                    <h1 className="text-[22px] font-medium">{t('clients.title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your customer information</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search clients"
                            className="pl-10 h-10"
                        />
                    </div>
                    <Button variant="outline" onClick={() => { setWizardOpen(true); setWizardStep(1); setNewClientId(''); setNewClientName('') }}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('clients.newClient')}
                    </Button>
                </div>

                {loading && clients.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                    </div>
                ) : showEmptyState ? (
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                        <Users className="w-12 h-12 text-muted-foreground/50 mb-6" />
                        <h2 className="text-lg font-medium text-foreground mb-2">No clients yet</h2>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
                            Create your first client profile to start tracking prescriptions and orders.
                            Each client can have multiple prescriptions and order history.
                        </p>
                        <Button onClick={() => { setWizardOpen(true); setWizardStep(1); setNewClientId(''); setNewClientName('') }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create first client
                        </Button>
                    </div>
                ) : showNoResults ? (
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                        <Search className="w-12 h-12 text-muted-foreground/50 mb-6" />
                        <h2 className="text-lg font-medium text-foreground mb-2">{t('common.noResults')}</h2>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {clients.map((client) => (
                            <div key={client.id} className="flex items-center justify-between p-4 rounded-lg border bg-card row-alternate row-hover">
                                <div>
                                    <p className="font-medium">{client.name} {client.familyName}</p>
                                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => { setEditClient(client); setDialogOpen(true) }}
                                        title={t('common.edit')}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeleteTarget(client)}
                                        title={t('common.delete')}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                )}

                <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditClient(null) }; setDialogOpen(open) }}>
                    <DialogContent className="w-full sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editClient ? t('common.edit') : t('clients.newClient')}</DialogTitle>
                        </DialogHeader>
                        <ClientForm
                            defaultValues={editClient ? { name: editClient.name, familyName: editClient.familyName, phone: editClient.phone, address: editClient.address || '', gender: editClient.gender || undefined } : undefined}
                            onSubmit={editClient ? handleUpdate : handleCreate}
                            onCancel={() => { setEditClient(null); setDialogOpen(false) }}
                            saving={saving}
                        />
                    </DialogContent>
                </Dialog>

                <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) { setWizardStep(1); setNewClientId('') }; setWizardOpen(open) }}>
                    <DialogContent className="w-full sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t('clients.newClient')}</DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`h-1.5 flex-1 rounded-full ${wizardStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                                <div className={`h-1.5 flex-1 rounded-full ${wizardStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                                <span className="text-xs text-muted-foreground ml-1">{wizardStep}/2</span>
                            </div>
                        </DialogHeader>
                        {wizardStep === 1 && (
                            <ClientForm
                                onSubmit={async (data) => {
                                    setSaving(true)
                                    try {
                                        const created = await createClient(data as Record<string, unknown>)
                                        setNewClientId(created.id)
                                        setNewClientName(`${created.name} ${created.familyName}`)
                                        setWizardStep(2)
                                        await reFetch()
                                    } finally {
                                        setSaving(false)
                                    }
                                }}
                                onCancel={() => { setWizardOpen(false); setWizardStep(1); setNewClientId('') }}
                                saving={saving}
                            />
                        )}
                        {wizardStep === 2 && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">{t('clients.addPrescriptionPrompt').replace('{name}', newClientName)}</p>
                                <PrescriptionForm
                                    preselectedClientId={newClientId}
                                    preselectedClientName={newClientName}
                                    onSubmit={async (data) => {
                                        setSaving(true)
                                        try {
                                            const res = await fetch('/api/prescriptions', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(data),
                                            })
                                            if (!res.ok) {
                                                const body = await res.json()
                                                throw new Error(JSON.stringify(body.error))
                                            }
                                            toast.success(t('prescriptions.created'))
                                        } finally {
                                            setSaving(false)
                                        }
                                        setWizardOpen(false)
                                        setWizardStep(1)
                                        setNewClientId('')
                                    }}
                                    onCancel={() => setWizardOpen(false)}
                                    saving={saving}
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('common.delete')}
                description={deleteTarget ? `${deleteTarget.name} ${deleteTarget.familyName}` : ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />
        </>
    )
}
