'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
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
import { Plus, Search, Package, Pencil, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ProductFormData } from '@/lib/validators'
import { toast } from 'sonner'

interface Product {
    id: string
    name: string
    brand: string
    model: string
    category: 'eyewear' | 'lens' | 'accessory' | null
    price: string
    quantity: number
    createdAt: string
}

function formatTND(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return num.toFixed(3) + ' TND'
}

function getStockStatus(quantity: number): { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof Package } {
    if (quantity === 0) return { label: 'outOfStock', variant: 'destructive', icon: Package }
    if (quantity <= 3) return { label: 'lowStock', variant: 'secondary', icon: Package }
    return { label: 'inStock', variant: 'default', icon: Package }
}

export function StockPage() {
    const { t } = useTranslation()
    const [products, setProducts] = useState<Product[]>([])
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editProduct, setEditProduct] = useState<Product | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const params = new URLSearchParams()
                if (search) params.set('search', search)
                if (category) params.set('category', category)
                const res = await fetch(`/api/stock?${params}`)
                if (res.ok) setProducts(await res.json())
            } catch (error) {
                console.error('Failed to fetch products:', error)
            }
        }
        load()
    }, [search, category])

    async function reFetch() {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (category) params.set('category', category)
        const res = await fetch(`/api/stock?${params}`)
        if (res.ok) setProducts(await res.json())
    }

    async function handleCreate(data: ProductFormData) {
        const res = await fetch('/api/stock', {
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
        toast.success(t('stock.created'))
    }

    async function handleUpdate(data: ProductFormData) {
        if (!editProduct) return
        const res = await fetch(`/api/stock/${editProduct.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        if (!res.ok) {
            const body = await res.json()
            throw new Error(JSON.stringify(body.error))
        }
        setEditProduct(null)
        await reFetch()
        toast.success(t('stock.updated'))
    }

    async function handleDelete(product: Product) {
        await fetch(`/api/stock/${product.id}`, { method: 'DELETE' })
        setDeleteTarget(null)
        await reFetch()
        toast.success(t('stock.deleted'))
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{t('stock.title')}</h1>
                    <Button onClick={() => { setEditProduct(null); setDialogOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('stock.newProduct')}
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('stock.searchPlaceholder')}
                            className="pl-10"
                        />
                    </div>
                    <Select value={category} onValueChange={(val) => setCategory(val === '__all__' ? '' : val)}>
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder={t('common.all')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">{t('common.all')}</SelectItem>
                            <SelectItem value="eyewear">{t('stock.eyewear')}</SelectItem>
                            <SelectItem value="lens">{t('stock.lens')}</SelectItem>
                            <SelectItem value="accessory">{t('stock.accessory')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 rounded-xl empty-state-gradient text-muted-foreground">
                        <Package className="h-12 w-12 mb-4 opacity-50" />
                        <p>{t('stock.noProducts')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {products.map((product) => {
                            const status = getStockStatus(product.quantity)
                            return (
                                <div key={product.id} className="flex items-center justify-between p-4 rounded-lg border bg-card row-alternate">
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">{product.brand} — {product.model}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={status.variant} className="gap-1">
                                            <status.icon className="h-3 w-3" />
                                            {t(`stock.${status.label}`)}
                                        </Badge>
                                        <div className="text-right">
                                            <p className="font-medium text-sm">{formatTND(product.price)}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {product.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditProduct(product); setDialogOpen(true) }} title={t('common.edit')}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(product)} title={t('common.delete')}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setEditProduct(null); setDialogOpen(open) }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editProduct ? t('common.edit') : t('stock.newProduct')}</DialogTitle>
                        </DialogHeader>
                        <ProductForm
                            defaultValues={editProduct ? { name: editProduct.name, brand: editProduct.brand, model: editProduct.model, category: editProduct.category || undefined, price: parseFloat(editProduct.price), quantity: editProduct.quantity } : undefined}
                            onSubmit={editProduct ? handleUpdate : handleCreate}
                            onCancel={() => { setEditProduct(null); setDialogOpen(false) }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('common.delete')}
                description={deleteTarget ? deleteTarget.name : ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />
        </>
    )
}
