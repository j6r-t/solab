export interface ReportResponse {
    totalClients: number
    totalProducts: number
    lowStockCount: number
    totalOrders: number
    todayOrders: number
    pendingRepairs: number
    totalRevenue: string
    revenueByType: {
        standard: string
        remounting: string
        direct_sale: string
    }
    ordersByStatus: { pending: number; completed: number; cancelled: number }
    recentOrders: {
        id: string
        orderNumber: number
        clientName: string
        totalAmount: string
        paidAmount: string
        status: string
        paymentStatus: string
        createdAt: Date
    }[]
    period: string
}

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
