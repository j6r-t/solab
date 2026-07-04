'use client'

import { api } from '@/lib/api/client'

interface DashboardData {
    totalClients: number
    totalProducts: number
    lowStockCount: number
    todayOrders: number
    pendingRepairs: number
    totalRevenue: string
    recentOrders: {
        id: string
        orderNumber: number
        clientName: string
        totalAmount: string
        paidAmount: string
        status: string
        paymentStatus: string
        createdAt: string
    }[]
}

interface ReadyOrder {
    id: string
    orderNumber: number
    client: { name: string; familyName: string; phone: string }
    totalAmount: string
    createdAt: string
}

export type { DashboardData, ReadyOrder }

export const fetchDashboard = () =>
    api.get<DashboardData>('/api/reports')

export const fetchReadyOrders = () =>
    api.get<ReadyOrder[]>('/api/orders', { status: 'ready' })
