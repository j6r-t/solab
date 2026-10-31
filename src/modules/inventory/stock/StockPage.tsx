'use client'

import { useState, useEffect } from 'react'
import { useStockProducts } from './useStock'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Box, Search } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/skeleton'
import { ProductForm } from './ProductForm'
import { StockFilters } from './StockFilters'
import { StockTable } from './StockTable'
import { StockQrDialog } from './StockQrDialog'
import type { ProductFormData } from './stock.schema'
import { createStockProduct, updateStockProduct, deleteStockProduct } from './stock.api'
import { fetchFournisseurs } from '@/modules/partners/fournisseurs/fournisseurs.api'
import { useAuthStore } from '@/stores/auth-store'
import type { StockProduct as Product } from './stock.api'
import { toast } from 'sonner'
import { LOW_STOCK_MAX_QTY } from '@/lib/constants/kpi'

function getStockStatus(quantity: number): { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string } {
    if (quantity === 0) return { label: 'outOfStock', variant: 'destructive', className: 'bg-status-pending text-status-pending border-status-pending' }
    if (quantity <= LOW_STOCK_MAX_QTY) return { label: 'lowStock', variant: 'secondary', className: 'bg-status-pending text-status-pending border-status-pending' }
    return { label: 'inStock', variant: 'default', className: 'bg-status-ready text-status-ready border-status-ready' }
}

