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

interface FournisseurFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingSupplier: { id: string; name: string; phone: string; address: string | null } | null
    formName: string
    onFormNameChange: (value: string) => void
    formPhone: string
    onFormPhoneChange: (value: string) => void
    formAddress: string
    onFormAddressChange: (value: string) => void
    formEmail: string
    onFormEmailChange: (value: string) => void
    formTaxId: string
    onFormTaxIdChange: (value: string) => void
    onSave: () => void
    saving: boolean
}

export function FournisseurFormDialog({
    open,
    onOpenChange,
    editingSupplier,
    formName,
    onFormNameChange,
    formPhone,
    onFormPhoneChange,
    formAddress,
    onFormAddressChange,
    formEmail,
    onFormEmailChange,
    formTaxId,
    onFormTaxIdChange,
    onSave,
    saving,
}: FournisseurFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={formName} onChange={(e) => onFormNameChange(e.target.value)} placeholder="Supplier name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={formPhone} onChange={(e) => onFormPhoneChange(e.target.value)} placeholder="Phone number" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={formEmail} onChange={(e) => onFormEmailChange(e.target.value)} placeholder="supplier@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Tax ID</Label>
                        <Input value={formTaxId} onChange={(e) => onFormTaxIdChange(e.target.value)} placeholder="Matricule fiscal" />
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
