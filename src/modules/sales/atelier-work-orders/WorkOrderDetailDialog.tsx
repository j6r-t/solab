'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { AlertTriangle, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useLensBlanks } from '@/modules/inventory/lens-blanks/useLensBlanks'
import { fetchOpticianShopBill, type OpticianShopBillPayment } from '@/modules/partners/optician-shop-bills/optician-shop-bills.api'
import { declareBreakage } from '../repairs/repairs.api'
import { PaymentDialog, type PaymentTarget } from './PaymentDialog'
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
    opticianShop: { id: string; name: string } | null
    prescription: {
        id: string
        sphRight: string; cylRight: string; axisRight: number; addRight: string; pdRight: number
        sphLeft: string; cylLeft: string; axisLeft: number; addLeft: string; pdLeft: number
        thickness: string | null; lensType: string | null; material: string | null; coating: string | null
        notes: string | null
    } | null
    bill: {
        id: string; billNumber: string; totalAmount: string; paidAmount: string; status: string
    } | null
    order: { id: string; orderNumber: number; client: { id: string; name: string; familyName: string; phone: string } } | null
    createdAt: string
}

interface LensBlank {
    id: string
    brand: string
    lensType: string
    material: string
    coating: string
    thickness: string
    sph: string
    cyl: string
    sellingPrice: string
    costPrice: string
    quantity: number
}

interface WorkOrderDetailDialogProps {
    workOrder: WorkOrder | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdated: () => void
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: ['delivered'],
    delivered: [],
    cancelled: [],
}

const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    delivered: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const BILL_STATUS_BADGE: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 border-green-200',
    partiallyPaid: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    unpaid: 'bg-red-100 text-red-700 border-red-200',
}

const WO_PAYMENT_STATUS_BADGE: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 border-green-200',
    partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    pending: 'bg-red-100 text-red-700 border-red-200',
}

const EPSILON = 0.000001

