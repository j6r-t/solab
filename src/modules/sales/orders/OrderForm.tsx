'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useClients } from '@/modules/partners/clients/useClients'
import { useStockProducts } from '@/modules/inventory/stock/useStock'
import { fetchRepairServices } from '@/modules/system/settings/settings.api'
import { fetchPrescriptions } from '@/modules/sales/prescriptions/prescriptions.api'
import type { Prescription } from '@/modules/sales/prescriptions/prescriptions.api'
import { useAuthStore } from '@/stores/auth-store'
import {
    prescriptionLabel,
    newPaymentRow,
    type OrderFormProps,
    type OrderItemInput,
    type OrderPaymentInput,
    type OrderRepairInput,
    type PaymentRow,
    type PrescriptionOption,
    type Product,
    type RepairService,
    type Client,
    type LensBlankOption,
} from './order-form.types'
import { useQrProductScanner } from './useQrProductScanner'
import { QrScanDialog } from './QrScanDialog'
import { LensBlankPicker } from './LensBlankPicker'
import { NewPrescriptionDialog } from './NewPrescriptionDialog'
import { PaymentRowsEditor } from './PaymentRowsEditor'
import { OrderItemsSection } from './OrderItemsSection'
import { RepairsSection } from './RepairsSection'

export type { OrderFormData } from './order-form.types'

