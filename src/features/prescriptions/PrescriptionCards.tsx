'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { User, Stethoscope, Calendar, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'

interface Prescription {
    id: string
    client: { id: string; name: string; familyName: string; phone: string }
    sphRight: string
    cylRight: string
    axisRight: number
    addRight: string
    pdRight: number
    sphLeft: string
    cylLeft: string
    axisLeft: number
    addLeft: string
    pdLeft: number
    doctor: { id: string; name: string } | null
    dateWritten: string | null
    createdAt: string
}

interface PrescriptionCardsProps {
    prescriptions: Prescription[]
    onEdit: (prescription: Prescription) => void
    onDelete: (prescription: Prescription) => void
}

export function PrescriptionCards({ prescriptions, onEdit, onDelete }: PrescriptionCardsProps) {
    const { t } = useTranslation()
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {prescriptions.map((rx) => (
                <div key={rx.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">
                                        {rx.client.name} {rx.client.familyName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{rx.client.phone}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs gap-1 shrink-0">
                                <Calendar className="h-3 w-3" />
                                {new Date(rx.createdAt).toLocaleDateString()}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                            <Stethoscope className="h-3.5 w-3.5" />
                            <span>{t('prescriptions.doctor')}: <span className="font-medium text-foreground">{rx.doctor?.name || '—'}</span></span>
                            {rx.dateWritten && <><span className="text-muted-foreground/50">|</span><Calendar className="h-3 w-3" /><span>{new Date(rx.dateWritten).toLocaleDateString()}</span></>}
                        </div>

                        <div className="bg-card rounded-lg border p-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    <Eye className="h-3.5 w-3.5" />
                                    {t('prescriptions.rightEye')}
                                </div>
                                <div className="grid grid-cols-5 gap-1 bg-muted/30 rounded-lg p-1.5 text-center">
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.sph')}</p><p className="font-semibold text-xs">{rx.sphRight}</p></div>
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.cyl')}</p><p className="font-semibold text-xs">{rx.cylRight}</p></div>
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.axis')}</p><p className="font-semibold text-xs">{rx.axisRight}°</p></div>
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.add')}</p><p className="font-semibold text-xs">{rx.addRight}</p></div>
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.pd')}</p><p className="font-semibold text-xs">{rx.pdRight}</p></div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    <EyeOff className="h-3.5 w-3.5" />
                                    {t('prescriptions.leftEye')}
                                </div>
                                <div className="grid grid-cols-5 gap-1 bg-muted/30 rounded-lg p-1.5 text-center">
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.sph')}</p><p className="font-semibold text-xs">{rx.sphLeft}</p></div>
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.cyl')}</p><p className="font-semibold text-xs">{rx.cylLeft}</p></div>
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.axis')}</p><p className="font-semibold text-xs">{rx.axisLeft}°</p></div>
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.add')}</p><p className="font-semibold text-xs">{rx.addLeft}</p></div>
                                    <div className="rounded p-1 bg-background border"><p className="text-[10px] text-muted-foreground">{t('prescriptions.pd')}</p><p className="font-semibold text-xs">{rx.pdLeft}</p></div>
                                </div>
                            </div>
                        </div>
                        </div>

                        <div className="flex justify-end gap-1 pt-1 border-t">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(rx)} title={t('common.edit')}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(rx)} title={t('common.delete')}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