export function WorkOrderDetailDialog({ workOrder, open, onOpenChange, onUpdated }: WorkOrderDetailDialogProps) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)
    const [assignLeft, setAssignLeft] = useState('')
    const [assignRight, setAssignRight] = useState('')
    const [lensBlankPrice, setLensBlankPrice] = useState(0)
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [breakageEye, setBreakageEye] = useState<'left' | 'right' | 'both'>('left')
    const [breakageReplLeft, setBreakageReplLeft] = useState('')
    const [breakageReplRight, setBreakageReplRight] = useState('')

    const { data: blanksData } = useLensBlanks<LensBlank[]>({ lowStock: 'false' })
    const lensBlanks = blanksData ?? []

    // Fresh invoice (with payment history) fetched while the dialog is open
    const billRow = workOrder?.bill ?? null
    const billId = billRow?.id ?? null
    const { data: billDetail } = useQuery({
        queryKey: ['optician-shop-bill', billId],
        queryFn: () => fetchOpticianShopBill(billId!),
        enabled: open && !!billId,
    })

    // Refetch blank quantities every time the dialog opens
    useEffect(() => {
        if (open) queryClient.invalidateQueries({ queryKey: ['lens-blanks'] })
    }, [open, queryClient])

    // Sync lens assignment state when a different work order is opened (render-phase state adjustment)
    const [syncedWoId, setSyncedWoId] = useState<string | null>(workOrder?.id ?? null)
    if ((workOrder?.id ?? null) !== syncedWoId) {
        setSyncedWoId(workOrder?.id ?? null)
        setAssignLeft(workOrder?.lensBlankLeft?.id || '')
        setAssignRight(workOrder?.lensBlankRight?.id || '')
        setLensBlankPrice(workOrder?.lensBlankPrice ? parseFloat(workOrder.lensBlankPrice) : 0)
        setBreakageEye('left')
        setBreakageReplLeft('')
        setBreakageReplRight('')
    }

    async function handleStatusTransition(status: string) {
        if (!workOrder) return
        setLoading(true)
        try {
            const res = await fetch(`/api/repairs/${workOrder.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (!res.ok) throw new Error('Failed to update status')
            toast.success(`Status updated to ${status}`)
            onUpdated()
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update')
        } finally {
            setLoading(false)
        }
    }

    async function handleAssignLensBlanks() {
        if (!workOrder) return
        setLoading(true)
        try {
            const res = await fetch(`/api/repairs/${workOrder.id}?action=assign-lens-blanks`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lensBlankLeftId: assignLeft || undefined,
                    lensBlankRightId: assignRight || undefined,
                    lensBlankPrice: lensBlankPrice || undefined,
                }),
            })
            if (!res.ok) throw new Error('Failed to assign lens blanks')
            toast.success('Lens blanks assigned')
            onUpdated()
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to assign')
        } finally {
            setLoading(false)
        }
    }

    async function handleDeclareBreakage() {
        if (!workOrder) return
        setLoading(true)
        try {
            await declareBreakage(workOrder.id, {
                which: breakageEye,
                replacementLeftId: (breakageEye === 'left' || breakageEye === 'both') && breakageReplLeft ? breakageReplLeft : undefined,
                replacementRightId: (breakageEye === 'right' || breakageEye === 'both') && breakageReplRight ? breakageReplRight : undefined,
            })
            toast.success(t('workOrders.breakage.saved'))
            onUpdated()
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to declare breakage')
        } finally {
            setLoading(false)
        }
    }

    if (!workOrder) return null

    const hasLensBlanks = lensBlanks.length > 0
    const clientName = workOrder.order?.client
        ? `${workOrder.order.client.name} ${workOrder.order.client.familyName}`
        : workOrder.opticianShop?.name || '—'

    // Invoice figures — the fetched bill (with payment history) is the source of
    // truth; fall back to the work order row's bill summary while loading.
    const billTotal = parseFloat(billDetail?.totalAmount ?? workOrder.bill?.totalAmount ?? '0')
    const billPaid = parseFloat(billDetail?.paidAmount ?? workOrder.bill?.paidAmount ?? '0')
    const billRemaining = Math.max(0, billTotal - billPaid)
    const billStatus = billDetail?.status ?? workOrder.bill?.status ?? 'unpaid'
    const billPayments: OpticianShopBillPayment[] = billDetail?.payments ?? []
    // Grouped bills are frozen — payments go on the consolidated invoice
    const billGrouped = !!billDetail?.groupedIntoId
    const billGroupedInvoiceNumber = billDetail?.groupedInvoiceNumber ?? null

    // Amount-only ledger for internal work orders (no bill)
    const totalDue = parseFloat(workOrder.servicePrice) + parseFloat(workOrder.lensBlankPrice || '0')
    const woPaid = parseFloat(workOrder.amountPaid)
    const woRemaining = Math.max(0, totalDue - woPaid)

    const paymentTarget: PaymentTarget | null = workOrder.bill
        ? { kind: 'bill', id: workOrder.bill.id, total: billTotal, paid: billPaid, remaining: billRemaining }
        : { kind: 'workorder', id: workOrder.id, total: totalDue, paid: woPaid, remaining: woRemaining }

    function handlePaymentDone() {
        if (workOrder?.bill) queryClient.invalidateQueries({ queryKey: ['optician-shop-bill', workOrder.bill.id] })
        onUpdated()
    }

    function paymentMethodLabel(p: OpticianShopBillPayment): string {
        if (p.method === 'cheque') return p.cheque?.type === 'traite' ? t('payments.traite') : t('payments.cheque')
        if (p.method === 'card') return t('payments.card')
        return t('payments.cash')
    }

    function instrumentBadge(p: OpticianShopBillPayment): { label: string; cls: string } | null {
        if (!p.cheque) return null
        if (p.cheque.status === 'cashed') return { label: t('payments.statusCleared'), cls: 'bg-green-100 text-green-700 border-green-200' }
        if (p.cheque.status === 'bounced') return { label: t('payments.statusBounced'), cls: 'bg-red-100 text-red-700 border-red-200' }
        return { label: t('payments.statusPending'), cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    }

    const blankOptions: SearchSelectOption[] = lensBlanks
        .filter((lb) => lb.quantity > 0)
        .map((lb) => ({
            value: lb.id,
            label: `${lb.brand} ${lb.lensType} ${lb.thickness} (${lb.quantity})`,
            secondary: `SPH ${lb.sph} · CYL ${lb.cyl}`,
        }))

    const inStockBlanks = lensBlanks.filter((lb) => lb.quantity > 0)
    const breakageDeclared = !!workOrder.brokenLensBlank && workOrder.brokenLensBlank !== 'none'
    const canDeclareBreakage = !!(workOrder.lensBlankLeft || workOrder.lensBlankRight) && !breakageDeclared

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Work Order #{workOrder.id.slice(0, 8)}
                        <Badge variant="outline" className={`ml-2 ${STATUS_BADGE[workOrder.status] || ''}`}>
                            {workOrder.status}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs">Client / Shop</p>
                            <p className="font-medium">{clientName}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Source</p>
                            <p className="font-medium capitalize">{workOrder.source}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Services</p>
                            <div className="flex flex-wrap gap-1">
                                {workOrder.workOrderServices.map((s) => (
                                    <Badge key={s.id} variant="secondary" className="text-xs">{s.repairService.name}</Badge>
                                ))}
                                {workOrder.workOrderServices.length === 0 && <span className="text-muted-foreground">—</span>}
                            </div>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Service Price</p>
                            <p className="font-medium">{parseFloat(workOrder.servicePrice).toFixed(3)} TND</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Created</p>
                            <p className="font-medium">{formatDate(workOrder.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{t('workOrders.expectedDate')}</p>
                            <p className="font-medium">
                                {workOrder.expectedCompletionDate
                                    ? formatDate(workOrder.expectedCompletionDate)
                                    : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Prescription */}
                    {workOrder.prescription && (
                        <div className="space-y-2 p-3 bg-muted/20 rounded-lg border">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Ordonnance
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-muted-foreground mb-1">Œil droit</p>
                                    <p>SPH: {workOrder.prescription.sphRight} · CYL: {workOrder.prescription.cylRight}</p>
                                    <p>AXIS: {workOrder.prescription.axisRight} · ADD: {workOrder.prescription.addRight}</p>
                                    <p>PD: {workOrder.prescription.pdRight}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Œil gauche</p>
                                    <p>SPH: {workOrder.prescription.sphLeft} · CYL: {workOrder.prescription.cylLeft}</p>
                                    <p>AXIS: {workOrder.prescription.axisLeft} · ADD: {workOrder.prescription.addLeft}</p>
                                    <p>PD: {workOrder.prescription.pdLeft}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {workOrder.prescription.thickness && <span>Ép: {workOrder.prescription.thickness}</span>}
                                {workOrder.prescription.lensType && <span>Type: {workOrder.prescription.lensType}</span>}
                                {workOrder.prescription.material && <span>Mat: {workOrder.prescription.material}</span>}
                                {workOrder.prescription.coating && <span>Traitement: {workOrder.prescription.coating}</span>}
                            </div>
                            {workOrder.prescription.notes && (
                                <p className="text-xs text-muted-foreground italic">{workOrder.prescription.notes}</p>
                            )}
                        </div>
                    )}

                    {/* Lens Blanks assignment */}
                    <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                        <h3 className="text-sm font-medium">Lens Blanks</h3>
                        {!hasLensBlanks ? (
                            <p className="text-sm text-muted-foreground">No lens blanks in stock. Add some first.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">Left Eye</label>
                                        <SearchSelect
                                            options={[{ value: '', label: 'None' }, ...blankOptions]}
                                            value={assignLeft}
                                            onChange={setAssignLeft}
                                            placeholder="Select..."
                                            title="Left Eye Lens Blank"
                                            searchPlaceholder="Search by brand, type..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">Right Eye</label>
                                        <SearchSelect
                                            options={[{ value: '', label: 'None' }, ...blankOptions]}
                                            value={assignRight}
                                            onChange={setAssignRight}
                                            placeholder="Select..."
                                            title="Right Eye Lens Blank"
                                            searchPlaceholder="Search by brand, type..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Blank Price (TND)</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={lensBlankPrice}
                                        onChange={(e) => setLensBlankPrice(parseFloat(e.target.value) || 0)}
                                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    />
                                </div>
                                <Button size="sm" onClick={handleAssignLensBlanks} disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign & Save'}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Assigned blanks display */}
                    {workOrder.lensBlankLeft && (
                        <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground text-xs">Assigned Lens Blanks</p>
                            <p>Left: {workOrder.lensBlankLeft.brand} {workOrder.lensBlankLeft.lensType} {workOrder.lensBlankLeft.thickness} — {Number(workOrder.lensBlankLeft.sellingPrice).toFixed(3)} TND</p>
                            {workOrder.lensBlankRight && (
                                <p>Right: {workOrder.lensBlankRight.brand} {workOrder.lensBlankRight.lensType} {workOrder.lensBlankRight.thickness} — {Number(workOrder.lensBlankRight.sellingPrice).toFixed(3)} TND</p>
                            )}
                            {workOrder.lensBlankPrice && (
                                <p>Blank price: {parseFloat(workOrder.lensBlankPrice).toFixed(3)} TND</p>
                            )}
                        </div>
                    )}

                    {/* Breakage declaration */}
                    {canDeclareBreakage && (
                        <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                {t('workOrders.breakage.declare')}
                            </h3>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">{t('workOrders.breakage.whichEye')}</label>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    {(['left', 'right', 'both'] as const).map((eye) => (
                                        <label key={eye} className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="breakage-eye"
                                                checked={breakageEye === eye}
                                                onChange={() => setBreakageEye(eye)}
                                            />
                                            {t(`workOrders.breakage.${eye}`)}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {(breakageEye === 'left' || breakageEye === 'both') && (
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">
                                        {t('workOrders.breakage.replacement')} — {t('workOrders.breakage.left')}
                                    </label>
                                    <select
                                        value={breakageReplLeft}
                                        onChange={(e) => setBreakageReplLeft(e.target.value)}
                                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">{t('workOrders.breakage.noReplacement')}</option>
                                        {inStockBlanks.map((lb) => (
                                            <option key={lb.id} value={lb.id}>
                                                {`${lb.brand} ${lb.thickness} (${lb.sph}/${lb.cyl}) — qté ${lb.quantity}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {(breakageEye === 'right' || breakageEye === 'both') && (
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">
                                        {t('workOrders.breakage.replacement')} — {t('workOrders.breakage.right')}
                                    </label>
                                    <select
                                        value={breakageReplRight}
                                        onChange={(e) => setBreakageReplRight(e.target.value)}
                                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">{t('workOrders.breakage.noReplacement')}</option>
                                        {inStockBlanks.map((lb) => (
                                            <option key={lb.id} value={lb.id}>
                                                {`${lb.brand} ${lb.thickness} (${lb.sph}/${lb.cyl}) — qté ${lb.quantity}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">{t('workOrders.breakage.replacementHint')}</p>
                            <Button size="sm" variant="destructive" onClick={handleDeclareBreakage} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('workOrders.breakage.declare')}
                            </Button>
                        </div>
                    )}

                    {/* Breakage */}
                    {breakageDeclared && (
                        <div className="space-y-1 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {t('workOrders.breakage.reported')}
                            </p>
                            <p>{t('workOrders.breakage.broken')}: {t(`workOrders.breakage.${workOrder.brokenLensBlank}`)}</p>
                            {workOrder.replacementLeft && <p>{t('workOrders.breakage.replacement')} L: {workOrder.replacementLeft.brand} ({workOrder.replacementLeft.thickness})</p>}
                            {workOrder.replacementRight && <p>{t('workOrders.breakage.replacement')} R: {workOrder.replacementRight.brand} ({workOrder.replacementRight.thickness})</p>}
                        </div>
                    )}

                    {/* Invoice & payments */}
                    {workOrder.bill ? (
                        <div className="space-y-3 p-3 bg-muted/20 rounded-lg border">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-medium">
                                    {t('payments.invoice')} — {workOrder.bill.billNumber}
                                </h3>
                                <Badge variant="outline" className={BILL_STATUS_BADGE[billStatus] || ''}>
                                    {billStatus === 'paid' ? t('orders.fullyPaid') : billStatus === 'partiallyPaid' ? t('orders.partiallyPaid') : t('orders.unpaid')}
                                </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('payments.total')}:</span>
                                    <span className="font-medium">{billTotal.toFixed(3)} TND</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('payments.paid')}:</span>
                                    <span className="font-medium">{billPaid.toFixed(3)} TND</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('payments.remaining')}:</span>
                                    <span className={`font-medium ${billRemaining > EPSILON ? 'text-destructive' : ''}`}>{billRemaining.toFixed(3)} TND</span>
                                </div>
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[340px]">
                                <p className="text-xs font-medium text-muted-foreground">{t('payments.history')}</p>
                                {billPayments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">{t('payments.noPayments')}</p>
                                ) : (
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-muted-foreground border-b bg-muted sticky top-0 z-10">
                                                <th className="py-1 font-medium">{t('payments.date')}</th>
                                                <th className="py-1 font-medium">{t('payments.method')}</th>
                                                <th className="py-1 font-medium text-right">{t('payments.amount')}</th>
                                                <th className="py-1 font-medium">{t('payments.status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {billPayments.map((p) => {
                                                const badge = instrumentBadge(p)
                                                return (
                                                    <tr key={p.id} className="border-b last:border-0">
                                                        <td className="py-1 pr-2">
                                                            {formatDate(p.paidAt)}
                                                        </td>
                                                        <td className="py-1 pr-2">
                                                            {paymentMethodLabel(p)}
                                                            {p.cheque?.number && <span className="text-muted-foreground"> · {p.cheque.number}</span>}
                                                        </td>
                                                        <td className="py-1 pr-2 text-right">{parseFloat(p.amount).toFixed(3)} TND</td>
                                                        <td className="py-1">
                                                            {badge ? (
                                                                <Badge variant="outline" className={`px-1 py-0 text-[10px] ${badge.cls}`}>{badge.label}</Badge>
                                                            ) : (
                                                                '—'
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {billGrouped ? (
                                <p className="text-xs text-muted-foreground">
                                    {t('workOrders.groupedHint', { invoiceNumber: billGroupedInvoiceNumber ?? '—' })}
                                </p>
                            ) : (
                                billRemaining > EPSILON && (
                                    <Button size="sm" onClick={() => setPaymentOpen(true)} className="w-full">
                                        {t('payments.recordPayment')}
                                    </Button>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2 p-3 bg-muted/20 rounded-lg border">
                            <h3 className="text-sm font-medium">{t('orders.payment')}</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('payments.total')}:</span>
                                    <span className="font-medium">{totalDue.toFixed(3)} TND</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('payments.paid')}:</span>
                                    <span className="font-medium">{woPaid.toFixed(3)} TND</span>
                                </div>
                                {woRemaining > EPSILON && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('payments.remaining')}:</span>
                                        <span className="font-medium text-destructive">{woRemaining.toFixed(3)} TND</span>
                                    </div>
                                )}
                            </div>
                            <Badge variant="outline" className={WO_PAYMENT_STATUS_BADGE[workOrder.paymentStatus] || ''}>
                                {workOrder.paymentStatus === 'paid' ? t('orders.fullyPaid') : workOrder.paymentStatus === 'partial' ? t('orders.partiallyPaid') : t('orders.unpaid')}
                            </Badge>
                            {workOrder.paymentStatus !== 'paid' && woRemaining > EPSILON && (
                                <Button size="sm" onClick={() => setPaymentOpen(true)} className="w-full">
                                    {t('payments.recordPayment')}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Actions</h3>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_TRANSITIONS[workOrder.status]?.map((nextStatus) => (
                                <Button
                                    key={nextStatus}
                                    size="sm"
                                    variant={nextStatus === 'cancelled' ? 'destructive' : 'default'}
                                    onClick={() => handleStatusTransition(nextStatus)}
                                    disabled={loading}
                                >
                                    Mark {nextStatus.replace('_', ' ')}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <PaymentDialog
                    open={paymentOpen}
                    onOpenChange={setPaymentOpen}
                    target={paymentTarget}
                    onDone={handlePaymentDone}
                />
            </DialogContent>
        </Dialog>
    )
}
