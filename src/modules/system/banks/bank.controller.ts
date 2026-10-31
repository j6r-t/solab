import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listBanks, createBank, updateBank, deleteBank } from './bank.service'
import { toBankResponse } from '@/modules/system/banks/mappers/bank.mapper'
import { bankSchema } from '@/modules/system/banks/bank.schema'

// All authenticated roles need the list (shop/atelier pick a bank when recording
// cheque/traite payments); only admin manages the catalog.
const READ_ROLES = ['admin', 'shop', 'atelier']
const WRITE_ROLES = ['admin']

export async function GET(request: NextRequest) {
    try {
        requireRole(READ_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const items = await listBanks()
        return ok(paginated(items.map(toBankResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(WRITE_ROLES)(request)
        const body = await parseBody(request, bankSchema)
        const item = await createBank(body)
        return created(toBankResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(WRITE_ROLES)(request)
        const { id } = await params
        const body = await parseBody(request, bankSchema.partial())
        const item = await updateBank(id, body)
        return ok(toBankResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(WRITE_ROLES)(request)
        const { id } = await params
        await deleteBank(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
