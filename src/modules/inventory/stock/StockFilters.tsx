'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ExportButton } from '@/components/ui/export-button'
import { Search, Plus } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface StockFiltersProps {
    search: string
    onSearchChange: (v: string) => void
    category: string
    onCategoryChange: (v: string) => void
    stockStatus: string
    onStockStatusChange: (v: string) => void
    brandFilter: string
    onBrandFilterChange: (v: string) => void
    lensTypeFilter: string
    onLensTypeFilterChange: (v: string) => void
    materialFilter: string
    onMaterialFilterChange: (v: string) => void
    coatingFilter: string
    onCoatingFilterChange: (v: string) => void
    thicknessFilter: string
    onThicknessFilterChange: (v: string) => void
    sphFrom: string
    onSphFromChange: (v: string) => void
    sphTo: string
    onSphToChange: (v: string) => void
    cylFrom: string
    onCylFromChange: (v: string) => void
    cylTo: string
    onCylToChange: (v: string) => void
    addFrom: string
    onAddFromChange: (v: string) => void
    addTo: string
    onAddToChange: (v: string) => void
    fournisseurFilter: string
    onFournisseurFilterChange: (v: string) => void
    fournisseurs: { id: string; name: string }[]
    onNewProduct: () => void
    role?: string
}

export function StockFilters(props: StockFiltersProps) {
    const { t } = useTranslation()
    const { search, onSearchChange, category, onCategoryChange, stockStatus, onStockStatusChange, category: cat, role } = props
    const isShop = role === 'shop'

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search products by name, brand or model..." className="pl-10 h-10" />
                </div>
                <Select value={category} onValueChange={(val) => onCategoryChange(val === '__all__' ? '' : val)}>
                    <SelectTrigger className="w-full sm:w-44 h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">{t('common.all')}</SelectItem>
                        <SelectItem value="lunette">{t('stock.lunette')}</SelectItem>
                        <SelectItem value="lentille">{t('stock.lentille')}</SelectItem>
                        {!isShop && <SelectItem value="verre">{t('stock.verre')}</SelectItem>}
                        <SelectItem value="accessory">{t('stock.accessory')}</SelectItem>
                        <SelectItem value="nettoyant_lentilles">{t('stock.nettoyant_lentilles')}</SelectItem>
                        <SelectItem value="nettoyant_monture">{t('stock.nettoyant_monture')}</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={stockStatus} onValueChange={onStockStatusChange}>
                    <SelectTrigger className="w-full sm:w-40 h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('common.all')}</SelectItem>
                        <SelectItem value="inStock">{t('stock.inStock')}</SelectItem>
                        <SelectItem value="lowStock">{t('stock.lowStock')}</SelectItem>
                        <SelectItem value="outOfStock">{t('stock.outOfStock')}</SelectItem>
                    </SelectContent>
                </Select>
                <ExportButton url="/api/export/products" />
                <Button className="w-full sm:w-auto" onClick={props.onNewProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('stock.newProduct')}
                </Button>
            </div>

            {cat === 'verre' ? (
                <div className="space-y-3 rounded-lg border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('stock.lensType')}</p>
                    <div className="flex flex-wrap gap-3">
                        <Select value={props.lensTypeFilter} onValueChange={props.onLensTypeFilterChange}>
                            <SelectTrigger className="w-full sm:w-40 h-9">
                                <SelectValue placeholder={t('stock.lensType')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">{t('common.all')}</SelectItem>
                                <SelectItem value="singleVision">{t('stock.singleVision')}</SelectItem>
                                <SelectItem value="progressive">{t('stock.progressive')}</SelectItem>
                                <SelectItem value="bifocal">{t('stock.bifocal')}</SelectItem>
                                <SelectItem value="office">{t('stock.office')}</SelectItem>
                                <SelectItem value="photochromic">{t('stock.photochromic')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={props.materialFilter} onValueChange={props.onMaterialFilterChange}>
                            <SelectTrigger className="w-full sm:w-36 h-9"><SelectValue placeholder={t('stock.material')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">{t('common.all')}</SelectItem>
                                <SelectItem value="cr39">{t('stock.cr39')}</SelectItem>
                                <SelectItem value="polycarbonate">{t('stock.polycarbonate')}</SelectItem>
                                <SelectItem value="highIndex">{t('stock.highIndex')}</SelectItem>
                                <SelectItem value="trivex">{t('stock.trivex')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={props.coatingFilter} onValueChange={props.onCoatingFilterChange}>
                            <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue placeholder={t('stock.coating')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">{t('common.all')}</SelectItem>
                                <SelectItem value="none">{t('stock.none')}</SelectItem>
                                <SelectItem value="ar">{t('stock.ar')}</SelectItem>
                                <SelectItem value="scratchResistant">{t('stock.scratchResistant')}</SelectItem>
                                <SelectItem value="blueBlock">{t('stock.blueBlock')}</SelectItem>
                                <SelectItem value="arScratch">{t('stock.arScratch')}</SelectItem>
                                <SelectItem value="arBlueBlock">{t('stock.arBlueBlock')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input value={props.thicknessFilter} onChange={(e) => props.onThicknessFilterChange(e.target.value)} placeholder={t('stock.thickness')} className="w-full sm:w-28 h-9 text-sm" />
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <RangeInput label={t('stock.sph')} from={props.sphFrom} onFromChange={props.onSphFromChange} to={props.sphTo} onToChange={props.onSphToChange} />
                        <RangeInput label={t('stock.cyl')} from={props.cylFrom} onFromChange={props.onCylFromChange} to={props.cylTo} onToChange={props.onCylToChange} />
                        <RangeInput label={t('stock.add')} from={props.addFrom} onFromChange={props.onAddFromChange} to={props.addTo} onToChange={props.onAddToChange} />
                        <Select value={props.fournisseurFilter} onValueChange={props.onFournisseurFilterChange}>
                            <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue placeholder={t('stock.fournisseur')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">{t('common.all')}</SelectItem>
                                {props.fournisseurs.map((f) => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input value={props.brandFilter} onChange={(e) => props.onBrandFilterChange(e.target.value)} placeholder={t('stock.brand')} className="flex-1 h-9 text-sm" />
                    <Select value={props.fournisseurFilter} onValueChange={props.onFournisseurFilterChange}>
                        <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue placeholder={t('stock.fournisseur')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{t('common.all')}</SelectItem>
                            {props.fournisseurs.map((f) => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </>
    )
}

function RangeInput({ label, from, onFromChange, to, onToChange }: { label: string; from: string; onFromChange: (v: string) => void; to: string; onToChange: (v: string) => void }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0 w-7">{label}</span>
            <Input value={from} onChange={(e) => onFromChange(e.target.value)} placeholder="All" className="w-20 h-9 text-sm" />
            <span className="text-xs text-muted-foreground">—</span>
            <Input value={to} onChange={(e) => onToChange(e.target.value)} placeholder="All" className="w-20 h-9 text-sm" />
        </div>
    )
}
