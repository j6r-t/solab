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
    profit: number
    orders: number
}

export interface MonthlyWorkOrdersDto {
    month: string
    count: number
    revenue: number
}

export interface OrderValueBucketDto {
    bucket: 'lt200' | '200to500' | '500to1000' | 'gt1000'
    count: number
}

export interface PowerBandDto {
    band: string
    count: number
}

export interface MarginByCategoryItemDto {
    category: string
    revenue: string
    cost: string
    marginPct: number
}

export interface WeeksOfCoverItemDto {
    category: string
    onHand: number
    weeklyRate: number
    weeks: number | null
}

export interface SupplierBalanceDto {
    fournisseurId: string
    name: string
    purchases: string
    outstanding: string
}

export interface DoctorRankingItemDto {
    doctorId: string
    name: string
    orders: number
    revenue: string
}

export interface AgingBucketDto {
    bucket: '0to3' | '4to7' | '8to14' | 'gt14'
    count: number
}

export interface WeeklyThroughputItemDto {
    weekStart: string
    created: number
    completed: number
}

export interface PartnerScorecardItemDto {
    shopId: string
    name: string
    orders: number
    revenue: string
    avgTurnaroundDays: number
    debt: string
    lastActivity: string
}

export interface LensUsageItemDto {
    blankId: string
    label: string
    usedQty: number
    inStock: number
}

export interface BreakageByLensItemDto {
    blankId: string
    label: string
    brokenQty: number
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

export interface DormantClientDto {
    clientId: string
    name: string
    phone: string
    lastOrderDate: string
    totalSpent: string
    ordersCount: number
}

export interface RestockItemDto {
    productId: string
    name: string
    brand: string
    category: string | null
    quantity: number
    supplierName: string | null
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
    dormantClients?: DormantClientDto[]
    restockList?: RestockItemDto[]
    salesByPaymentMethod?: SalesByPaymentMethodDto
    receivables?: ReceivablesDto
    stockHealth?: StockHealthDto
    repeatClients?: number
    dailyAvgSales?: number
    deltas?: Record<string, number | null>
    salesHeatmap?: { byWeekday: number[]; byHour: number[] }
    pareto?: { topDecileSharePct: number; activeClients: number }
    revenueSplit?: { newClientsRevenue: string; returningClientsRevenue: string }
    orderValueBuckets?: OrderValueBucketDto[]
    doctorRanking?: DoctorRankingItemDto[]
    powerDemand?: { sphBands: PowerBandDto[]; cylBands: PowerBandDto[] }
    marginByCategory?: MarginByCategoryItemDto[]
    weeksOfCover?: WeeksOfCoverItemDto[]
    supplierBalances?: SupplierBalanceDto[]
    collections?: { avgDaysToCash: number; bounceRate: number; cashedCount: number; bouncedCount: number }
    cancellations?: { count: number; revenueLost: string }
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
    avgTicket?: number
    agingBuckets?: AgingBucketDto[]
    weeklyThroughput?: WeeklyThroughputItemDto[]
    partnerScorecard?: PartnerScorecardItemDto[]
    sourceSplit?: { source: string; count: number }[]
    lensUsage?: LensUsageItemDto[]
    breakageByLens?: BreakageByLensItemDto[]
    // Common
    period: string
}
