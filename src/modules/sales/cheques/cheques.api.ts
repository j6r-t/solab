'use client'

import { api } from '@/lib/api/client'

export interface Cheque {
    id: string
    number: string
    type: string
    bankName: string | null
    amount: string
    issueDate: string
    dueDate: string
    status: string
    entityType: string
    notes: string | null
    order: { id: string; orderNumber: number; client: { id: string; name: string; familyName: string } } | null
    invoice: { id: string; invoiceNumber: string; fournisseur: { id: string; name: string } } | null
}

export const fetchCheques = (params?: { status?: string; entityType?: string }) =>
    api.get<Cheque[]>('/api/cheques', params as Record<string, string | undefined>)

export const updateChequeStatus = (id: string, status: string) =>
    api.patch<Cheque>(`/api/cheques/${id}`, { status })
