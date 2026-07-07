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

export interface TopProductDto {
    productId: string
    name: string
    brand: string
    model: string
    quantity: number
    price: string
    costPrice: string | null
}

export interface MonthlyRevenueDto {
    month: string
    revenue: number
}

export interface MonthlyWorkOrdersDto {
    month: string
    count: number
}

export interface WorkOrderByShopDto {
    shopName: string
    count: number
}

export interface RecentWorkOrderDto {
    id: string
    orderNumber: string
    opticianShop: string
    status: string
    source: string
    type: string
    createdAt: Date
}

export interface ReportResponse {
    // Shop fields
    totalClients?: number
    totalProducts?: number
    lowStockCount?: number
    totalOrders?: number
    todayOrders?: number
    pendingRepairs?: number
    totalRevenue?: string
    newClients?: number
    avgOrderValue?: string
    totalProfit?: string
    totalCost?: string
    outstandingBalance?: string
    revenueByType?: { standard: string; remounting: string; direct_sale: string }
    ordersByStatus?: { pending: number; completed: number; cancelled: number }
    topProductsByCategory?: Record<string, TopProductDto[]>
    monthlyRevenue?: MonthlyRevenueDto[]
    recentOrders?: RecentOrderDto[]
    // Atelier fields
    totalLensBlanks?: number
    lowStockLensBlanks?: number
    totalWorkOrders?: number
    pendingWorkOrders?: number
    completedWorkOrders?: number
    totalOpticianShops?: number
    workOrdersByShop?: WorkOrderByShopDto[]
    monthlyWorkOrders?: MonthlyWorkOrdersDto[]
    recentWorkOrders?: RecentWorkOrderDto[]
    // Common
    period: string
}
