import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface NotificationItem {
    id: string
    label: string
}

export interface NotificationAlert {
    type: 'low_stock' | 'pending_repair' | 'ready_order' | 'pending_payment'
    label: string
    count: number
    items: NotificationItem[]
}

export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.get<NotificationAlert[]>('/api/notifications'),
        refetchInterval: 15_000,
    })
}
