import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export function useLensBlanks<T = unknown>(params?: Record<string, string | undefined>) {
    return useQuery({
        queryKey: ['lens-blanks', params],
        queryFn: () => api.get<T>('/api/lens-blanks', params),
    })
}