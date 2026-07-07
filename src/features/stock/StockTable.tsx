'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Pencil, Trash2, QrCode } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatCurrency } from '@/lib/utils/currency'
import type { StockProduct } from './stock.api'

interface StockTableProps {
    products: StockProduct[]
    onEdit: (product: StockProduct) => void
    onDelete: (product: StockProduct) => void
    onShowQr: (product: StockProduct) => void
    categoryLabel: (cat: string | null) => string
    getStockStatus: (qty: number) => { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string }
}

export function StockTable({ products, onEdit, onDelete, onShowQr, categoryLabel, getStockStatus }: StockTableProps) {
    const { t } = useTranslation()

    return (
        <div className="border rounded-xl bg-card overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-muted/30 border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('stock.name')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('stock.category')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Details</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('stock.title')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('stock.sellingPrice')}</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">QR</th>
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
                                    {product.category === 'lentille' ? (
                                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                                    ) : product.category === 'lunette' ? (
                                        <p className="text-xs text-muted-foreground">{product.brand} &mdash; Ref: {product.model}</p>
                                    ) : product.category === 'verre' ? (
                                        <p className="text-xs text-muted-foreground">{product.brand}{product.thickness ? ` (${product.thickness})` : ''}</p>
                                    ) : product.category === 'nettoyant_lentilles' || product.category === 'nettoyant_monture' ? (
                                        <p className="text-xs text-muted-foreground">{product.thickness || '—'}</p>
                                    ) : null}
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">{categoryLabel(product.category)}</td>
                                <td className="py-3 px-4 text-sm">
                                    {(product.category === 'lentille' || product.category === 'verre') ? (
                                        <div className="space-y-0.5">
                                            {product.lensType && <p className="text-xs text-muted-foreground">{t(`stock.${product.lensType}`)}</p>}
                                            {product.material && <p className="text-xs text-muted-foreground">{t(`stock.${product.material}`)}</p>}
                                            {product.coating && product.coating !== 'none' && <p className="text-xs text-muted-foreground">{t(`stock.${product.coating}`)}</p>}
                                            {(product.sph || product.cyl || product.add) && (
                                                <p className="text-xs text-muted-foreground">{product.sph && `SPH ${product.sph}`}{product.cyl && ` / CYL ${product.cyl}`}{product.add && ` / ADD ${product.add}`}</p>
                                            )}
                                            {product.costPrice && <p className="text-xs text-muted-foreground">Cost: {formatCurrency(product.costPrice)}</p>}
                                            {product.fournisseur && <p className="text-xs text-muted-foreground">Supplier: {product.fournisseur.name}</p>}
                                        </div>
                                    ) : product.category === 'lunette' ? (
                                        product.costPrice ? <p className="text-xs text-muted-foreground">Cost: {formatCurrency(product.costPrice)}</p> : <span className="text-xs text-muted-foreground">—</span>
                                    ) : product.category === 'nettoyant_lentilles' || product.category === 'nettoyant_monture' ? (
                                        <div className="space-y-0.5">{product.costPrice && <p className="text-xs text-muted-foreground">Cost: {formatCurrency(product.costPrice)}</p>}</div>
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
                                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(product.price)}</td>
                                <td className="py-3 px-4 text-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onShowQr(product)} title={t('stock.qrCode')}>
                                        <QrCode className="h-4 w-4" />
                                    </Button>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(product)} title={t('common.edit')}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onDelete(product)} title={t('common.delete')}>
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
    )
}
