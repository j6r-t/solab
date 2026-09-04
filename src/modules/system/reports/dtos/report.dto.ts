export interface RecentOrderDto {
    id: string
    orderNumber: number
    clientName: string
    totalAmount: string
    paidAmount: string
    pendingAmount?: string
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
    orderNumber: string | number
    opticianShop: string
    status: string
    source: string
    createdAt: Date
}

export interface TopClientDto {
    clientId: string
    name: string
    totalSpent: string
    ordersCount: number
}

export interface SalesByPaymentMethodDto {
    cash: string
    card: string
    instruments: string
}

export interface ReceivablesDto {
    outstanding: string
    pendingInstruments: string
    overdueInstruments: string
}

export interface StockHealthDto {
    outOfStock: number
    lowStock: number
    deadStock: number
    stockValue: string
}

export interface WorkloadDto {
    pending: number
    inProgress: number
    avgAgeDays: number
}

export interface RevenueByOpticianDto {
    shopId: string
    shopName: string
    total: string
}

export interface LowStockLensBlankDto {
    id: string
    label: string
    quantity: number
}

export interface LensBlanksLowStockDto {
    count: number
    items: LowStockLensBlankDto[]
}

export interface ReportResponse {
    // Shop fields
    totalClients?: number
    totalProducts?: number
    lowStockCount?: number
    totalOrders?: number
    todayOrders?: number
    pendingRepairs?: number
    totalRevenue?: string | number
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
    topClients?: TopClientDto[]
    salesByPaymentMethod?: SalesByPaymentMethodDto
    receivables?: ReceivablesDto
    stockHealth?: StockHealthDto
    repeatClients?: number
    dailyAvgSales?: number
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
    workload?: WorkloadDto
    avgTurnaroundDays?: number
    breakageRate?: number
    revenueByOptician?: RevenueByOpticianDto[]
    lensBlanksLowStock?: LensBlanksLowStockDto
    // Common
    period: string
}
