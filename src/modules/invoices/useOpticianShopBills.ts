import { useQuery } from '@tanstack/react-query'
import {
    fetchOpticianShopBills,
    fetchOpticianShopBillsSummary,
    type OpticianShopBill,
    type OpticianShopBillShopSummary,
} from '@/modules/partners/optician-shop-bills/optician-shop-bills.api'

export function useOpticianShopBills(params?: { search?: string; status?: string; opticianShopId?: string }) {
    return useQuery<OpticianShopBill[]>({
        queryKey: ['optician-shop-bills', params],
        queryFn: () => fetchOpticianShopBills(params),
    })
}

export function useOpticianShopBillsSummary() {
    return useQuery<OpticianShopBillShopSummary[]>({
        queryKey: ['optician-shop-bills-summary'],
        queryFn: fetchOpticianShopBillsSummary,
    })
}
