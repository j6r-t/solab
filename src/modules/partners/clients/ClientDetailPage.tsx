'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useViewStore } from '@/stores/view-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
    ArrowLeft,
    Package,
    Calendar,
    Phone,
    MapPin,
    Loader2,
    FileText,
    Eye,
    EyeOff,
    Stethoscope,
    Pencil,
    Trash2,
    type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useClient } from './useClients'
import { useOrders } from '@/modules/sales/orders/useOrders'
import { usePrescriptions } from '@/modules/sales/prescriptions/usePrescriptions'
import {
    createPrescription,
    updatePrescription,
    deletePrescription,
    type Prescription,
} from '@/modules/sales/prescriptions/prescriptions.api'
import { PrescriptionForm } from '@/modules/sales/prescriptions/PrescriptionForm'
import type { PrescriptionFormData } from '@/modules/sales/prescriptions/prescription.schema'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'orders.pending', variant: 'secondary' },
    ready: { label: 'orders.ready', variant: 'default' },
    completed: { label: 'orders.completed', variant: 'outline' },
    cancelled: { label: 'orders.cancelled', variant: 'destructive' },
}

const paymentBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    unpaid: { label: 'orders.unpaid', variant: 'destructive' },
    partiallyPaid: { label: 'orders.partiallyPaid', variant: 'secondary' },
    fullyPaid: { label: 'orders.fullyPaid', variant: 'default' },
}

