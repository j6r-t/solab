'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, QrCode, Package, Loader2, Scan } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { lookupQRCode } from './qrcode.api'

interface Product {
    id: string
    name: string
    brand: string
    model: string
    category: string
    price: number
}

export function QRCodePage() {
    const { t } = useTranslation()
    const [code, setCode] = useState('')
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    async function handleLookup() {
        const trimmed = code.trim()
        if (!trimmed) return
        setLoading(true)
        setProduct(null)
        setSearched(true)
        try {
            const data = await lookupQRCode(trimmed)
            if (!data.product) {
                toast.error('Product not found for this QR code')
                return
            }
            setProduct(data.product)
        } catch {
            toast.error('Failed to look up QR code')
        } finally {
            setLoading(false)
        }
    }

    const categoryLabel = (cat: string | null) => {
        if (!cat) return '—'
        return t(`stock.${cat}`)
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-[22px] font-medium flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    {t('stock.qrCode')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{t('qrcode.description')}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                        placeholder="Enter or scan QR code..."
                        className="pl-10 h-10"
                    />
                </div>
                <Button onClick={handleLookup} disabled={loading || !code.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spinner" /> : <Search className="h-4 w-4 mr-1" />}
                    {t('common.search')}
                </Button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            )}

            {searched && !loading && !product && (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center">
                    <QrCode className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <h2 className="text-lg font-medium text-foreground mb-2">No product found</h2>
                    <p className="text-sm text-muted-foreground">No product matches the entered QR code.</p>
                </div>
            )}

            {product && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            {product.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-muted-foreground">{t('stock.brand')}:</span> {product.brand || '—'}</div>
                            <div><span className="text-muted-foreground">{t('stock.model')}:</span> {product.model || '—'}</div>
                            <div><span className="text-muted-foreground">{t('stock.category')}:</span> {categoryLabel(product.category)}</div>
                            <div><span className="text-muted-foreground">{t('stock.sellingPrice')}:</span> {formatCurrency(product.price.toString())}</div>
                            <div><span className="text-muted-foreground">QR Code:</span> <span className="font-mono text-xs">{code}</span></div>
                        </div>

                        {code && (
                            <div className="flex flex-col items-center gap-2 pt-2 border-t">
                                <p className="text-sm font-semibold">{product.model || product.name}</p>
                                {/* eslint-disable-next-line @next/next/no-img-element -- external QR service image, unoptimized by design */}
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}`}
                                    alt={code}
                                    className="rounded-lg border"
                                />
                                <p className="text-xs text-muted-foreground font-mono select-all">{code}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
