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
                        Products from {supplier?.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={productFilter} onValueChange={(v) => onProductFilterChange(v as 'all' | 'sold' | 'unsold')}>
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

                {filteredProducts.length === 0 ? (
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
    )
}
