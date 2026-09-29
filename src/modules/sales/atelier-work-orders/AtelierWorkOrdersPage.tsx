'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Wrench } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { WorkOrderDetailDialog } from './WorkOrderDetailDialog'
import { NewWorkOrderDialog } from './NewWorkOrderDialog'
import { useRepairs } from '../repairs/useRepairs'
import { formatDate } from '@/lib/utils/dates'

interface WorkOrder {
    id: string
    orderId: string | null
    opticianShopId: string | null
    source: 'internal' | 'optician'
    status: string
    servicePrice: string
    lensBlankPrice: string | null
    paymentStatus: string
    amountPaid: string
    expectedCompletionDate: string | null
    lensBlankLeft: { id: string; brand: string; thickness: string; lensType: string; material: string; coating: string; sellingPrice: string; sph: string; cyl: string } | null
    lensBlankRight: { id: string; brand: string; thickness: string; lensType: string; material: string; coating: string; sellingPrice: string; sph: string; cyl: string } | null
    brokenLensBlank: string | null
    replacementLeft: { id: string; brand: string; thickness: string } | null
    replacementRight: { id: string; brand: string; thickness: string } | null
    workOrderServices: { id: string; repairService: { id: string; name: string }; price: string }[]
    prescription: {
        id: string
        sphRight: string; cylRight: string; axisRight: number; addRight: string; pdRight: number
        sphLeft: string; cylLeft: string; axisLeft: number; addLeft: string; pdLeft: number
        thickness: string | null; lensType: string | null; material: string | null; coating: string | null
        notes: string | null
    } | null
    bill: { id: string; billNumber: string; totalAmount: string; paidAmount: string; status: string } | null
    opticianShop: { id: string; name: string } | null
    order: { id: string; orderNumber: number; client: { id: string; name: string; familyName: string; phone: string } } | null
    createdAt: string
}

const TABS = ['all', 'pending', 'in_progress', 'completed', 'delivered'] as const
const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    delivered: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
}

function daysUntil(dateStr: string): number {
    const due = new Date(dateStr)
    const now = new Date()
    const dueDay = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
    const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.round((dueDay - nowDay) / 86400000)
}

export function AtelierWorkOrdersPage() {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [statusTab, setStatusTab] = useState<string>('all')
    const [sourceFilter, setSourceFilter] = useState('')
    const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [newWOOpen, setNewWOOpen] = useState(false)

    function statusLabel(s: string): string {
        const key = `workOrders.status.${s}`
        const translated = t(key)
        return translated === key ? s.replace('_', ' ') : translated
    }

    const debouncedSearch = useDebounce(search, 300)

    const { data: workOrdersData, isLoading: loading, refetch: reFetch } = useRepairs<WorkOrder[]>({
        search: debouncedSearch,
        status: statusTab !== 'all' ? statusTab : undefined,
        source: sourceFilter,
    })
    const workOrders = workOrdersData ?? []

    // Overview cards + tab counts: same search/source, but NO status filter — stable across tab clicks
    const { data: statsData } = useRepairs<WorkOrder[]>({ search: debouncedSearch, source: sourceFilter })
    const statsOrders = statsData ?? []

    const countByStatus = (status: string) => status === 'all'
        ? statsOrders.length
        : statsOrders.filter((wo) => wo.status === status).length

    const pendingCount = statsOrders.filter((wo) => wo.status === 'pending' || wo.status === 'in_progress').length

    return (
        <div className="space-y-6 max-w-[1000px]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-medium">{t('nav.atelierWorkOrders')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('workOrders.pageDescription')}</p>
                </div>
                <Button onClick={() => setNewWOOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('workOrders.new')}
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{t('orders.total')}</p>
                    <p className="text-lg font-semibold mt-1">{statsOrders.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{t('workOrders.statPendingActive')}</p>
                    <p className="text-lg font-semibold mt-1 text-amber-600">{pendingCount}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{t('workOrders.status.completed')}</p>
                    <p className="text-lg font-semibold mt-1 text-green-600">{countByStatus('completed')}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{t('workOrders.status.delivered')}</p>
                    <p className="text-lg font-semibold mt-1">{countByStatus('delivered')}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-1 border-b">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setStatusTab(tab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            statusTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab === 'all' ? t('common.all') : statusLabel(tab)}
                        <span className="ml-1.5 text-xs text-muted-foreground">({countByStatus(tab)})</span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('workOrders.searchPlaceholder')} className="pl-10 h-10" />
                </div>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[140px] h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('common.all')}</SelectItem>
                        <SelectItem value="internal">{t('workOrders.sourceInternal')}</SelectItem>
                        <SelectItem value="optician">{t('repairs.optician')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <ListSkeleton />
            ) : workOrders.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Wrench className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('workOrders.noWorkOrders')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
                        {t('workOrders.noWorkOrdersDesc')}
                    </p>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto overflow-y-auto max-h-[340px]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted border-b sticky top-0 z-10">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('workOrders.clientOrShop')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('repairs.source')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('workOrders.services')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('workOrders.expectedDate')}</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.status')}</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('workOrders.price')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {workOrders.map((wo) => {
                                const clientName = wo.order?.client
                                    ? `${wo.order.client.name} ${wo.order.client.familyName}`
                                    : wo.opticianShop?.name || '—'
                                const dueDate = wo.expectedCompletionDate
                                const isDueBadgeActive = dueDate !== null && (wo.status === 'pending' || wo.status === 'in_progress')
                                const daysLeft = isDueBadgeActive && dueDate ? daysUntil(dueDate) : null
                                return (
                                    <tr
                                        key={wo.id}
                                        className="row-hover cursor-pointer"
                                        onClick={() => { setSelectedWO(wo); setDetailOpen(true) }}
                                    >
                                        <td className="py-3 px-4 font-medium">{clientName}</td>
                                        <td className="py-3 px-4 text-sm capitalize">{wo.source === 'internal' ? t('workOrders.sourceInternal') : t('repairs.optician')}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            <div className="flex flex-wrap gap-1">
                                                {wo.workOrderServices.map((s) => (
                                                    <Badge key={s.id} variant="secondary" className="text-xs">{s.repairService.name}</Badge>
                                                ))}
                                            {wo.workOrderServices.length === 0 && '—'}
                                        </div>
                                    </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {dueDate ? (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span>{formatDate(dueDate)}</span>
                                                    {daysLeft !== null && daysLeft < 0 && (
                                                        <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
                                                            {t('repairs.overdue')}
                                                        </Badge>
                                                    )}
                                                    {daysLeft === 0 && (
                                                        <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                                                            {t('workOrders.dueToday')}
                                                        </Badge>
                                                    )}
                                                    {daysLeft !== null && daysLeft >= 1 && daysLeft <= 3 && (
                                                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                                                            {t('workOrders.dueInDays', { n: daysLeft })}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant="outline" className={`text-xs ${STATUS_BADGE[wo.status] || ''}`}>
                                                {statusLabel(wo.status)}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm">{parseFloat(wo.servicePrice).toFixed(3)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <WorkOrderDetailDialog
                workOrder={selectedWO}
                open={detailOpen}
                onOpenChange={(open) => { if (!open) setSelectedWO(null); setDetailOpen(open) }}
                onUpdated={reFetch}
            />

            <NewWorkOrderDialog
                open={newWOOpen}
                onOpenChange={setNewWOOpen}
                onCreated={reFetch}
            />
        </div>
    )
}
