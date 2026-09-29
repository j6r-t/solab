import type { QRCodeResponse } from '@/modules/system/qrcode/dtos/qrcode.dto'
import type { Prisma } from '@prisma/client'

interface QRProductInput {
    id: string
    name: string
    brand: string | null
    model: string | null
    category: string | null
    price: Prisma.Decimal | string | number | null
    priceAfterTax?: Prisma.Decimal | string | number | null
    qrcode?: { code: string } | null
}

export function toQRCodeResponse(product: QRProductInput): QRCodeResponse {
    return {
        id: product.id,
        code: product.qrcode?.code || '',
        product: product.qrcode
            ? {
                id: product.id,
                name: product.name,
                brand: product.brand || '',
                model: product.model || '',
                category: product.category || '',
                price: Number(product.price ?? 0),
                priceAfterTax: product.priceAfterTax != null ? Number(product.priceAfterTax) : null,
            }
            : null,
    }
}
