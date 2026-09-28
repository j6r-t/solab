import { getAtelierReports } from './atelier-report.service'
import { getShopReports } from './shop-report.service'

export async function getReports(period: string, entity: string) {
    const now = new Date()
    if (entity === 'atelier') return getAtelierReports(period, now)
    return getShopReports(period, now)
}
