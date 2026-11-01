import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { requireRole } from '@/lib/api/auth'
import { getAtelierDashboard } from './atelier-dashboard.service'

export async function GET(request: NextRequest) {
    try {
        requireRole(['admin', 'atelier'])(request)
        const data = await getAtelierDashboard()
        return ok(data)
    } catch (error) {
        return handleError(error)
    }
}
