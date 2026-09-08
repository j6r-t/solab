import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseQuery } from '@/lib/api/parse'
import { requireRole } from '@/lib/api/auth'
import { getReports } from './report.service'
import { toReportResponse } from '@/modules/system/reports/mappers/report.mapper'

export async function GET(request: NextRequest) {
    try {
        const { role } = requireRole(['admin', 'shop', 'atelier'])(request)
        const { period, entity } = parseQuery(request, 'period', 'entity')
        const scopedEntity = role === 'admin' ? (entity || 'shop') : role
        const data = await getReports(period || 'month', scopedEntity)
        return ok(toReportResponse(data))
    } catch (error) {
        return handleError(error)
    }
}
