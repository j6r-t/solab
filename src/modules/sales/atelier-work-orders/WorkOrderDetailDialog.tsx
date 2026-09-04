'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { Loader2, Printer, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { PaginatedResponse } from '@/lib/api/pagination'

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

export function WorkOrderDetailDialog({ workOrder, open, onOpenChange, onUpdated }: WorkOrderDetailDialogProps) {
    const [loading, setLoading] = useState(false)
    const [lensBlanks, setLensBlanks] = useState<LensBlank[]>([])
    const [assignLeft, setAssignLeft] = useState('')
    const [assignRight, setAssignRight] = useState('')
    const [lensBlankPrice, setLensBlankPrice] = useState(0)
    const [paymentAmount, setPaymentAmount] = useState('')

    useEffect(() => {
        if (open) {
            fetch('/api/lens-blanks?lowStock=false')
                .then((res): Promise<PaginatedResponse<LensBlank> | LensBlank[]> => res.ok ? res.json() : Promise.resolve([]))
                .then((json) => setLensBlanks(Array.isArray(json) ? json : (json?.data ?? [])))
                .catch(() => {})
        }
    }, [open])

    // Sync lens assignment state when a different work order is opened (render-phase state adjustment)
    const [syncedWoId, setSyncedWoId] = useState<string | null>(workOrder?.id ?? null)
    if ((workOrder?.id ?? null) !== syncedWoId) {
        setSyncedWoId(workOrder?.id ?? null)
        setAssignLeft(workOrder?.lensBlankLeft?.id || '')
        setAssignRight(workOrder?.lensBlankRight?.id || '')
        setLensBlankPrice(workOrder?.lensBlankPrice ? parseFloat(workOrder.lensBlankPrice) : 0)
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

    async function handleRecordPayment() {
        if (!workOrder || !paymentAmount) return
        const amount = parseFloat(paymentAmount)
        if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return }
        setLoading(true)
        try {
            const res = await fetch(`/api/repairs/${workOrder.id}?action=record-payment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            })
            if (!res.ok) throw new Error('Failed to record payment')
            toast.success('Payment recorded')
            setPaymentAmount('')
            onUpdated()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to record payment')
        } finally {
            setLoading(false)
        }
    }

    if (!workOrder) return null

    const hasLensBlanks = lensBlanks.length > 0
    const clientName = workOrder.order?.client
        ? `${workOrder.order.client.name} ${workOrder.order.client.familyName}`
        : workOrder.opticianShop?.name || '—'

    const blankOptions: SearchSelectOption[] = lensBlanks
        .filter((lb) => lb.quantity > 0)
        .map((lb) => ({
            value: lb.id,
            label: `${lb.brand} ${lb.lensType} ${lb.thickness} (${lb.quantity})`,
            secondary: `SPH ${lb.sph} · CYL ${lb.cyl}`,
        }))

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
                            <p className="font-medium">{new Date(workOrder.createdAt).toLocaleDateString()}</p>
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

                    {/* Breakage */}
                    {workOrder.brokenLensBlank && workOrder.brokenLensBlank !== 'none' && (
                        <div className="space-y-1 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-xs font-medium text-red-600">⚠ Breakage Reported</p>
                            <p>Broken: {workOrder.brokenLensBlank}</p>
                            {workOrder.replacementLeft && <p>Replacement L: {workOrder.replacementLeft.brand} ({workOrder.replacementLeft.thickness})</p>}
                            {workOrder.replacementRight && <p>Replacement R: {workOrder.replacementRight.brand} ({workOrder.replacementRight.thickness})</p>}
                        </div>
                    )}

                    {/* Bill */}
                    {workOrder.bill && (
                        <div className="space-y-1 text-sm p-3 bg-muted/20 rounded-lg border">
                            <p className="text-xs font-medium text-muted-foreground">Facture</p>
                            <p>N° {workOrder.bill.billNumber}</p>
                            <p>Total: {Number(workOrder.bill.totalAmount).toFixed(3)} TND · Payé: {Number(workOrder.bill.paidAmount).toFixed(3)} TND</p>
                            <Badge variant="outline" className={
                                workOrder.bill.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                workOrder.bill.status === 'partiallyPaid' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                'bg-red-100 text-red-700 border-red-200'
                            }>
                                {workOrder.bill.status === 'paid' ? 'Payée' : workOrder.bill.status === 'partiallyPaid' ? 'Partiel' : 'Impayée'}
                            </Badge>
                        </div>
                    )}

                    {/* Payment */}
                    <div className="space-y-2 p-3 bg-muted/20 rounded-lg border">
                        <h3 className="text-sm font-medium">Payment</h3>
                        {(() => {
                            const totalDue = parseFloat(workOrder.servicePrice) + parseFloat(workOrder.lensBlankPrice || '0')
                            const paid = parseFloat(workOrder.amountPaid)
                            const remaining = totalDue - paid
                            const pStatus = workOrder.paymentStatus
                            return (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Due:</span>
                                        <span className="font-medium">{totalDue.toFixed(3)} TND</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Paid:</span>
                                        <span className="font-medium">{paid.toFixed(3)} TND</span>
                                    </div>
                                    {remaining > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Remaining:</span>
                                            <span className="font-medium text-destructive">{remaining.toFixed(3)} TND</span>
                                        </div>
                                    )}
                                    <Badge variant="outline" className={
                                        pStatus === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                        pStatus === 'partial' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                        'bg-red-100 text-red-700 border-red-200'
                                    }>
                                        {pStatus === 'paid' ? 'Paid' : pStatus === 'partial' ? 'Partially Paid' : 'Unpaid'}
                                    </Badge>
                                    {pStatus !== 'paid' && (
                                        <div className="flex gap-2 pt-1">
                                            <Input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                placeholder="Amount"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                className="h-9 flex-1"
                                            />
                                            <Button size="sm" onClick={handleRecordPayment} disabled={loading || !paymentAmount}>
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Payment'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                    </div>

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
                            <Button size="sm" variant="outline">
                                <Printer className="h-3.5 w-3.5 mr-1" />
                                Print Bill
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
