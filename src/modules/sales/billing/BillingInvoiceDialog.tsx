'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Printer, Receipt } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { printFacture, printRecu } from './billing.print'
import type { BillingRecord } from './billing.types'

interface Props {
    selected: BillingRecord | null
    onClose: () => void
}

export function BillingInvoiceDialog({ selected, onClose }: Props) {
    const { t } = useTranslation()
    if (!selected) return null
    const s = selected
    const deposit = s.payments.find((p) => p.type === 'deposit')
    const designation = s.items.map((i) => `${i.productName}${i.brand ? ` (${i.brand})` : ''}`).join(', ')
    const promiseDate = s.turnaroundDays
        ? formatDate(new Date(s.createdAt).getTime() + s.turnaroundDays * 86400000)
        : null

    return (
        <Dialog open={!!selected} onOpenChange={onClose}>
            <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="py-4">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-[22px] font-bold" style={{ color: '#37b34a' }}>Sofiene Optic</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Facture #{s.orderNumber} &mdash; {formatDate(s.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => printRecu(s)}>
                                <Receipt className="h-4 w-4 mr-1.5" />
                                {t('billing.printReceipt')}
                            </Button>
                            <Button size="sm" className="gap-1.5" onClick={() => printFacture(s)}>
                                <Printer className="h-4 w-4 mr-1.5" />
                                {t('billing.print')}
                            </Button>
                        </div>
                    </div>

                    <div className="border rounded-xl bg-card p-5 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5 text-sm">
                            <div className="space-y-2.5">
                                <FieldRow label="Date:" value={formatDate(s.createdAt)} />
                                <FieldRow label="N &amp; P:" value={`${s.client.name} ${s.client.familyName}`} />
                                <FieldRow label="N de Tel:" value={s.client.phone} />
                                <FieldRow label="Designation:" value={designation || '—'} />
                                {s.orderType !== 'direct_sale' && s.prescription?.dateWritten && (
                                    <FieldRow label="Date Ordonnance:" value={formatDate(s.prescription.dateWritten)} />
                                )}
                                {s.orderType !== 'direct_sale' && s.prescription?.doctorName && <FieldRow label="Medecin:" value={s.prescription.doctorName} />}
                            </div>
                            <div className="space-y-2.5">
                                <FieldRow label="Prix:" value={formatCurrency(s.totalAmount)} />
                                <FieldRow label="Acompte:" value={deposit ? formatCurrency(deposit.amount) : '—'} />
                                <FieldRow label="Reste:" value={formatCurrency(s.balance)} />
                                <FieldRow label="Date promise:" value={promiseDate || '—'} />
                            </div>
                        </div>

                        {s.orderType !== 'direct_sale' && s.prescription ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border border-foreground/20 bg-muted/50">
                                            <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[12%]">OD/OG</th>
                                            <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[14%]">Sph</th>
                                            <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[14%]">Cyl</th>
                                            <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[14%]">Axe</th>
                                            <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[14%]">Add</th>
                                            <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[16%]">Ep</th>
                                            <th className="p-2 text-center font-semibold w-[16%]">H</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-x border-foreground/20">
                                            <td className="p-2 text-center font-semibold border-r border-foreground/20">OD</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.sphRight}</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.cylRight}</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.axisRight}</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.addRight}</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.pdRight}</td>
                                            <td className="p-2 text-center"></td>
                                        </tr>
                                        <tr className="border border-foreground/20">
                                            <td className="p-2 text-center font-semibold border-r border-foreground/20">OG</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.sphLeft}</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.cylLeft}</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.axisLeft}</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.addLeft}</td>
                                            <td className="p-2 text-center border-r border-foreground/20">{s.prescription.pdLeft}</td>
                                            <td className="p-2 text-center"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : null}

                        <div className="border-t-2 pt-4 text-center text-xs text-muted-foreground leading-relaxed" style={{ borderColor: '#37b34a' }}>
                            <p>Rue de la Liberte a cote Mosquee Omar ibn Elkhattab</p>
                            <p className="font-semibold" style={{ color: '#37b34a' }}>Sofiene Optic</p>
                            <p>24.398.692 &mdash; 24.248.632</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function FieldRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="font-semibold shrink-0 w-24">{label}</span>
            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
            <span>{value}</span>
        </div>
    )
}
