import { api } from '@/lib/api/client'
import type { PurchaseInvoice } from './usePurchaseInvoices'

export interface AddPurchaseInvoicePaymentPayload {
    amount: number
    method: 'cash' | 'cheque' | 'traite'
    chequeNumber?: string
    chequeBank?: string
    chequeDueDate?: string
    chequeType?: 'standard' | 'traite'
}

export async function addPurchaseInvoicePayment(id: string, data: AddPurchaseInvoicePaymentPayload): Promise<PurchaseInvoice> {
    return api.patch(`/api/purchase-invoices/${id}?action=add-payment`, data)
}
