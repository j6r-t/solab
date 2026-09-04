import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { listRepairs, getRepair, createRepair, updateRepairStatus, assignLensBlanks, declareBreakage, deleteRepair, recordPayment } from './repair.service'
import { toRepairResponse } from '@/modules/sales/repairs/mappers/repair.mapper'
import { repairSchema, updateRepairStatusSchema, assignLensBlanksSchema, declareBreakageSchema, recordRepairPaymentSchema } from '@/modules/sales/repairs/repair.schema'

export async function GET(request: NextRequest) {
    try {
        const { status, search, source, type } = parseQuery(request, 'status', 'search', 'source', 'type')
        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        if (id) {
            const repair = await getRepair(id)
            return ok(toRepairResponse(repair))
        }
        const { page, limit } = parsePagination(request)
        const repairs = await listRepairs({ status, search, source, type })
        return ok(paginated(repairs.map(toRepairResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody(request, repairSchema)
        const repair = await createRepair(body)
        return created(toRepairResponse(repair))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const url = new URL(request.url)
        const action = url.searchParams.get('action')

        if (action === 'assign-lens-blanks') {
            const body = await parseBody(request, assignLensBlanksSchema)
            const repair = await assignLensBlanks(id, body)
            return ok(toRepairResponse(repair))
        }
        if (action === 'declare-breakage') {
            const body = await parseBody(request, declareBreakageSchema)
            const repair = await declareBreakage(id, { brokenLensBlank: body.which })
            return ok(toRepairResponse(repair))
        }
        if (action === 'record-payment') {
            const { amount } = await parseBody(request, recordRepairPaymentSchema)
            const repair = await recordPayment(id, amount)
            return ok(toRepairResponse(repair))
        }

        const body = await parseBody(request, updateRepairStatusSchema)
        const repair = await updateRepairStatus(id, body.status)
        return ok(toRepairResponse(repair))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteRepair(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}