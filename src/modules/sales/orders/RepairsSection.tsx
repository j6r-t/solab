'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Wrench } from 'lucide-react'
import type { OrderRepairInput, RepairService } from './order-form.types'

interface RepairsSectionProps {
    repairServices: RepairService[]
    repairs: OrderRepairInput[]
    selectedServiceIds: string[]
    user: { role?: string } | null
    today: string
    onAddRepair: () => void
    onUpdateRepair: (index: number, field: keyof OrderRepairInput, value: string | number) => void
    onRemoveRepair: (index: number) => void
    onToggleService: (service: RepairService) => void
    onUpdateServiceDate: (serviceId: string, date: string) => void
    t: (key: string) => string
}

export function RepairsSection({ repairServices, repairs, selectedServiceIds, user, today, onAddRepair, onUpdateRepair, onRemoveRepair, onToggleService, onUpdateServiceDate, t }: RepairsSectionProps) {
    return (
        <div className="space-y-3">
            <Label>{t('nav.repairs')}</Label>
            {repairServices.length > 0 ? (
                <div className="space-y-2">
                    {repairServices.map((service) => {
                        const checked = selectedServiceIds.includes(service.id)
                        const repairObj = repairs.find((r) => r.repairServiceId === service.id)
                        return (
                            <div key={service.id} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg border">
                                <Checkbox
                                    id={`service-${service.id}`}
                                    checked={checked}
                                    onCheckedChange={() => onToggleService(service)}
                                />
                                <label htmlFor={`service-${service.id}`} className="flex-1 flex items-center gap-2 text-sm cursor-pointer">
                                    <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="font-medium">{service.name}</span>
                                    {user?.role === 'shop' ? (
                                        <span className="text-muted-foreground italic">{t('common.free')}</span>
                                    ) : (
                                        <span className="text-muted-foreground">({parseFloat(service.defaultPrice).toFixed(3)} TND)</span>
                                    )}
                                </label>
                                {checked && (
                                    <Input
                                        type="date"
                                        min={today}
                                        value={repairObj?.expectedCompletionDate || ''}
                                        onChange={(e) => onUpdateServiceDate(service.id, e.target.value)}
                                        className="w-36 h-7 text-xs"
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div>
                    <p className="text-sm text-muted-foreground italic mb-2">{t('repairs.noServicesConfigured')}</p>
                    <div className="space-y-1.5">
                        {repairs.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border">
                                <Input
                                    value={r.type}
                                    onChange={(e) => onUpdateRepair(i, 'type', e.target.value)}
                                    placeholder={t('repairs.type')}
                                    className="flex-1 h-7 text-xs"
                                />
                                <Input
                                    type="number"
                                    step="0.001"
                                    value={r.price || ''}
                                    onChange={(e) => onUpdateRepair(i, 'price', parseFloat(e.target.value) || 0)}
                                    placeholder={t('workOrders.price')}
                                    className="w-20 h-7 text-xs"
                                />
                                <Input
                                    type="date"
                                    min={today}
                                    value={r.expectedCompletionDate}
                                    onChange={(e) => onUpdateRepair(i, 'expectedCompletionDate', e.target.value)}
                                    className="w-34 h-7 text-xs"
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveRepair(i)} className="h-7 w-7 shrink-0">
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={onAddRepair}>
                            <Plus className="h-3 w-3 mr-1" /> {t('common.add')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
