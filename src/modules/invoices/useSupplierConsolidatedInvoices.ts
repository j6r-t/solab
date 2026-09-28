import { useQuery } from '@tanstack/react-query'
import {
    fetchSupplierConsolidatedInvoices,
    type SupplierConsolidatedInvoice,
} from '@/modules/inventory/supplier-consolidated-invoices/supplier-consolidated-invoices.api'

export function useSupplierConsolidatedInvoices(params?: { fournisseurId?: string; entity?: string; status?: string; search?: string }) {
    return useQuery<SupplierConsolidatedInvoice[]>({
        queryKey: ['supplier-consolidated-invoices', params],
        queryFn: () => fetchSupplierConsolidatedInvoices(params),
    })
}
