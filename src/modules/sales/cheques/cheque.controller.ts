import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { listCheques, updateChequeStatus } from './cheque.service'
import { toChequeResponse } from '@/modules/sales/cheques/mappers/cheque.mapper'
import { updateChequeStatusSchema } from './cheque.schema'

export async function GET(request: NextRequest) {
    try {
        const { page, limit } = parsePagination(request)
        const { status, entityType } = parseQuery(request, 'status', 'entityType')
        const cheques = await listCheques({ status, entityType })
        return ok(paginated(cheques.map(toChequeResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH_ID(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { status } = await parseBody(request, updateChequeStatusSchema)
        const cheque = await updateChequeStatus(id, status)
        return ok(toChequeResponse(cheque))
    } catch (error) {
        return handleError(error)
    }
}
