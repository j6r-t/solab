'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientForm } from '@/components/clients/ClientForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, Users, Pencil, Trash2, Phone, Calendar } from 'lucide-react'
import type { ClientFormData } from '@/lib/validators'
import { toast } from 'sonner'

interface Client {
    id: string
    name: string
    familyName: string
    phone: string
    address: string | null
    gender: 'male' | 'female' | null
    createdAt: string
}

export function ClientsPage() {
    const { t } = useTranslation()
    const [clients, setClients] = useState<Client[]>([])
    const [search, setSearch] = useState('')
    const [genderFilter, setGenderFilter] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editClient, setEditClient] = useState<Client | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const params = new URLSearchParams()
                if (search) params.set('search', search)
                if (genderFilter) params.set('gender', genderFilter)
                const res = await fetch(`/api/clients?${params}`)
                if (res.ok) {
                    setClients(await res.json())
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to fetch clients')
            }
        }
        load()
    }, [search, genderFilter])

    async function reFetch() {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (genderFilter) params.set('gender', genderFilter)
        const res = await fetch(`/api/clients?${params}`)
        if (res.ok) setClients(await res.json())
    }

    async function handleCreate(data: ClientFormData) {
        const res = await fetch('/api/clients', {
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
        toast.success(t('clients.created'))
    }

    async function handleUpdate(data: ClientFormData) {
        if (!editClient) return
        const res = await fetch(`/api/clients/${editClient.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        if (!res.ok) {
            const body = await res.json()
            throw new Error(JSON.stringify(body.error))
        }
        setEditClient(null)
        await reFetch()
        toast.success(t('clients.updated'))
    }

    async function handleDelete(client: Client) {
        await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
        setDeleteTarget(null)
        await reFetch()
        toast.success(t('clients.deleted'))
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{t('clients.title')}</h1>
                    <Button onClick={() => { setEditClient(null); setDialogOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('clients.newClient')}
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('clients.searchPlaceholder')}
                            className="pl-10 h-10"
                        />
                    </div>
                    <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        className="h-10 px-3 rounded-lg border bg-background text-sm min-w-[130px]"
                    >
                        <option value="">{t('common.all')}</option>
                        <option value="male">{t('clients.male')}</option>
                        <option value="female">{t('clients.female')}</option>
                    </select>
                </div>

                {clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 rounded-xl empty-state-gradient text-muted-foreground">
                        <Users className="h-12 w-12 mb-4 opacity-50" />
                        <p>{t('clients.noClients')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {clients.map((client) => (
                            <div key={client.id} className="flex items-center justify-between p-4 rounded-lg border bg-card row-alternate">
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
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editClient ? t('common.edit') : t('clients.newClient')}</DialogTitle>
                        </DialogHeader>
                        <ClientForm
                            defaultValues={editClient ? { name: editClient.name, familyName: editClient.familyName, phone: editClient.phone, address: editClient.address || '', gender: editClient.gender || undefined } : undefined}
                            onSubmit={editClient ? handleUpdate : handleCreate}
                            onCancel={() => { setEditClient(null); setDialogOpen(false) }}
                        />
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
