import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseQuery } from '@/lib/api/parse'
import { lookupProductByCode } from './qrcode.service'
import { toQRCodeResponse } from './qrcode.dto'

export async function GET(request: NextRequest) {
    try {
        const { code } = parseQuery(request, 'code')
        const product = await lookupProductByCode(code || '')
        return ok(toQRCodeResponse(product))
    } catch (error) {
        return handleError(error)
    }
}
