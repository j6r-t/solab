'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from './ProductForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
import { Plus, Search, Package, Pencil, Trash2, Loader2, Box } from 'lucide-react'
import type { ProductFormData } from '@/lib/validators'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

interface Product {
    id: string
    name: string
    brand: string
    model: string
    category: 'eyewear' | 'lens' | 'accessory' | null
    price: string
    quantity: number
    lensType: string | null
    material: string | null
    coating: string | null
    sph: string | null
    cyl: string | null
    add: string | null
    createdAt: string
}

function getStockStatus(quantity: number): { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string } {
    if (quantity === 0) return { label: 'outOfStock', variant: 'destructive', className: 'bg-status-pending text-status-pending border-status-pending' }
    if (quantity <= 3) return { label: 'lowStock', variant: 'secondary', className: 'bg-status-pending text-status-pending border-status-pending' }
    return { label: 'inStock', variant: 'default', className: 'bg-status-ready text-status-ready border-status-ready' }
}

export function StockPage() {
    const { t } = useTranslation()
    const [products, setProducts] = useState<Product[]>([])
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editProduct, setEditProduct] = useState<Product | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (debouncedSearch) params.set('search', debouncedSearch)
                if (category) params.set('category', category)
                const res = await fetch(`/api/stock?${params}`)
                if (res.ok) setProducts(await res.json())
            } catch (error) {
                console.error('Failed to fetch products:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [debouncedSearch, category])

    async function reFetch() {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (category) params.set('category', category)
        const res = await fetch(`/api/stock?${params}`)
        if (res.ok) setProducts(await res.json())
    }

    async function handleCreate(data: ProductFormData) {
        setSaving(true)
        try {
            const res = await fetch('/api/stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(JSON.stringify(body.error))
            }
            toast.success(t('stock.created'))
            await delay(1500)
            setDialogOpen(false)
            await reFetch()
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdate(data: ProductFormData) {
        if (!editProduct) return
        setSaving(true)
        try {
            const res = await fetch(`/api/stock/${editProduct.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(JSON.stringify(body.error))
            }
            toast.success(t('stock.updated'))
            await delay(1500)
            setEditProduct(null)
            await reFetch()
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(product: Product) {
        await fetch(`/api/stock/${product.id}`, { method: 'DELETE' })
        setDeleteTarget(null)
        await reFetch()
        toast.success(t('stock.deleted'))
    }

    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    const categoryLabel = (cat: string | null) => {
        if (!cat) return '—'
        return t(`stock.${cat}`)
    }

    const showEmptyState = !loading && products.length === 0 && !debouncedSearch
    const showNoResults = !loading && products.length === 0 && debouncedSearch

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('stock.title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">Track inventory and manage products</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products by name, brand or model..."
                        className="pl-10 h-10"
                    />
                </div>
                <Select value={category} onValueChange={(val) => setCategory(val === '__all__' ? '' : val)}>
                    <SelectTrigger className="w-full sm:w-44 h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">{t('common.all')}</SelectItem>
                        <SelectItem value="eyewear">{t('stock.eyewear')}</SelectItem>
                        <SelectItem value="lens">{t('stock.lens')}</SelectItem>
                        <SelectItem value="accessory">{t('stock.accessory')}</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={() => { setEditProduct(null); setDialogOpen(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('stock.newProduct')}
                </Button>
            </div>

            {loading && products.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : showEmptyState ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Box className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('empty.noProducts')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">{t('empty.noProductsDesc')}</p>
                    <Button onClick={() => { setEditProduct(null); setDialogOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('empty.noProductsAction')}
                    </Button>
                </div>
            ) : showNoResults ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('common.noResults')}</h2>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/30 border-b">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('stock.name')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('stock.category')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Details</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('stock.title')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('stock.price')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {products.map((product) => {
                                const status = getStockStatus(product.quantity)
                                return (
                                    <tr key={product.id} className="row-hover">
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-foreground">{product.name}</p>
                                            {product.category === 'lens' ? (
                                                <p className="text-xs text-muted-foreground">{product.brand}</p>
                                            ) : product.category === 'eyewear' ? (
                                                <p className="text-xs text-muted-foreground">{product.brand} — {product.model}</p>
                                            ) : null}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {categoryLabel(product.category)}
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {product.category === 'lens' ? (
                                                <div className="space-y-0.5">
                                                    {product.lensType && <p className="text-xs text-muted-foreground">{t(`stock.${product.lensType}`)}</p>}
                                                    {product.material && <p className="text-xs text-muted-foreground">{t(`stock.${product.material}`)}</p>}
                                                    {product.coating && product.coating !== 'none' && <p className="text-xs text-muted-foreground">{t(`stock.${product.coating}`)}</p>}
                                                    {(product.sph || product.cyl || product.add) && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {product.sph && `SPH ${product.sph}`}{product.cyl && ` / CYL ${product.cyl}`}{product.add && ` / ADD ${product.add}`}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={status.variant} className={`${status.className} gap-1 text-xs`}>
                                                    <Package className="h-3 w-3" />
                                                    {t(`stock.${status.label}`)}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">Qty: {product.quantity}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditProduct(product); setDialogOpen(true) }} title={t('common.edit')}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(product)} title={t('common.delete')}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setEditProduct(null); setDialogOpen(open) }}>
                <DialogContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editProduct ? t('common.edit') : t('stock.newProduct')}</DialogTitle>
                    </DialogHeader>
                    <ProductForm
                        defaultValues={editProduct ? { name: editProduct.name, brand: editProduct.brand, model: editProduct.model, category: editProduct.category || undefined, price: parseFloat(editProduct.price), quantity: editProduct.quantity, lensType: editProduct.lensType as ProductFormData['lensType'], material: editProduct.material as ProductFormData['material'], coating: editProduct.coating as ProductFormData['coating'], sph: editProduct.sph ? parseFloat(editProduct.sph) : undefined, cyl: editProduct.cyl ? parseFloat(editProduct.cyl) : undefined, add: editProduct.add ? parseFloat(editProduct.add) : undefined } : undefined}
                        onSubmit={editProduct ? handleUpdate : handleCreate}
                        onCancel={() => { setEditProduct(null); setDialogOpen(false) }}
                        saving={saving}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('common.delete')}
                description={deleteTarget ? deleteTarget.name : ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />
        </div>
    )
}
