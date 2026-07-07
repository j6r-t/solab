import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseQuery } from '@/lib/api/parse'
import { getReports } from './report.service'
import { toReportResponse } from '@/mappers/report.mapper'

export async function GET(request: NextRequest) {
    try {
        const { period, entity } = parseQuery(request, 'period', 'entity')
        const data = await getReports(period || 'month', entity || 'shop')
        return ok(toReportResponse(data))
    } catch (error) {
        return handleError(error)
    }
}
