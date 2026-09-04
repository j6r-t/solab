'use client'

import { api } from '@/lib/api/client'

interface QRCodeData {
    id: string
    code: string
    product: {
        id: string
        name: string
        brand: string
        model: string
        category: string
        price: number
    } | null
}

export type { QRCodeData }

export const lookupQRCode = (code: string) =>
    api.get<QRCodeData>('/api/qrcode', { code })
