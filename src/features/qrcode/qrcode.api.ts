'use client'

import { api } from '@/lib/api/client'

interface QRProduct {
    id: string
    name: string
    brand: string
    model: string
    category: string
    price: string
    quantity: number
    fournisseur: { id: string; name: string } | null
    _count: { orderItems: number }
    qrcode: { code: string } | null
}

export type { QRProduct }

export const lookupQRCode = (code: string) =>
    api.get<QRProduct>('/api/qrcode', { code })
