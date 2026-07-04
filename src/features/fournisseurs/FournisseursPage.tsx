'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Search, Truck, Plus, Pencil, Trash2, Loader2, Package, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'

interface Fournisseur {
    id: string
    name: string
    phone: string
    address: string | null
    _count: { products: number }
}

interface FournisseurProduct {
    id: string
    name: string
    brand: string
    model: string
    category: string | null
    price: string
    quantity: number
    _count: { orderItems: number }
}

export function FournisseursPage() {
    const { t } = useTranslation()
    const [suppliers, setSuppliers] = useState<Fournisseur[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editSupplier, setEditSupplier] = useState<Fournisseur | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Fournisseur | null>(null)
    const [selectedSupplier, setSelectedSupplier] = useState<Fournisseur | null>(null)
    const [products, setProducts] = useState<FournisseurProduct[]>([])
    const [productsLoading, setProductsLoading] = useState(false)
    const [productsOpen, setProductsOpen] = useState(false)
    const [productFilter, setProductFilter] = useState<'all' | 'sold' | 'unsold'>('all')
    const [saving, setSaving] = useState(false)
    const [formName, setFormName] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formAddress, setFormAddress] = useState('')
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (debouncedSearch) params.set('search', debouncedSearch)
                const res = await fetch(`/api/fournisseurs?${params}`)
                if (!res.ok) throw new Error('Failed to fetch suppliers')
                setSuppliers(await res.json())
            } catch (error) {
                console.error(error)
                toast.error('Failed to load suppliers')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [debouncedSearch])

    async function reFetch() {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        const res = await fetch(`/api/fournisseurs?${params}`)
        if (res.ok) setSuppliers(await res.json())
    }

    function openForm(supplier?: Fournisseur) {
        setEditSupplier(supplier || null)
        setFormName(supplier?.name || '')
        setFormPhone(supplier?.phone || '')
        setFormAddress(supplier?.address || '')
        setDialogOpen(true)
    }

    async function handleSave() {
        if (!formName.trim()) return toast.error('Name is required')
        setSaving(true)
        try {
            const url = editSupplier ? `/api/fournisseurs/${editSupplier.id}` : '/api/fournisseurs'
            const method = editSupplier ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formName, phone: formPhone, address: formAddress }),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.error || 'Failed to save')
            }
            toast.success(editSupplier ? 'Supplier updated' : 'Supplier created')
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save supplier')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(supplier: Fournisseur) {
        try {
            const res = await fetch(`/api/fournisseurs/${supplier.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.error || 'Failed to delete')
            }
            toast.success('Supplier deleted')
            setDeleteTarget(null)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete supplier')
        }
    }

    async function showProducts(supplier: Fournisseur) {
        setSelectedSupplier(supplier)
        setProductsOpen(true)
        setProductsLoading(true)
        setProductFilter('all')
        try {
            const res = await fetch(`/api/stock?fournisseurId=${supplier.id}`)
            if (!res.ok) throw new Error('Failed to fetch products')
            setProducts(await res.json())
        } catch (error) {
            console.error(error)
            toast.error('Failed to load products')
        } finally {
            setProductsLoading(false)
        }
    }

    const filteredProducts = products.filter((p) => {
        if (productFilter === 'sold') return p._count?.orderItems > 0
        if (productFilter === 'unsold') return !p._count || p._count.orderItems === 0
        return true
    })

    const showEmptyState = !loading && suppliers.length === 0 && !debouncedSearch
    const showNoResults = !loading && suppliers.length === 0 && debouncedSearch

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('nav.fournisseurs') || 'Suppliers'}</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage suppliers and view their products</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or phone..."
                        className="pl-10"
                    />
                </div>
                <Button onClick={() => openForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : showEmptyState ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Truck className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">No suppliers yet</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">Add your first supplier to track product sourcing.</p>
                    <Button onClick={() => openForm()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Supplier
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
                                            {supplier._count.products} products
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" onClick={() => openForm(supplier)} title="Edit">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(supplier)} title="Delete">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditSupplier(null) } }}>
                <DialogContent className="w-full sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Supplier name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Phone number" />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Address" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditSupplier(null) }}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spinner" />}
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title="Delete Supplier"
                description={deleteTarget?.name || ''}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />

            <Dialog open={productsOpen} onOpenChange={setProductsOpen}>
                <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" />
                            Products from {selectedSupplier?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={productFilter} onValueChange={(v) => setProductFilter(v as 'all' | 'sold' | 'unsold')}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Products</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                                <SelectItem value="unsold">Not Sold</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground ml-auto">{filteredProducts.length} of {products.length} products</span>
                    </div>

                    {productsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No products found</p>
                    ) : (
                        <div className="border rounded-lg overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/30">
                                    <tr>
                                        <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground">Price</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground">Qty</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredProducts.map((p) => (
                                        <tr key={p.id} className="row-hover">
                                            <td className="p-3">
                                                <p className="font-medium">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.brand} / {p.model}</p>
                                            </td>
                                            <td className="p-3 text-muted-foreground">{p.category || '—'}</td>
                                            <td className="p-3 text-right font-medium">{formatCurrency(p.price)}</td>
                                            <td className="p-3 text-right">{p.quantity}</td>
                                            <td className="p-3 text-right">
                                                <Badge variant={p._count?.orderItems > 0 ? 'default' : 'secondary'}>
                                                    {p._count?.orderItems > 0 ? 'Sold' : 'In Stock'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}