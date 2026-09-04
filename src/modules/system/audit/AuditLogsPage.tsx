'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useAuditLogs, useAuditEntityTypes } from './useAuditLogs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, History, Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

function metadataSummary(metadata: Record<string, unknown>): string {
    const entries = Object.entries(metadata)
    if (entries.length === 0) return ''
    return entries.slice(0, 3).map(([k, v]) => `${k}: ${String(v)}`).join(' · ') + (entries.length > 3 ? ' …' : '')
}

export function AuditLogsPage() {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [entityType, setEntityType] = useState('')
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [page, setPage] = useState('1')
    const [expanded, setExpanded] = useState<string | null>(null)
    const debouncedSearch = useDebounce(search, 300)
    const debouncedFrom = useDebounce(from, 500)
    const debouncedTo = useDebounce(to, 500)

    const { data: types } = useAuditEntityTypes()
    const { data, isLoading: loading } = useAuditLogs({
        action: debouncedSearch || undefined,
        entityType: entityType || undefined,
        from: debouncedFrom || undefined,
        to: debouncedTo || undefined,
        page,
    })

    const logs = data?.data ?? []
    const pagination = data?.pagination

    function goToPage(next: number) {
        setPage(String(Math.min(Math.max(1, next), pagination?.totalPages ?? 1)))
    }

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('nav.auditLogs')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('auditLogs.description')}</p>
            </div>

            <Card>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6">
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t('auditLogs.action')}</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage('1') }} placeholder={t('auditLogs.actionPlaceholder')} className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t('auditLogs.entityType')}</Label>
                        <select
                            value={entityType}
                            onChange={(e) => { setEntityType(e.target.value); setPage('1') }}
                            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                        >
                            <option value="">{t('common.all')}</option>
                            {(types ?? []).map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t('auditLogs.from')}</Label>
                        <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage('1') }} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t('auditLogs.to')}</Label>
                        <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage('1') }} />
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : logs.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <History className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('auditLogs.noLogs')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">{t('auditLogs.noLogsDesc')}</p>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 rounded-lg border bg-card row-alternate row-hover">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="secondary">{log.entityType}</Badge>
                                            <span className="text-sm font-medium">{log.action}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span>{formatDateTime(log.createdAt)}</span>
                                            {log.user && <span>{log.user}</span>}
                                            {log.entityId && <span className="font-mono truncate max-w-[180px]">{log.entityId}</span>}
                                        </div>
                                        {!expanded && Object.keys(log.metadata).length > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1 truncate">{metadataSummary(log.metadata)}</p>
                                        )}
                                    </div>
                                    {Object.keys(log.metadata).length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                                            title={t('auditLogs.details')}
                                        >
                                            {expanded === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    )}
                                </div>
                                {expanded === log.id && (
                                    <pre className="mt-3 p-3 rounded-md bg-muted text-xs overflow-x-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
                                )}
                            </div>
                        ))}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {t('auditLogs.pageInfo', { page: pagination.page, total: pagination.totalPages })}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
