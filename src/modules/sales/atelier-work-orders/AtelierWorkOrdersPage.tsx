'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Loader2, Wrench } from 'lucide-react'
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

export function AtelierWorkOrdersPage() {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [statusTab, setStatusTab] = useState<string>('all')
    const [sourceFilter, setSourceFilter] = useState('')
    const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [newWOOpen, setNewWOOpen] = useState(false)

    const debouncedSearch = useDebounce(search, 300)

    const { data: workOrdersData, isLoading: loading, refetch: reFetch } = useRepairs<WorkOrder[]>({
        search: debouncedSearch,
        status: statusTab !== 'all' ? statusTab : undefined,
        source: sourceFilter,
    })
    const workOrders = workOrdersData ?? []

    const countByStatus = (status: string) => status === 'all'
        ? workOrders.length
        : workOrders.filter((wo) => wo.status === status).length

    const pendingCount = workOrders.filter((wo) => wo.status === 'pending' || wo.status === 'in_progress').length

    return (
        <div className="space-y-6 max-w-[1000px]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-medium">Atelier Work Orders</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage mounting and repair jobs from shop and opticians</p>
                </div>
                <Button onClick={() => setNewWOOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Work Order
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold mt-1">{workOrders.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Pending / Active</p>
                    <p className="text-lg font-semibold mt-1 text-amber-600">{pendingCount}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-lg font-semibold mt-1 text-green-600">{countByStatus('completed')}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Delivered</p>
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
                        {tab === 'all' ? 'All' : tab.replace('_', ' ')}
                        <span className="ml-1.5 text-xs text-muted-foreground">({countByStatus(tab)})</span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client or shop..." className="pl-10 h-10" />
                </div>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[140px] h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('common.all')}</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="optician">Optician</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : workOrders.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Wrench className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">No work orders</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
                        Work orders appear here when created from orders or directly for optician shops.
                    </p>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/30 border-b">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client / Shop</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Source</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Services</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {workOrders.map((wo) => {
                                const clientName = wo.order?.client
                                    ? `${wo.order.client.name} ${wo.order.client.familyName}`
                                    : wo.opticianShop?.name || '—'
                                return (
                                    <tr
                                        key={wo.id}
                                        className="row-hover cursor-pointer"
                                        onClick={() => { setSelectedWO(wo); setDetailOpen(true) }}
                                    >
                                        <td className="py-3 px-4 font-medium">{clientName}</td>
                                        <td className="py-3 px-4 text-sm capitalize">{wo.source}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            <div className="flex flex-wrap gap-1">
                                                {wo.workOrderServices.map((s) => (
                                                    <Badge key={s.id} variant="secondary" className="text-xs">{s.repairService.name}</Badge>
                                                ))}
                                                {wo.workOrderServices.length === 0 && '—'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant="outline" className={`text-xs ${STATUS_BADGE[wo.status] || ''}`}>
                                                {wo.status.replace('_', ' ')}
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
