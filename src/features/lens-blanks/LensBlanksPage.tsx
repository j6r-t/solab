'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Loader2, EyeOff, PackageOpen } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { LensBlankForm } from './LensBlankForm'
import { toast } from 'sonner'

interface LensBlank {
    id: string
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sphMin: string
    sphMax: string
    cylMin: string
    cylMax: string
    costPrice: string
    sellingPrice: string
    quantity: number
    fournisseur: { id: string; name: string } | null
}

interface LensBlankFormData {
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sphMin: number
    sphMax: number
    cylMin: number
    cylMax: number
    costPrice: number
    sellingPrice: number
    quantity: number
    fournisseurId?: string
}

const LENS_TYPES = ['singleVision', 'progressive', 'bifocal', 'office', 'photochromic']

export function LensBlanksPage() {
    const { t } = useTranslation()
    const [blanks, setBlanks] = useState<LensBlank[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [brandFilter, setBrandFilter] = useState('')
    const [lensTypeFilter, setLensTypeFilter] = useState('')
    const [lowStockOnly, setLowStockOnly] = useState(false)
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editBlank, setEditBlank] = useState<LensBlank | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<LensBlank | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        async function load() {
            setLoading(true)
            const params = new URLSearchParams()
            if (debouncedSearch) params.set('search', debouncedSearch)
            if (brandFilter) params.set('brand', brandFilter)
            if (lensTypeFilter) params.set('lensType', lensTypeFilter)
            if (lowStockOnly) params.set('lowStock', 'true')
            const res = await fetch(`/api/lens-blanks?${params}`)
            if (res.ok) setBlanks(await res.json())
            setLoading(false)
        }
        load()
    }, [debouncedSearch, brandFilter, lensTypeFilter, lowStockOnly])

    async function reFetch() {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (brandFilter) params.set('brand', brandFilter)
        if (lensTypeFilter) params.set('lensType', lensTypeFilter)
        if (lowStockOnly) params.set('lowStock', 'true')
        const res = await fetch(`/api/lens-blanks?${params}`)
        if (res.ok) setBlanks(await res.json())
    }

    async function handleCreate(data: LensBlankFormData) {
        setSaving(true)
        try {
            const res = await fetch('/api/lens-blanks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create')
            toast.success('Lens blank created')
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create')
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdate(data: LensBlankFormData) {
        if (!editBlank) return
        setSaving(true)
        try {
            const res = await fetch(`/api/lens-blanks/${editBlank.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to update')
            toast.success('Lens blank updated')
            setEditBlank(null)
            setDialogOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(blank: LensBlank) {
        try {
            const res = await fetch(`/api/lens-blanks/${blank.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            toast.success('Lens blank deleted')
            setDeleteTarget(null)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete')
        }
    }

    const uniqueBrands = [...new Set(blanks.map((b) => b.brand))].sort()
    const totalRefs = blanks.length
    const totalQty = blanks.reduce((s, b) => s + b.quantity, 0)
    const lowStockCount = blanks.filter((b) => b.quantity <= 3).length
    const totalValue = blanks.reduce((s, b) => s + parseFloat(b.costPrice) * b.quantity, 0)

    return (
        <div className="space-y-6 max-w-[1000px]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-medium">{t('atelier.lensBlanks')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage atelier lens blank inventory</p>
                </div>
                <Button onClick={() => { setEditBlank(null); setDialogOpen(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('atelier.purchaseBlank')}
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">References</p>
                    <p className="text-lg font-semibold mt-1">{totalRefs}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Total Qty</p>
                    <p className="text-lg font-semibold mt-1">{totalQty}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Low Stock</p>
                    <p className="text-lg font-semibold mt-1 text-destructive">{lowStockCount}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Stock Value</p>
                    <p className="text-lg font-semibold mt-1">{totalValue.toFixed(3)} TND</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by brand or thickness..." className="pl-10 h-10" />
                </div>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger className="w-[150px] h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('common.all')}</SelectItem>
                        {uniqueBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={lensTypeFilter} onValueChange={setLensTypeFilter}>
                    <SelectTrigger className="w-[150px] h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('common.all')}</SelectItem>
                        {LENS_TYPES.map((lt) => (
                            <SelectItem key={lt} value={lt}>{lt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    variant={lowStockOnly ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLowStockOnly(!lowStockOnly)}
                    className="h-10"
                >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Low stock
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : blanks.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <PackageOpen className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">No lens blanks</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">Add your first lens blank to start tracking atelier stock.</p>
                    <Button onClick={() => { setEditBlank(null); setDialogOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lens Blank
                    </Button>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/30 border-b">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('lensBlank.brand')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Material</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('lensBlank.thickness')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">SPH</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Cost</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Sell</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {blanks.map((blank) => (
                                <tr key={blank.id} className="row-hover cursor-pointer" onClick={() => { setEditBlank(blank); setDialogOpen(true) }}>
                                    <td className="py-3 px-4 font-medium">{blank.brand}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">{blank.lensType}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">{blank.material}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">{blank.thickness}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">{blank.sphMin} to {blank.sphMax}</td>
                                    <td className="py-3 px-4 text-right text-sm">{parseFloat(blank.costPrice).toFixed(3)}</td>
                                    <td className="py-3 px-4 text-right text-sm">{parseFloat(blank.sellingPrice).toFixed(3)}</td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge variant={blank.quantity <= 3 ? 'destructive' : 'secondary'} className="text-xs">
                                            {blank.quantity}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setEditBlank(null); setDialogOpen(open) }}>
                <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editBlank ? 'Edit Lens Blank' : 'New Lens Blank'}</DialogTitle>
                    </DialogHeader>
                    <LensBlankForm
                        defaultValues={editBlank ? {
                            brand: editBlank.brand,
                            lensType: editBlank.lensType,
                            material: editBlank.material,
                            coating: editBlank.coating,
                            thickness: editBlank.thickness,
                            sphMin: parseFloat(editBlank.sphMin),
                            sphMax: parseFloat(editBlank.sphMax),
                            cylMin: parseFloat(editBlank.cylMin),
                            cylMax: parseFloat(editBlank.cylMax),
                            costPrice: parseFloat(editBlank.costPrice),
                            sellingPrice: parseFloat(editBlank.sellingPrice),
                            quantity: editBlank.quantity,
                            fournisseurId: editBlank.fournisseur?.id,
                        } : undefined}
                        onSubmit={editBlank ? handleUpdate : handleCreate}
                        onCancel={() => { setEditBlank(null); setDialogOpen(false) }}
                        saving={saving}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('common.delete')}
                description={deleteTarget ? deleteTarget.brand + ' ' + deleteTarget.thickness : ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />
        </div>
    )
}
