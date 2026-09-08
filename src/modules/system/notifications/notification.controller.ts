import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { getNotifications } from './notification.service'

export async function GET(request: NextRequest) {
    try {
        const { role } = requireRole(['admin', 'shop', 'atelier'])(request)
        const { page, limit } = parsePagination(request)
        const alerts = await getNotifications(role)
        return ok(paginated(alerts, page, limit))
    } catch (error) {
        return handleError(error)
    }
}
