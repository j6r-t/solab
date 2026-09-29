'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface OpticianShop {
    id: string
    name: string
    phone: string
    address: string | null
}

interface RepairService {
    id: string
    name: string
    defaultPrice: string
}

interface RepairCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => void
    saving: boolean
    repairServices: RepairService[]
    formShopId: string
    onFormShopIdChange: (value: string) => void
    formServiceId: string
    onFormServiceIdChange: (value: string) => void
    formPrice: string
    onFormPriceChange: (value: string) => void
    formDate: string
    onFormDateChange: (value: string) => void
    opticianShops: OpticianShop[]
}

export function RepairCreateDialog({
    open,
    onOpenChange,
    onSubmit,
    saving,
    repairServices,
    formShopId,
    onFormShopIdChange,
    formServiceId,
    onFormServiceIdChange,
    formPrice,
    onFormPriceChange,
    formDate,
    onFormDateChange,
    opticianShops,
}: RepairCreateDialogProps) {
    const { t } = useTranslation()
    const today = new Date().toISOString().split('T')[0]
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('repairs.newOpticianRepair')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t('workOrders.opticianShop')} *</Label>
                        <Select value={formShopId} onValueChange={onFormShopIdChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('repairs.selectShop')} />
                            </SelectTrigger>
                            <SelectContent>
                                {opticianShops.map((shop) => (
                                    <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('repairs.repairService')}</Label>
                        <Select
                            value={formServiceId}
                            onValueChange={(v) => {
                                onFormServiceIdChange(v)
                                const svc = repairServices.find((s) => s.id === v)
                                if (svc) onFormPriceChange(svc.defaultPrice)
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('repairs.selectService')} />
                            </SelectTrigger>
                            <SelectContent>
                                {repairServices.map((svc) => (
                                    <SelectItem key={svc.id} value={svc.id}>{svc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('workOrders.price')} *</Label>
                        <Input
                            type="number"
                            value={formPrice}
                            onChange={(e) => onFormPriceChange(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('workOrders.expectedDate')} *</Label>
                        <Input
                            type="date"
                            min={today}
                            value={formDate}
                            onChange={(e) => onFormDateChange(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
                        <Button onClick={onSubmit} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spinner" />}
                            {t('repairs.createRepair')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
