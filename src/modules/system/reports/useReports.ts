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
}

export interface MonthlyWorkOrders {
    month: string
    count: number
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
    topClients?: TopClient[]
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
