import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface TopProduct {
    productId: string
    name: string
    brand: string
    model: string
    quantity: number
    price: string
    costPrice: string | null
}

export interface MonthlyRevenue {
    month: string
    revenue: number
    profit: number
    orders: number
}

export interface MonthlyWorkOrders {
    month: string
    count: number
    revenue: number
}

export interface WorkOrderByShop {
    shopName: string
    count: number
}

export interface RecentOrder {
    id: string
    orderNumber: number
    clientName: string
    totalAmount: string
    paidAmount: string
    status: string
    paymentStatus: string
    createdAt: string
}

export interface RecentWorkOrder {
    id: string
    orderNumber: string
    opticianShop: string
    status: string
    source: string
    createdAt: string
}

export interface TopClient {
    clientId: string
    name: string
    totalSpent: string
    ordersCount: number
}

export interface DormantClient {
    clientId: string
    name: string
    phone: string
    lastOrderDate: string
    totalSpent: string
    ordersCount: number
}

export interface RestockItem {
    productId: string
    name: string
    brand: string
    category: string | null
    quantity: number
    supplierName: string | null
}

export interface SalesByPaymentMethod {
    cash: string
    card: string
    instruments: string
}

export interface Receivables {
    outstanding: string
    pendingInstruments: string
    overdueInstruments: string
}

export interface StockHealth {
    outOfStock: number
    lowStock: number
    deadStock: number
    stockValue: string
}

export interface Workload {
    pending: number
    inProgress: number
    avgAgeDays: number
}

export interface RevenueByOptician {
    shopId: string
    shopName: string
    total: string
}

export interface LensBlanksLowStock {
    count: number
    items: { id: string; label: string; quantity: number }[]
}

export interface ShopDeltas {
    revenue: number | null
    orders: number | null
    avgOrderValue: number | null
    newClients: number | null
    profit: number | null
}

export interface OrderValueBucket {
    bucket: 'lt200' | '200to500' | '500to1000' | 'gt1000'
    count: number
}

export interface PowerBand {
    band: string
    count: number
}

export interface MarginByCategoryItem {
    category: string
    revenue: string
    cost: string
    marginPct: number
}

export interface WeeksOfCoverItem {
    category: string
    onHand: number
    weeklyRate: number
    weeks: number | null
}

export interface SupplierBalance {
    fournisseurId: string
    name: string
    purchases: string
    outstanding: string
}

export interface DoctorRankingItem {
    doctorId: string
    name: string
    orders: number
    revenue: string
}

export interface AtelierDeltas {
    revenue: number | null
    completed: number | null
    avgTurnaround: number | null
    breakage: number | null
    avgTicket: number | null
}

export interface AgingBucket {
    bucket: '0to3' | '4to7' | '8to14' | 'gt14'
    count: number
}

export interface WeeklyThroughputItem {
    weekStart: string
    created: number
    completed: number
}

export interface PartnerScorecardItem {
    shopId: string
    name: string
    orders: number
    revenue: string
    avgTurnaroundDays: number
    debt: string
    lastActivity: string
}

export interface LensUsageItem {
    blankId: string
    label: string
    usedQty: number
    inStock: number
}

export interface BreakageByLensItem {
    blankId: string
    label: string
    brokenQty: number
}

export interface TopBlanksByShopEntry {
    shopId: string
    shopName: string
    blanks: { label: string; qty: number }[]
}

export interface ShopReportData {
    totalRevenue: string
    totalOrders: number
    todayOrders: number
    totalClients: number
    totalProducts: number
    lowStockCount: number
    pendingRepairs: number
    newClients: number
    avgOrderValue: string
    totalProfit: string
    totalCost: string
    outstandingBalance: string
    revenueByType: { standard: string; remounting: string; direct_sale: string }
    ordersByStatus: { pending: number; completed: number; cancelled: number }
    topProductsByCategory: Record<string, TopProduct[]>
    monthlyRevenue: MonthlyRevenue[]
    recentOrders: RecentOrder[]
    deltas: ShopDeltas
    salesHeatmap: { byWeekday: number[]; byHour: number[] }
    pareto: { topDecileSharePct: number; activeClients: number }
    revenueSplit: { newClientsRevenue: string; returningClientsRevenue: string }
    orderValueBuckets: OrderValueBucket[]
    doctorRanking: DoctorRankingItem[]
    powerDemand: { sphBands: PowerBand[]; cylBands: PowerBand[] }
    marginByCategory: MarginByCategoryItem[]
    weeksOfCover: WeeksOfCoverItem[]
    supplierBalances: SupplierBalance[]
    collections: { avgDaysToCash: number; bounceRate: number; cashedCount: number; bouncedCount: number }
    cancellations: { count: number; revenueLost: string }
    topClients?: TopClient[]
    dormantClients: DormantClient[]
    restockList: RestockItem[]
    salesByPaymentMethod?: SalesByPaymentMethod
    receivables?: Receivables
    stockHealth?: StockHealth
    repeatClients?: number
    dailyAvgSales?: number
    period: string
}

export interface AtelierReportData {
    totalRevenue: number
    totalLensBlanks: number
    lowStockLensBlanks: number
    totalWorkOrders: number
    pendingWorkOrders: number
    completedWorkOrders: number
    totalOpticianShops: number
    workOrdersByShop: WorkOrderByShop[]
    monthlyWorkOrders: MonthlyWorkOrders[]
    recentWorkOrders: RecentWorkOrder[]
    deltas: AtelierDeltas
    avgTicket: number
    agingBuckets: AgingBucket[]
    weeklyThroughput: WeeklyThroughputItem[]
    partnerScorecard: PartnerScorecardItem[]
    sourceSplit: { source: string; count: number }[]
    lensUsage: LensUsageItem[]
    breakageByLens: BreakageByLensItem[]
    topBlanksByShop?: TopBlanksByShopEntry[]
    workload?: Workload
    avgTurnaroundDays?: number
    breakageRate?: number
    revenueByOptician?: RevenueByOptician[]
    lensBlanksLowStock?: LensBlanksLowStock
    period: string
}

export type ReportData = ShopReportData | AtelierReportData

export function useReports(params: { period: string; entity: string }) {
    return useQuery({
        queryKey: ['reports', params],
        queryFn: () => api.get<ReportData>('/api/reports', { period: params.period, entity: params.entity }),
    })
}
