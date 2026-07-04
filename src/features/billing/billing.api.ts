'use client'

import { api } from '@/lib/api/client'

interface InvoiceItem {
    productName: string
    brand: string
    quantity: number
    unitPrice: string
}

interface InvoicePayment {
    amount: string
    type: string
    createdAt: string
}

interface InvoiceRepair {
    type: string
    price: string
}

interface InvoicePrescription {
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
    dateWritten: string | null
    doctorName: string | null
}

interface BillingRecord {
    id: string
    orderNumber: number
    client: { name: string; familyName: string; phone: string; address?: string | null }
    totalAmount: string
    totalPaid: string
    balance: string
    paymentStatus: string
    status: string
    orderType: string
    createdAt: string
    items: InvoiceItem[]
    payments: InvoicePayment[]
    repairs: InvoiceRepair[]
    turnaroundDays: number | null
    prescription: InvoicePrescription | null
}

export type { BillingRecord, InvoiceItem, InvoicePayment, InvoiceRepair, InvoicePrescription }

export const fetchBillingRecords = (params?: { search?: string; status?: string; start?: string; end?: string }) =>
    api.get<BillingRecord[]>('/api/billing', params as Record<string, string | undefined>)
