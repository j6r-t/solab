'use client'

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
import { Filter, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { useTranslation } from '@/lib/hooks/useTranslation'

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

interface FournisseurProductsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplier: { id: string; name: string } | null
    products: FournisseurProduct[]
    productFilter: 'all' | 'sold' | 'unsold'
    onProductFilterChange: (value: 'all' | 'sold' | 'unsold') => void
    categoryLabel?: string
}

export function FournisseurProductsDialog({
    open,
    onOpenChange,
    supplier,
    products,
    productFilter,
    onProductFilterChange,
}: FournisseurProductsDialogProps) {
    const { t } = useTranslation()
    const filteredProducts = products.filter((p) => {
        if (productFilter === 'sold') return p._count?.orderItems > 0
        if (productFilter === 'unsold') return !p._count || p._count.orderItems === 0
        return true
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        {t('fournisseurs.productsFrom', { name: supplier?.name ?? '' })}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={productFilter} onValueChange={(v) => onProductFilterChange(v as 'all' | 'sold' | 'unsold')}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('common.filter')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('fournisseurs.allProducts')}</SelectItem>
                            <SelectItem value="sold">{t('fournisseurs.sold')}</SelectItem>
                            <SelectItem value="unsold">{t('fournisseurs.notSold')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground ml-auto">{t('fournisseurs.productsRange', { count: filteredProducts.length, total: products.length })}</span>
                </div>

                {filteredProducts.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">{t('common.noResults')}</p>
                ) : (
                    <div className="border rounded-lg overflow-x-auto overflow-y-auto max-h-[340px]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted sticky top-0 z-10">
                                    <th className="text-left p-3 font-medium text-muted-foreground">{t('reports.product')}</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">{t('stock.category')}</th>
                                    <th className="text-right p-3 font-medium text-muted-foreground">{t('stock.price')}</th>
                                    <th className="text-right p-3 font-medium text-muted-foreground">{t('reports.qty')}</th>
                                    <th className="text-right p-3 font-medium text-muted-foreground">{t('payments.status')}</th>
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
                                                {p._count?.orderItems > 0 ? t('fournisseurs.sold') : t('common.inStock')}
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
    )
}
