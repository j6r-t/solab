import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listCheques, updateChequeStatus, type ChequeInstrumentScope } from './cheque.service'
import { toChequeResponse } from '@/modules/sales/cheques/mappers/cheque.mapper'
import { updateChequeStatusSchema } from './cheque.schema'

const VALID_SCOPES: ChequeInstrumentScope[] = ['optician_bill', 'supplier']

function parseScopes(raw: string | undefined): ChequeInstrumentScope[] | undefined {
    if (!raw) return undefined
    const scopes = raw
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is ChequeInstrumentScope => VALID_SCOPES.includes(s as ChequeInstrumentScope))
    return scopes.length > 0 ? scopes : undefined
}

export async function GET(request: NextRequest) {
    try {
        const { role } = requireRole(['admin', 'shop', 'atelier'])(request)
        const { page, limit } = parsePagination(request)
        const { status, statuses, entityType, dueBefore, instrumentScopes } = parseQuery(
            request,
            'status',
            'statuses',
            'entityType',
            'dueBefore',
            'instrumentScopes'
        )

        let scopes = parseScopes(instrumentScopes)
        let scopedEntityType = entityType
        if (role === 'atelier') {
            // Atelier is hard-scoped server-side: only cheques linked via
            // optician bills / supplier invoices, never client-order cheques.
            scopes = ['optician_bill', 'supplier']
            scopedEntityType = undefined
        }

        const cheques = await listCheques({ status, statuses, entityType: scopedEntityType, dueBefore, instrumentScopes: scopes })
        return ok(paginated(cheques.map(toChequeResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH_ID(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { role } = requireRole(['admin', 'shop', 'atelier'])(request)
        const { id } = await params
        const { status } = await parseBody(request, updateChequeStatusSchema)
        const cheque = await updateChequeStatus(id, status, { role })
        return ok(toChequeResponse(cheque))
    } catch (error) {
        return handleError(error)
    }
}