export function StockPage() {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const [stockStatus, setStockStatus] = useState('')
    const [brandFilter, setBrandFilter] = useState('')
    const [lensTypeFilter, setLensTypeFilter] = useState('')
    const [materialFilter, setMaterialFilter] = useState('')
    const [coatingFilter, setCoatingFilter] = useState('')
    const [thicknessFilter, setThicknessFilter] = useState('')
    const [sphFrom, setSphFrom] = useState('')
    const [sphTo, setSphTo] = useState('')
    const [cylFrom, setCylFrom] = useState('')
    const [cylTo, setCylTo] = useState('')
    const [addFrom, setAddFrom] = useState('')
    const [addTo, setAddTo] = useState('')
    const [fournisseurFilter, setFournisseurFilter] = useState('')
    const [fournisseurs, setFournisseurs] = useState<{ id: string; name: string }[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editProduct, setEditProduct] = useState<Product | null>(null)
    const [qrProduct, setQrProduct] = useState<Product | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
    const [saving, setSaving] = useState(false)
    const debouncedSearch = useDebounce(search, 300)
    const user = useAuthStore((s) => s.user)

    const filterParams = {
        search: debouncedSearch || undefined,
        category: category || undefined,
        stockStatus: stockStatus || undefined,
        brand: brandFilter || undefined,
        lensType: lensTypeFilter || undefined,
        material: materialFilter || undefined,
        coating: coatingFilter || undefined,
        thickness: thicknessFilter || undefined,
        sphFrom: sphFrom || undefined,
        sphTo: sphTo || undefined,
        cylFrom: cylFrom || undefined,
        cylTo: cylTo || undefined,
        addFrom: addFrom || undefined,
        addTo: addTo || undefined,
        fournisseurId: fournisseurFilter || undefined,
        excludeCategory: user?.role === 'shop' ? 'verre' : undefined,
    }

    useEffect(() => {
        fetchFournisseurs().then((data) => setFournisseurs(data || [])).catch(() => {})
    }, [])

    const { data: productsData, isLoading: loading, refetch: reFetch } = useStockProducts(filterParams)
    const products = productsData ?? []

    async function handleCreate(data: ProductFormData) {
        setSaving(true)
        try {
            await createStockProduct(data)
            toast.success(t('stock.created'))
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create product')
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdate(data: ProductFormData) {
        if (!editProduct) return
        setSaving(true)
        try {
            await updateStockProduct(editProduct.id, data)
            toast.success(t('stock.updated'))
            setEditProduct(null)
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update product')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(product: Product) {
        try {
            await deleteStockProduct(product.id)
            toast.success(t('stock.deleted'))
            setDeleteTarget(null)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete product')
        }
    }

    const categoryLabel = (cat: string | null) => (cat ? t(`stock.${cat}`) : '—')

    const showEmptyState = !loading && products.length === 0 && !debouncedSearch
    const showNoResults = !loading && products.length === 0 && debouncedSearch

    return (
        <div className="space-y-6 max-w-[1000px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('stock.title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('stock.description')}</p>
            </div>

            <StockFilters
                search={search} onSearchChange={setSearch}
                category={category} onCategoryChange={setCategory}
                stockStatus={stockStatus} onStockStatusChange={setStockStatus}
                brandFilter={brandFilter} onBrandFilterChange={setBrandFilter}
                lensTypeFilter={lensTypeFilter} onLensTypeFilterChange={setLensTypeFilter}
                materialFilter={materialFilter} onMaterialFilterChange={setMaterialFilter}
                coatingFilter={coatingFilter} onCoatingFilterChange={setCoatingFilter}
                thicknessFilter={thicknessFilter} onThicknessFilterChange={setThicknessFilter}
                sphFrom={sphFrom} onSphFromChange={setSphFrom}
                sphTo={sphTo} onSphToChange={setSphTo}
                cylFrom={cylFrom} onCylFromChange={setCylFrom}
                cylTo={cylTo} onCylToChange={setCylTo}
                addFrom={addFrom} onAddFromChange={setAddFrom}
                addTo={addTo} onAddToChange={setAddTo}
                fournisseurFilter={fournisseurFilter} onFournisseurFilterChange={setFournisseurFilter}
                fournisseurs={fournisseurs}
                onNewProduct={() => { setEditProduct(null); setDialogOpen(true) }}
                role={user?.role}
            />

            {loading && products.length === 0 ? (
                <ListSkeleton />
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
                <StockTable
                    products={products}
                    onEdit={(p) => { setEditProduct(p); setDialogOpen(true) }}
                    onDelete={setDeleteTarget}
                    onShowQr={setQrProduct}
                    categoryLabel={categoryLabel}
                    getStockStatus={getStockStatus}
                />
            )}

            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setEditProduct(null); setDialogOpen(open) }}>
                <DialogContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editProduct ? t('common.edit') : t('stock.newProduct')}</DialogTitle>
                    </DialogHeader>
                    <ProductForm
                        defaultValues={editProduct ? {
                            name: editProduct.name, brand: editProduct.brand, model: editProduct.model,
                            category: (editProduct.category || undefined) as ProductFormData['category'],
                            price: parseFloat(editProduct.price),
                            priceAfterTax: editProduct.priceAfterTax != null ? parseFloat(editProduct.priceAfterTax) : undefined,
                            costPrice: editProduct.costPrice != null ? parseFloat(editProduct.costPrice) : undefined,
                            quantity: editProduct.quantity,
                            thickness: editProduct.thickness || undefined,
                            lensType: editProduct.lensType as ProductFormData['lensType'],
                            material: editProduct.material as ProductFormData['material'],
                            coating: editProduct.coating as ProductFormData['coating'],
                            sph: editProduct.sph != null ? parseFloat(editProduct.sph) : undefined,
                            cyl: editProduct.cyl != null ? parseFloat(editProduct.cyl) : undefined,
                            add: editProduct.add != null ? parseFloat(editProduct.add) : undefined,
                            fournisseurId: editProduct.fournisseur?.id || undefined,
                        } : undefined}
                        onSubmit={editProduct ? handleUpdate : handleCreate}
                        onCancel={() => { setEditProduct(null); setDialogOpen(false) }}
                        saving={saving}
                        role={user?.role}
                    />
                </DialogContent>
            </Dialog>

            <StockQrDialog product={qrProduct} onClose={() => setQrProduct(null)} />

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