function EyeValues({ icon: Icon, label, sph, cyl, axis, add, pd }: {
    icon: LucideIcon
    label: string
    sph: string
    cyl: string
    axis: number
    add: string
    pd: number
}) {
    const { t } = useTranslation()
    const cells = [
        { label: t('prescriptions.sph'), value: sph },
        { label: t('prescriptions.cyl'), value: cyl },
        { label: t('prescriptions.axis'), value: `${axis}°` },
        { label: t('prescriptions.add'), value: add },
        { label: t('prescriptions.pd'), value: pd },
    ]
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <div className="grid grid-cols-5 gap-1 bg-muted/30 rounded-lg p-1.5 text-center">
                {cells.map((cell) => (
                    <div key={cell.label} className="rounded p-1 bg-background border">
                        <p className="text-[10px] text-muted-foreground">{cell.label}</p>
                        <p className="font-semibold text-xs">{cell.value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function ClientDetailPage() {
    const { t } = useTranslation()
    const { viewParams, goBack, setView } = useViewStore()
    const clientId = viewParams.id

    const { data: clientData, isLoading: clientLoading } = useClient(clientId)
    const { data: ordersData, isLoading: ordersLoading } = useOrders({ clientId })
    const { data: prescriptionsData, isLoading: prescriptionsLoading } = usePrescriptions({ clientId })
    const client = clientData ?? null
    const orders = ordersData ?? []
    const prescriptions = prescriptionsData ?? []
    const loading = clientLoading || ordersLoading || prescriptionsLoading

    const [formOpen, setFormOpen] = useState(false)
    const [editPrescription, setEditPrescription] = useState<Prescription | null>(null)
    const [detailsPrescription, setDetailsPrescription] = useState<Prescription | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Prescription | null>(null)
    const [saving, setSaving] = useState(false)
    const queryClient = useQueryClient()

    async function invalidatePrescriptions() {
        await queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
    }

    async function handleCreate(data: PrescriptionFormData) {
        setSaving(true)
        try {
            await createPrescription(data)
            toast.success(t('prescriptions.created'))
            setFormOpen(false)
            await invalidatePrescriptions()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create prescription')
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdate(data: PrescriptionFormData) {
        if (!editPrescription) return
        setSaving(true)
        try {
            await updatePrescription(editPrescription.id, data)
            toast.success(t('prescriptions.updated'))
            setEditPrescription(null)
            setFormOpen(false)
            await invalidatePrescriptions()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update prescription')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(prescription: Prescription) {
        try {
            await deletePrescription(prescription.id)
            toast.success(t('prescriptions.deleted'))
            setDeleteTarget(null)
            await invalidatePrescriptions()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete prescription')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!client) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">{t('common.noResults')}</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft className="h-4 w-4" />
                {t('common.back')}
            </button>

            <div className="border rounded-xl bg-card p-5 space-y-3">
                <h2 className="text-xl font-semibold">{client.name} {client.familyName}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {client.phone}</span>
                    {client.address && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {client.address}</span>}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        {t('prescriptions.title')}
                        <Badge variant="secondary">{prescriptions.length}</Badge>
                    </h3>
                    <Button size="sm" onClick={() => { setEditPrescription(null); setFormOpen(true) }}>
                        {t('prescriptions.newPrescription')}
                    </Button>
                </div>

                {prescriptions.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl bg-card">
                        <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">{t('clients.noPrescriptions')}</p>
                    </div>
                ) : (
                    <div className="border rounded-xl bg-card overflow-x-auto overflow-y-auto max-h-[340px]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted border-b sticky top-0 z-10">
                                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('billing.date')}</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('prescriptions.doctor')}</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">OD</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">OG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prescriptions.map((rx) => (
                                    <tr
                                        key={rx.id}
                                        className="border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                                        onClick={() => setDetailsPrescription(rx)}
                                    >
                                        <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(rx.dateWritten || rx.createdAt)}</td>
                                        <td className="px-4 py-2.5">{rx.doctor?.name ?? '—'}</td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">{`${rx.sphRight} (${rx.cylRight} , ${rx.axisRight}°)`}</td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">{`${rx.sphLeft} (${rx.cylLeft} , ${rx.axisLeft}°)`}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        {t('orders.title')}
                    </h3>
                    <Button size="sm" onClick={() => setView('orders', { clientId })}>
                        {t('orders.newOrder')}
                    </Button>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl bg-card">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">{t('orders.noOrders')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => {
                            const sb = statusBadge[order.status] || statusBadge.pending
                            const pb = paymentBadge[order.paymentStatus] || paymentBadge.unpaid
                            return (
                                <div key={order.id} className="border rounded-xl bg-card p-4 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setView('orders')}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium">#{order.orderNumber}</span>
                                                <Badge variant={sb.variant}>{t(sb.label)}</Badge>
                                                <Badge variant={pb.variant}>{t(pb.label)}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(order.createdAt)}</span>
                                                <span>{order.items?.length || 0} {t('orders.items')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-semibold">{formatCurrency(parseFloat(order.totalAmount))}</span>
                                        </div>
                                    </div>
                                    {order.items && order.items.length > 0 && (
                                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                                            {order.items.map((item) => (
                                                <span key={item.id} className="mr-4">{item.product?.name ?? item.name} x{item.quantity}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <Dialog open={!!detailsPrescription} onOpenChange={(open) => { if (!open) setDetailsPrescription(null) }}>
                <DialogContent className="w-full sm:max-w-lg">
                    {detailsPrescription && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{client.name} {client.familyName}</DialogTitle>
                                <DialogDescription>
                                    {formatDate(detailsPrescription.dateWritten || detailsPrescription.createdAt)}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                                <div className="rounded-lg border p-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <EyeValues
                                            icon={Eye}
                                            label={t('prescriptions.rightEye')}
                                            sph={detailsPrescription.sphRight}
                                            cyl={detailsPrescription.cylRight}
                                            axis={detailsPrescription.axisRight}
                                            add={detailsPrescription.addRight}
                                            pd={detailsPrescription.pdRight}
                                        />
                                        <EyeValues
                                            icon={EyeOff}
                                            label={t('prescriptions.leftEye')}
                                            sph={detailsPrescription.sphLeft}
                                            cyl={detailsPrescription.cylLeft}
                                            axis={detailsPrescription.axisLeft}
                                            add={detailsPrescription.addLeft}
                                            pd={detailsPrescription.pdLeft}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Stethoscope className="h-4 w-4 shrink-0" />
                                    <span>{t('prescriptions.doctor')}: <span className="font-medium text-foreground">{detailsPrescription.doctor?.name || '—'}</span></span>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button
                                        variant="secondary"
                                        onClick={() => { setDetailsPrescription(null); setEditPrescription(detailsPrescription); setFormOpen(true) }}
                                    >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        {t('common.edit')}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => { setDetailsPrescription(null); setDeleteTarget(detailsPrescription) }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t('common.delete')}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={formOpen} onOpenChange={(open) => { if (!open) setEditPrescription(null); setFormOpen(open) }}>
                <DialogContent className="w-full sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editPrescription ? t('common.edit') : t('prescriptions.newPrescription')}</DialogTitle>
                    </DialogHeader>
                    <PrescriptionForm
                        defaultValues={editPrescription ? {
                            clientId,
                            sphRight: parseFloat(editPrescription.sphRight),
                            cylRight: parseFloat(editPrescription.cylRight),
                            axisRight: editPrescription.axisRight,
                            addRight: parseFloat(editPrescription.addRight),
                            pdRight: editPrescription.pdRight,
                            sphLeft: parseFloat(editPrescription.sphLeft),
                            cylLeft: parseFloat(editPrescription.cylLeft),
                            axisLeft: editPrescription.axisLeft,
                            addLeft: parseFloat(editPrescription.addLeft),
                            pdLeft: editPrescription.pdLeft,
                            doctorId: editPrescription.doctor?.id || '',
                            dateWritten: editPrescription.dateWritten || undefined,
                        } : { clientId }}
                        preselectedClientId={editPrescription ? undefined : clientId}
                        preselectedClientName={editPrescription ? undefined : `${client.name} ${client.familyName}`}
                        onSubmit={editPrescription ? handleUpdate : handleCreate}
                        onCancel={() => { setEditPrescription(null); setFormOpen(false) }}
                        saving={saving}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('common.delete')}
                description={`${client.name} ${client.familyName}`}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />
        </div>
    )
}
