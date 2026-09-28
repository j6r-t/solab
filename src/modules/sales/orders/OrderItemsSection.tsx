'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { Button } from '@/components/ui/button'
import { Package, QrCode, Trash2 } from 'lucide-react'
import type { OrderItemInput, Product } from './order-form.types'

interface OrderItemsSectionProps {
    products: Product[]
    items: OrderItemInput[]
    user: { role?: string } | null
    onAddProduct: (product: Product) => void
    onUpdateItem: (index: number, field: keyof OrderItemInput, value: number) => void
    onRemoveItem: (index: number) => void
    onScanOpen: () => void
    t: (key: string) => string
}

export function OrderItemsSection({ products, items, user, onAddProduct, onUpdateItem, onRemoveItem, onScanOpen, t }: OrderItemsSectionProps) {
    const productOptions: SearchSelectOption[] = products
        .filter((p) => (p.quantity ?? 0) > 0)
        .map((p) => ({
            value: p.id,
            label: `${p.name} (${p.brand})`,
            secondary: `${Number(p.price).toFixed(3)} TND Â· ${p.quantity ?? 0} in stock`,
        }))

    return (
        <div className="space-y-3">
            <Label>{t('orders.items')}</Label>
            <div className="flex gap-2">
                <div className="flex-1">
                    <SearchSelect
                        options={productOptions}
                        value=""
                        onChange={(val) => {
                            const product = products.find((p) => p.id === val)
                            if (product) onAddProduct(product)
                        }}
                        placeholder={t('stock.searchPlaceholder')}
                        searchPlaceholder={t('stock.searchPlaceholder')}
                        emptyMessage={t('stock.noProducts')}
                        title={t('orders.items')}
                    />
                </div>
                <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={onScanOpen} title="Scan QR code">
                    <QrCode className="h-4 w-4" />
                </Button>
            </div>
            {items.length > 0 && (
                <div className="space-y-1.5">
                    {items.map((item, i) => {
                        const product = products.find((p) => p.id === item.productId)
                        const displayName = item.name || product?.name || item.productId
                        const isShop = user?.role === 'shop'
                        return (
                            <div key={i} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border">
                                <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="flex-1 text-sm font-medium truncate">{displayName}</span>
                                <Input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => onUpdateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-14 h-7 text-xs"
                                />
                                {isShop ? (
                                    <span className="text-sm font-medium whitespace-nowrap w-22 text-right">{item.unitPrice.toFixed(3)} TND</span>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={item.unitPrice}
                                            onChange={(e) => onUpdateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="w-20 h-7 text-xs"
                                        />
                                        <span className="text-xs text-muted-foreground">TND</span>
                                    </div>
                                )}
                                <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveItem(i)} className="h-7 w-7 shrink-0">
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
