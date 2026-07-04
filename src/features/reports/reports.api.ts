'use client'

import { api } from '@/lib/api/client'

interface ReportData {
    totalRevenue: string
    totalOrders: number
    totalClients: number
    totalProducts: number
    lowStockCount: number
    pendingRepairs: number
    revenueByType: { standard: string; remounting: string; direct_sale: string }
    ordersByStatus: { pending: number; completed: number; cancelled: number }
    period: string
}

export type { ReportData }

export const fetchReports = (period?: string) =>
    api.get<ReportData>('/api/reports', { period: period || 'month' })
