import { qrcodeRepo } from '@/lib/database/repositories'
import { BadRequestError, NotFoundError } from '@/errors'

export async function lookupProductByCode(code: string) {
    if (!code) throw new BadRequestError('QR code parameter is required')
    const qrcode: any = await qrcodeRepo.findUnique({
        where: { code },
        include: {
            product: {
                include: {
                    fournisseur: { select: { id: true, name: true } },
                    _count: { select: { orderItems: true } },
                    qrcode: true,
                },
            },
        },
    })
    if (!qrcode?.product) throw new NotFoundError('Product not found for this QR code')
    return qrcode.product
}
