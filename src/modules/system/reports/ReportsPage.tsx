'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useReports, type ShopReportData, type AtelierReportData } from './useReports'
import { ShopReports } from './ShopReports'
import { AtelierReports } from './AtelierReports'

export function ReportsPage() {
    const { user } = useAuthStore()
    const entity = user?.role === 'atelier' ? 'atelier' : 'shop'
    const [period, setPeriod] = useState('month')

    const { data } = useReports({ period, entity })
    const report = data ?? null

    if (entity === 'atelier') {
        return <AtelierReports data={report as AtelierReportData} period={period} setPeriod={setPeriod} />
    }

    return <ShopReports data={report as ShopReportData} period={period} setPeriod={setPeriod} />
}