export function OrderForm({ defaultValues, onSubmit, onCancel, saving: externalSaving, forcedOrderType }: OrderFormProps) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const user = useAuthStore((s) => s.user)
    const today = new Date().toISOString().split('T')[0]
    const [clientSearch, setClientSearch] = useState('')
    const [productSearch] = useState('')
    const [orderType, setOrderType] = useState<'standard' | 'remounting' | 'direct_sale'>(forcedOrderType || defaultValues?.orderType || 'standard')
    const [selectedClientId, setSelectedClientId] = useState(defaultValues?.clientId || '')
    const [items, setItems] = useState<OrderItemInput[]>(defaultValues?.items || [])
    const [repairs, setRepairs] = useState<OrderRepairInput[]>(defaultValues?.repairs || [])
    const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full')
    const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([newPaymentRow()])
    const [internalSaving, setInternalSaving] = useState(false)
    const saving = internalSaving || externalSaving
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(defaultValues?.prescriptionId || '')
    const [expectedCompletionDate, setExpectedCompletionDate] = useState('')
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
    const [showNewRx, setShowNewRx] = useState(false)

    const { data: clientsData } = useClients({ search: clientSearch || undefined })
    const clients: Client[] = clientsData ?? []
    const { data: productsData } = useStockProducts({ search: productSearch || undefined })
    const products: Product[] = productsData ?? []
    const { data: prescriptionsData } = useQuery({
        queryKey: ['prescriptions', { clientId: selectedClientId }],
        queryFn: () => fetchPrescriptions({ clientId: selectedClientId }),
        enabled: !!selectedClientId,
    })
    const prescriptions: PrescriptionOption[] = prescriptionsData ?? []
    const { data: repairServicesData } = useQuery({
        queryKey: ['repair-services'],
        queryFn: () => fetchRepairServices(),
    })
    const repairServices: RepairService[] = repairServicesData ?? []

    const addItem = useCallback((product: Product) => {
        setItems((prev) => [...prev, { productId: product.id, quantity: 1, unitPrice: Number(product.price) || 0 }])
    }, [])

    const { qrScanOpen, openQrScan, closeQrScan, qrScanning, qrError, qrReaderId } = useQrProductScanner(addItem)

    if (prescriptions.length > 0 && !selectedPrescriptionId) {
        setSelectedPrescriptionId(prescriptions[0].id)
    }

    if (forcedOrderType && orderType !== forcedOrderType) {
        setOrderType(forcedOrderType)
    }

    function updateItem(index: number, field: keyof OrderItemInput, value: number) {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index))
    }

    function addRepair() {
        const date = expectedCompletionDate || new Date().toISOString().split('T')[0]
        setRepairs((prev) => [...prev, { type: '', price: 0, expectedCompletionDate: date }])
    }

    function updateRepair(index: number, field: keyof OrderRepairInput, value: string | number) {
        setRepairs((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
    }

    function removeRepair(index: number) {
        setRepairs((prev) => prev.filter((_, i) => i !== index))
    }

    function toggleRepairService(service: RepairService) {
        const isSelected = selectedServiceIds.includes(service.id)
        if (isSelected) {
            setSelectedServiceIds((prev) => prev.filter((id) => id !== service.id))
            setRepairs((prev) => prev.filter((r) => r.repairServiceId !== service.id))
        } else {
            setSelectedServiceIds((prev) => [...prev, service.id])
            const date = expectedCompletionDate || new Date().toISOString().split('T')[0]
            const isShop = user?.role === 'shop'
            setRepairs((prev) => [
                ...prev,
                {
                    type: service.name,
                    price: isShop ? 0 : parseFloat(service.defaultPrice),
                    expectedCompletionDate: date,
                    repairServiceId: service.id,
                },
            ])
        }
    }

    function updateServiceRepairDate(serviceId: string, date: string) {
        setRepairs((prev) => prev.map((r) => (r.repairServiceId === serviceId ? { ...r, expectedCompletionDate: date } : r)))
    }

    function addLensBlankAsItem(blank: LensBlankOption) {
        const isShop = user?.role === 'shop'
        const price = isShop ? Number(blank.costPrice) || 0 : Number(blank.sellingPrice) || 0
        const displayName = `${blank.brand} ${blank.lensType} ${blank.material} ${blank.thickness}`
        const existingIndex = items.findIndex((item) => item.lensBlankId === blank.id)
        if (existingIndex >= 0) {
            updateItem(existingIndex, 'quantity', items[existingIndex].quantity + 1)
        } else {
            setItems((prev) => [...prev, { lensBlankId: blank.id, quantity: 1, unitPrice: price, name: displayName, sellingPrice: Number(blank.sellingPrice) || 0 }])
        }
        toast.success(t('orders.blankAdded', { brand: blank.brand }))
    }

    function handlePrescriptionCreated(created: Prescription) {
        setSelectedPrescriptionId(created.id)
        queryClient.setQueryData<PrescriptionOption[]>(['prescriptions', { clientId: selectedClientId }], (old) => (old ? [...old, created] : [created]))
        queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setInternalSaving(true)
        try {
            let payments: OrderPaymentInput[]
            if (orderType === 'direct_sale') {
                payments = [{ amount: 0, type: 'full', method: 'cash' }]
            } else {
                const rows = paymentRows.map((r) => ({
                    ...r,
                    effAmount:
                        paymentType === 'full' && paymentRows.length === 1 && !(parseFloat(r.amount) > 0)
                            ? grandTotal
                            : parseFloat(r.amount) || 0,
                }))
                for (const r of rows) {
                    if (!(r.effAmount > 0)) {
                        toast.error(t('payments.errors.amountPositive'))
                        return
                    }
                    if (r.method === 'cheque' || r.method === 'traite') {
                        if (!r.number.trim()) {
                            toast.error(r.method === 'traite' ? t('payments.errors.numberRequiredTraite') : t('payments.errors.numberRequiredCheque'))
                            return
                        }
                        if (!r.dueDate) {
                            toast.error(t('payments.errors.dueDateRequired'))
                            return
                        }
                    }
                }
                const paymentsTotal = rows.reduce((s, r) => s + r.effAmount, 0)
                if (grandTotal > 0 && paymentsTotal > grandTotal + 0.0001) {
                    toast.warning(t('payments.errors.overTotal'))
                }
                payments = rows.map((r) => ({
                    amount: r.effAmount,
                    type: paymentType === 'full' ? 'full' : 'deposit',
                    method: r.method === 'traite' ? 'cheque' : r.method,
                    ...(r.method === 'cheque' || r.method === 'traite'
                        ? {
                            cheque: {
                                number: r.number.trim(),
                                bankName: r.bank.trim() || undefined,
                                type: r.method === 'traite' ? ('traite' as const) : ('standard' as const),
                                dueDate: r.dueDate,
                            },
                        }
                        : {}),
                }))
            }
            await onSubmit({
                clientId: selectedClientId,
                orderType,
                items,
                payments,
                repairs,
                prescriptionId: selectedPrescriptionId || undefined,
                turnaroundDays: expectedCompletionDate
                    ? Math.max(0, Math.round((new Date(expectedCompletionDate + 'T00:00:00').getTime() - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00').getTime()) / 86400000))
                    : undefined,
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('orders.createFailed'))
        } finally {
            setInternalSaving(false)
        }
    }

    const clientOptions: SearchSelectOption[] = clients.map((c) => ({
        value: c.id,
        label: `${c.name} ${c.familyName}`,
        secondary: c.phone,
    }))

    const prescriptionOptions: SearchSelectOption[] = (() => {
        const labelCounts = new Map<string, number>()
        for (const p of prescriptions) {
            const label = prescriptionLabel(p)
            labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
        }
        return prescriptions.map((p) => {
            const label = prescriptionLabel(p)
            return {
                value: p.id,
                label: (labelCounts.get(label) || 0) > 1 ? `#${p.id.slice(0, 4)} ${label}` : label,
            }
        })
    })()

    const selectedRx = prescriptions.find((p) => p.id === selectedPrescriptionId)
    const showLensBlankPicker = user?.role !== 'shop' && (orderType === 'standard' || orderType === 'remounting') && selectedPrescriptionId && selectedRx

    const totalItemsPrice = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const totalRepairsPrice = repairs.reduce((s, r) => s + r.price, 0)
    const grandTotal = totalItemsPrice + totalRepairsPrice

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {forcedOrderType ? (
                <div className="rounded-lg bg-muted/30 p-3 border text-sm">
                    <span className="font-medium">{t(`orders.type_${forcedOrderType}`)}</span>
                    <span className="text-muted-foreground ml-2">— {t(`orders.type_${forcedOrderType}_desc`)}</span>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label>{t('orders.orderType')}</Label>
                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2">
                        {(['standard', 'remounting', 'direct_sale'] as const).map((type) => (
                            <Button
                                key={type}
                                type="button"
                                variant={orderType === type ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setOrderType(type)
                                    if (type === 'direct_sale') setPaymentType('full')
                                }}
                                className="h-auto flex-col items-start gap-1 py-3 px-3 text-left leading-tight whitespace-normal"
                            >
                                <span className="font-medium text-sm">{t(`orders.type_${type}`)}</span>
                                <span className="text-xs opacity-90 font-normal leading-relaxed text-pretty">{t(`orders.type_${type}_desc`)}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label>{t('orders.client')} *</Label>
                <SearchSelect
                    options={clientOptions}
                    value={selectedClientId}
                    onChange={(val) => { setSelectedClientId(val); setClientSearch(''); setSelectedPrescriptionId('') }}
                    placeholder={t('common.search')}
                    searchPlaceholder={t('clients.searchPlaceholder')}
                    emptyMessage={t('clients.noClients')}
                    title={t('orders.client')}
                />
            </div>

            {(orderType === 'standard' || orderType === 'remounting') && selectedClientId && (
                <div className="space-y-2">
                    <Label>{t('prescriptions.title')}</Label>
                    <div className="flex gap-2">
                        <div className="flex-1 min-w-0">
                            {prescriptionOptions.length > 0 ? (
                                <SearchSelect
                                    options={prescriptionOptions}
                                    value={selectedPrescriptionId}
                                    onChange={setSelectedPrescriptionId}
                                    placeholder={t('common.select')}
                                    searchPlaceholder={t('common.search')}
                                    emptyMessage={t('prescriptions.noPrescriptions')}
                                    title={t('prescriptions.title')}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground italic h-9 flex items-center">{t('prescriptions.noPrescriptions')}</p>
                            )}
                        </div>
                        <Button type="button" variant="outline" className="h-9 shrink-0" disabled={!selectedClientId} onClick={() => setShowNewRx(true)}>
                            <Plus className="h-3 w-3 mr-1" /> {t('prescriptions.newPrescription')}
                        </Button>
                    </div>
                </div>
            )}

            {showLensBlankPicker && (
                <LensBlankPicker
                    prescriptions={prescriptions}
                    selectedPrescriptionId={selectedPrescriptionId}
                    onAddBlank={addLensBlankAsItem}
                    t={t}
                />
            )}

            {(orderType === 'standard' || orderType === 'remounting') && (
                <div className="space-y-2">
                    <Label>{t('orders.expectedCompletion')}</Label>
                    <Input
                        type="date"
                        min={today}
                        value={expectedCompletionDate}
                        onChange={(e) => setExpectedCompletionDate(e.target.value)}
                        className="h-9"
                    />
                </div>
            )}

            {(orderType === 'standard' || orderType === 'direct_sale' || orderType === 'remounting') && (
                <OrderItemsSection
                    products={products}
                    items={items}
                    user={user}
                    onAddProduct={addItem}
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                    onScanOpen={openQrScan}
                    t={t}
                />
            )}

            {(orderType === 'standard' || orderType === 'remounting') && (
                <RepairsSection
                    repairServices={repairServices}
                    repairs={repairs}
                    selectedServiceIds={selectedServiceIds}
                    user={user}
                    today={today}
                    onAddRepair={addRepair}
                    onUpdateRepair={updateRepair}
                    onRemoveRepair={removeRepair}
                    onToggleService={toggleRepairService}
                    onUpdateServiceDate={updateServiceRepairDate}
                    t={t}
                />
            )}

            <PaymentRowsEditor
                rows={paymentRows}
                onChange={setPaymentRows}
                paymentType={paymentType}
                onPaymentTypeChange={setPaymentType}
                orderType={orderType}
                grandTotal={grandTotal}
                t={t}
            />

            <div className="rounded-lg bg-muted/30 border divide-y divide-border">
                {items.length > 0 && (
                    <div className="flex justify-between px-3 py-2 text-sm">
                        <span>{t('orders.items')}</span>
                        <span className="font-medium">{totalItemsPrice.toFixed(3)} TND</span>
                    </div>
                )}
                {repairs.length > 0 && (
                    <div className="flex justify-between px-3 py-2 text-sm">
                        <span>{t('nav.repairs')}</span>
                        <span className="font-medium">{totalRepairsPrice.toFixed(3)} TND</span>
                    </div>
                )}
                <div className="flex justify-between px-3 py-2.5 text-sm font-semibold text-base">
                    <span>{t('orders.total')}</span>
                    <span>{grandTotal.toFixed(3)} TND</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button type="submit" disabled={saving || !selectedClientId} className="w-full sm:flex-1 h-10">
                    {saving ? t('common.saving') : t('common.save')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto h-10">
                    {t('common.cancel')}
                </Button>
            </div>

            <QrScanDialog
                open={qrScanOpen}
                onClose={closeQrScan}
                qrScanning={qrScanning}
                qrError={qrError}
                qrReaderId={qrReaderId}
                t={t}
            />

            <NewPrescriptionDialog
                open={showNewRx}
                clientId={selectedClientId}
                onClose={() => setShowNewRx(false)}
                onCreated={handlePrescriptionCreated}
                t={t}
            />
        </form>
    )
}
