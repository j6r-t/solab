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
        newClients: data.newClients,
        avgOrderValue: data.avgOrderValue,
        totalProfit: data.totalProfit,
        totalCost: data.totalCost,
        outstandingBalance: data.outstandingBalance,
        revenueByType: data.revenueByType,
        ordersByStatus: data.ordersByStatus,
        topProductsByCategory: data.topProductsByCategory,
        monthlyRevenue: data.monthlyRevenue,
        recentOrders: data.recentOrders,
        totalLensBlanks: data.totalLensBlanks,
        lowStockLensBlanks: data.lowStockLensBlanks,
        totalWorkOrders: data.totalWorkOrders,
        pendingWorkOrders: data.pendingWorkOrders,
        completedWorkOrders: data.completedWorkOrders,
        totalOpticianShops: data.totalOpticianShops,
        workOrdersByShop: data.workOrdersByShop,
        monthlyWorkOrders: data.monthlyWorkOrders,
        recentWorkOrders: data.recentWorkOrders,
        period: data.period,
    }
}
