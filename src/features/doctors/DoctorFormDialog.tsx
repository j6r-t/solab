'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface DoctorFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingDoctor: { id: string; name: string; phone: string; specialization: string | null; address: string | null } | null
    formName: string
    onFormNameChange: (value: string) => void
    formPhone: string
    onFormPhoneChange: (value: string) => void
    formSpecialization: string
    onFormSpecializationChange: (value: string) => void
    formAddress: string
    onFormAddressChange: (value: string) => void
    onSave: () => void
    saving: boolean
}

export function DoctorFormDialog({
    open,
    onOpenChange,
    editingDoctor,
    formName,
    onFormNameChange,
    formPhone,
    onFormPhoneChange,
    formSpecialization,
    onFormSpecializationChange,
    formAddress,
    onFormAddressChange,
    onSave,
    saving,
}: DoctorFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={formName} onChange={(e) => onFormNameChange(e.target.value)} placeholder="Dr. ..." />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={formPhone} onChange={(e) => onFormPhoneChange(e.target.value)} placeholder="Phone number" />
                    </div>
                    <div className="space-y-2">
                        <Label>Specialization</Label>
                        <Input value={formSpecialization} onChange={(e) => onFormSpecializationChange(e.target.value)} placeholder="e.g. Ophthalmologist" />
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={formAddress} onChange={(e) => onFormAddressChange(e.target.value)} placeholder="Address" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={onSave} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spinner" />}
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
