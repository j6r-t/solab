'use client'

import { api } from '@/lib/api/client'

interface OrderItem {
    id: string
    productId: string
    quantity: number
    unitPrice: string
    product: { name: string; brand: string }
}

interface Payment {
    id: string
    amount: string
    type: string
}

interface Repair {
    id: string
    type: string
    status: string
    price: string
    expectedCompletionDate: string
}

interface Prescription {
    id: string
    doctor: { name: string } | null
    sphRight: string
    cylRight: string
    axisRight: number
    addRight: string
    pdRight: number
    sphLeft: string
    cylLeft: string
    axisLeft: number
    addLeft: string
    pdLeft: number
}

interface Order {
    id: string
    orderNumber: number
    client: { id: string; name: string; familyName: string; phone: string }
    totalAmount: string
    totalPaid: string
    orderType: string
    status: string
    paymentStatus: string
    items: OrderItem[]
    payments: Payment[]
    repairs: Repair[]
    prescription: Prescription | null
    turnaroundDays: number | null
    createdAt: string
}

export type { Order, OrderItem, Payment, Repair, Prescription }

export const fetchOrders = (params?: { search?: string; status?: string }) =>
    api.get<Order[]>('/api/orders', params as Record<string, string | undefined>)

export const createOrder = (data: any) =>
    api.post<Order>('/api/orders', data)

export const updateOrder = (id: string, data: any) =>
    api.patch<Order>(`/api/orders/${id}`, data)

export const deleteOrder = (id: string) =>
    api.del(`/api/orders/${id}`)
