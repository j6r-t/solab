import type { ReportResponse } from '@/dtos/reports/report.dto'

export function toReportResponse(data: any): ReportResponse {
    return {
        totalClients: data.totalClients,
        totalProducts: data.totalProducts,
        lowStockCount: data.lowStockCount,
        totalOrders: data.totalOrders,
        todayOrders: data.todayOrders,
        pendingRepairs: data.pendingRepairs,
        totalRevenue: data.totalRevenue,
        revenueByType: data.revenueByType,
        ordersByStatus: data.ordersByStatus,
        recentOrders: data.recentOrders,
        period: data.period,
    }
}
