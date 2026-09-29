'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Search, Store, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useOpticianShops, useDeleteOpticianShop } from './useOpticianShops'

interface OpticianShop {
    id: string
    name: string
    phone: string
    address: string | null
    notes: string | null
    createdAt: string
}

export function OpticianShopsPage() {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editShop, setEditShop] = useState<OpticianShop | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<OpticianShop | null>(null)
    const [saving, setSaving] = useState(false)
    const [formName, setFormName] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formAddress, setFormAddress] = useState('')
    const [formNotes, setFormNotes] = useState('')
    const debouncedSearch = useDebounce(search, 300)

    const { data: shopsData, isLoading: loading, refetch: reFetch } = useOpticianShops({ search: debouncedSearch || undefined })
    const shops = shopsData ?? []
    const deleteShopMutation = useDeleteOpticianShop()

    function openForm(shop?: OpticianShop) {
        setEditShop(shop || null)
        setFormName(shop?.name || '')
        setFormPhone(shop?.phone || '')
        setFormAddress(shop?.address || '')
        setFormNotes(shop?.notes || '')
        setDialogOpen(true)
    }

    async function handleSave() {
        if (!formName.trim()) return toast.error(t('opticianShops.nameRequired'))
        if (!formPhone.trim()) return toast.error(t('opticianShops.phoneRequired'))
        setSaving(true)
        try {
            const url = editShop ? `/api/optician-shops/${editShop.id}` : '/api/optician-shops'
            const method = editShop ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    phone: formPhone,
                    address: formAddress || null,
                    notes: formNotes || null,
                }),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.message || t('common.saveFailed'))
            }
            toast.success(editShop ? t('opticianShops.updated') : t('opticianShops.created'))
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('common.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(shop: OpticianShop) {
        try {
            await deleteShopMutation.mutateAsync(shop.id)
            toast.success(t('opticianShops.deleted'))
            setDeleteTarget(null)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('common.deleteFailed'))
        }
    }

    const showEmptyState = !loading && shops.length === 0 && !debouncedSearch
    const showNoResults = !loading && shops.length === 0 && debouncedSearch

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('nav.opticianShops')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('opticianShops.description')}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('opticianShops.searchPlaceholder')}
                        className="pl-10"
                    />
                </div>
                <Button onClick={() => openForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('opticianShops.newShop')}
                </Button>
            </div>

            {loading ? (
                <ListSkeleton />
            ) : showEmptyState ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Store className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('opticianShops.noShops')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">{t('opticianShops.noShopsDesc')}</p>
                    <Button onClick={() => openForm()}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('opticianShops.newShop')}
                    </Button>
                </div>
            ) : showNoResults ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('common.noResults')}</h2>
                </div>
            ) : (
                <div className="space-y-2">
                    {shops.map((shop) => (
                        <div
                            key={shop.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Store className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{shop.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                        <span>{shop.phone}</span>
                                        {shop.address && <span className="truncate max-w-[200px]">{shop.address}</span>}
                                    </div>
                                    {shop.notes && (
                                        <p className="text-xs text-muted-foreground mt-0.5 italic truncate max-w-[400px]">{shop.notes}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => openForm(shop)} title={t('common.edit')}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(shop)} title={t('common.delete')}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditShop(null) } }}>
                <DialogContent className="w-full sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editShop ? t('opticianShops.editShop') : t('opticianShops.newShop')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('opticianShops.name')} *</Label>
                            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Shop name" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('opticianShops.phone')} *</Label>
                            <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Phone number" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('opticianShops.address')}</Label>
                            <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Address" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('opticianShops.notes')}</Label>
                            <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notes" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditShop(null) }}>{t('common.cancel')}</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spinner" />}
                                {t('common.save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('opticianShops.deleteTitle')}
                description={deleteTarget?.name || ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />
        </div>
    )
}
