'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FournisseurFormDialog } from './FournisseurFormDialog'
import { FournisseurProductsDialog } from './FournisseurProductsDialog'
import { ExportButton } from '@/components/ui/export-button'
import { Search, Truck, Plus, Pencil, Trash2, Package } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { useFournisseurs, useDeleteFournisseur } from './useFournisseurs'
import type { PaginatedResponse } from '@/lib/api/pagination'

interface Fournisseur {
    id: string
    name: string
    phone: string
    address: string | null
    email: string | null
    taxId: string | null
    entity?: string
    _count: { products: number }
}

interface FournisseurProduct {
    id: string
    name: string
    brand: string
    model: string
    category: string | null
    price: string
    priceAfterTax: string | null
    quantity: number
    _count: { orderItems: number }
}

export function FournisseursPage() {
    const { t } = useTranslation()
    const { user } = useAuthStore()
    const entity = user?.role === 'atelier' ? 'atelier' : 'shop'
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editSupplier, setEditSupplier] = useState<Fournisseur | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Fournisseur | null>(null)
    const [selectedSupplier, setSelectedSupplier] = useState<Fournisseur | null>(null)
    const [products, setProducts] = useState<FournisseurProduct[]>([])
    const [, setProductsLoading] = useState(false)
    const [productsOpen, setProductsOpen] = useState(false)
    const [productFilter, setProductFilter] = useState<'all' | 'sold' | 'unsold'>('all')
    const [saving, setSaving] = useState(false)
    const [formName, setFormName] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formAddress, setFormAddress] = useState('')
    const [formEmail, setFormEmail] = useState('')
    const [formTaxId, setFormTaxId] = useState('')
    const debouncedSearch = useDebounce(search, 300)

    const { data: suppliersData, isLoading: loading, refetch: reFetch } = useFournisseurs({ search: debouncedSearch || undefined, entity })
    const suppliers = suppliersData ?? []
    const deleteFournisseurMutation = useDeleteFournisseur()

    function openForm(supplier?: Fournisseur) {
        setEditSupplier(supplier || null)
        setFormName(supplier?.name || '')
        setFormPhone(supplier?.phone || '')
        setFormAddress(supplier?.address || '')
        setFormEmail(supplier?.email || '')
        setFormTaxId(supplier?.taxId || '')
        setDialogOpen(true)
    }

    async function handleSave() {
        if (!formName.trim()) return toast.error(t('fournisseurs.nameRequired'))
        setSaving(true)
        try {
            const url = editSupplier ? `/api/fournisseurs/${editSupplier.id}` : '/api/fournisseurs'
            const method = editSupplier ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formName, phone: formPhone, address: formAddress, email: formEmail || null, taxId: formTaxId || null, entity }),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.error || t('common.saveFailed'))
            }
            toast.success(editSupplier ? t('fournisseurs.updated') : t('fournisseurs.created'))
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('fournisseurs.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(supplier: Fournisseur) {
        try {
            await deleteFournisseurMutation.mutateAsync(supplier.id)
            toast.success(t('fournisseurs.deleted'))
            setDeleteTarget(null)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('fournisseurs.deleteFailed'))
        }
    }

    async function showProducts(supplier: Fournisseur) {
        setSelectedSupplier(supplier)
        setProductsOpen(true)
        setProductsLoading(true)
        setProductFilter('all')
        try {
            const res = await fetch(`/api/stock?fournisseurId=${supplier.id}`)
            if (!res.ok) throw new Error(t('fournisseurs.productsLoadFailed'))
            const json: PaginatedResponse<FournisseurProduct> | FournisseurProduct[] = await res.json()
            setProducts(Array.isArray(json) ? json : (json?.data ?? []))
        } catch (error) {
            console.error(error)
            toast.error(t('fournisseurs.productsLoadFailed'))
        } finally {
            setProductsLoading(false)
        }
    }

    const showEmptyState = !loading && suppliers.length === 0 && !debouncedSearch
    const showNoResults = !loading && suppliers.length === 0 && debouncedSearch

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('nav.fournisseurs')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('fournisseurs.description')}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('fournisseurs.searchPlaceholder')}
                        className="pl-10"
                    />
                </div>
                <ExportButton url="/api/export/fournisseurs" />
                <Button onClick={() => openForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('fournisseurs.newSupplier')}
                </Button>
            </div>

            {loading ? (
                <ListSkeleton />
            ) : showEmptyState ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Truck className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('fournisseurs.noSuppliers')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">{t('fournisseurs.noSuppliersDesc')}</p>
                    <Button onClick={() => openForm()}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('fournisseurs.newSupplier')}
                    </Button>
                </div>
            ) : showNoResults ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('common.noResults')}</h2>
                </div>
            ) : (
                <div className="space-y-2">
                    {suppliers.map((supplier) => (
                        <div
                            key={supplier.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => showProducts(supplier)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Truck className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{supplier.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                        <span>{supplier.phone}</span>
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                            <Package className="h-3 w-3 mr-0.5" />
                                            {t('fournisseurs.productsCount', { n: supplier._count.products })}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" onClick={() => openForm(supplier)} title={t('common.edit')}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(supplier)} title={t('common.delete')}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <FournisseurFormDialog
                open={dialogOpen}
                onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditSupplier(null) }}}
                editingSupplier={editSupplier}
                formName={formName}
                onFormNameChange={setFormName}
                formPhone={formPhone}
                onFormPhoneChange={setFormPhone}
                formAddress={formAddress}
                onFormAddressChange={setFormAddress}
                formEmail={formEmail}
                onFormEmailChange={setFormEmail}
                formTaxId={formTaxId}
                onFormTaxIdChange={setFormTaxId}
                onSave={handleSave}
                saving={saving}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('fournisseurs.deleteTitle')}
                description={deleteTarget?.name || ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />

            <FournisseurProductsDialog
                open={productsOpen}
                onOpenChange={setProductsOpen}
                supplier={selectedSupplier}
                products={products}
                productFilter={productFilter}
                onProductFilterChange={setProductFilter}
            />
        </div>
    )
}
