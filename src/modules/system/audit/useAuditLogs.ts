import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface AuditLogEntry {
    id: string
    action: string
    entityType: string
    entityId: string | null
    user: string | null
    metadata: Record<string, unknown>
    createdAt: string
}

export interface AuditLogFilters {
    action?: string
    entityType?: string
    from?: string
    to?: string
    page?: string
}

export function useAuditLogs(filters?: AuditLogFilters) {
    return useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: () => api.getPaginated<AuditLogEntry>('/api/audit-logs', filters as Record<string, string | undefined>),
    })
}

export function useAuditEntityTypes() {
    return useQuery({
        queryKey: ['audit-logs', 'entity-types'],
        queryFn: () => api.get<string[]>('/api/audit-logs/types'),
        staleTime: 5 * 60 * 1000,
    })
}
