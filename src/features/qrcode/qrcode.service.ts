import { qrcodeRepo } from '@/lib/database/repositories'
import { ValidationError, NotFoundError } from '@/lib/errors'

export async function lookupProductByCode(code: string) {
    if (!code) throw new ValidationError('QR code parameter is required')
    const qrcode: any = await qrcodeRepo.findUnique({
        where: { code },
        include: {
            product: {
                include: {
                    fournisseur: { select: { id: true, name: true } },
                    _count: { select: { orderItems: true } },
                },
            },
        },
    })
    if (!qrcode?.product) throw new NotFoundError('Product not found for this QR code')
    return qrcode.product
}
