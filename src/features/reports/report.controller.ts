import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/api/error-handler'
import { parseQuery } from '@/lib/api/parse'
import { getReports } from './report.service'
import { toReportResponse } from './report.dto'

export async function GET(request: NextRequest) {
    try {
        const { period } = parseQuery(request, 'period')
        const data = await getReports(period || 'month')
        return ok(toReportResponse(data))
    } catch (error) {
        return handleError(error)
    }
}
