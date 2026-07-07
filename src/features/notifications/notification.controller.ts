import { ok } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { getNotifications } from './notification.service'

export async function GET() {
    try {
        const alerts = await getNotifications()
        return ok(alerts)
    } catch (error) {
        return handleError(error)
    }
}
