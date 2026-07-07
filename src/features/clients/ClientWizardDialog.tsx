'use client'

import { useTranslation } from '@/lib/hooks/useTranslation'
import { ClientForm } from '@/features/clients/ClientForm'
import { PrescriptionForm } from '@/features/prescriptions/PrescriptionForm'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { ClientFormData } from '@/features/clients/client.schema'

interface ClientWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    wizardStep: number
    newClientId: string
    newClientName: string
    onClientCreated: (data: ClientFormData) => Promise<void>
    onPrescriptionCreated: (data: Record<string, unknown>) => Promise<void>
    saving: boolean
    setSaving: (saving: boolean) => void
}

export function ClientWizardDialog({
    open,
    onOpenChange,
    wizardStep,
    newClientId,
    newClientName,
    onClientCreated,
    onPrescriptionCreated,
    saving,
    setSaving,
}: ClientWizardDialogProps) {
    const { t } = useTranslation()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('clients.newClient')}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`h-1.5 flex-1 rounded-full ${wizardStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${wizardStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                        <span className="text-xs text-muted-foreground ml-1">{wizardStep}/2</span>
                    </div>
                </DialogHeader>
                {wizardStep === 1 && (
                    <ClientForm
                        onSubmit={async (data) => {
                            await onClientCreated(data)
                        }}
                        onCancel={() => onOpenChange(false)}
                        saving={saving}
                    />
                )}
                {wizardStep === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{t('clients.addPrescriptionPrompt').replace('{name}', newClientName)}</p>
                        <PrescriptionForm
                            preselectedClientId={newClientId}
                            preselectedClientName={newClientName}
                            onSubmit={async (data) => {
                                await onPrescriptionCreated(data as Record<string, unknown>)
                            }}
                            onCancel={() => onOpenChange(false)}
                            saving={saving}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
