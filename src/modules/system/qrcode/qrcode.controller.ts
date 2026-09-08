import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseQuery } from '@/lib/api/parse'
import { requireRole } from '@/lib/api/auth'
import { lookupProductByCode } from './qrcode.service'
import { toQRCodeResponse } from '@/modules/system/qrcode/mappers/qrcode.mapper'

export async function GET(request: NextRequest) {
    try {
        requireRole(['admin', 'shop'])(request)
        const { code } = parseQuery(request, 'code')
        const product = await lookupProductByCode(code || '')
        return ok(toQRCodeResponse(product))
    } catch (error) {
        return handleError(error)
    }
}
