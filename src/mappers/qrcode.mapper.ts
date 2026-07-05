import type { QRCodeResponse } from '@/dtos/qrcode/qrcode.dto'

export function toQRCodeResponse(product: any): QRCodeResponse {
    return {
        id: product.id,
        code: product.qrcode?.code || '',
        product: product.qrcode
            ? {
                id: product.id,
                name: product.name,
                brand: product.brand,
                model: product.model,
                category: product.category,
                price: Number(product.price),
            }
            : null,
    }
}
