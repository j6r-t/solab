export interface RecentOrderDto {
    id: string
    orderNumber: number
    clientName: string
    totalAmount: string
    paidAmount: string
    status: string
    paymentStatus: string
    createdAt: Date
}

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
    recentOrders: RecentOrderDto[]
    period: string
}
