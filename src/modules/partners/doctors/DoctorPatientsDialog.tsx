'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Stethoscope, Calendar } from 'lucide-react'

interface PatientPrescription {
    id: string
    client: { name: string; familyName: string; phone: string }
    createdAt: string
}

interface DoctorPatientsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    doctor: { id: string; name: string } | null
    patients: PatientPrescription[]
}

export function DoctorPatientsDialog({
    open,
    onOpenChange,
    doctor,
    patients,
}: DoctorPatientsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        Patients of {doctor?.name}
                    </DialogTitle>
                </DialogHeader>
                {patients.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No patients linked to this doctor</p>
                ) : (
                    <div className="space-y-2">
                        {patients.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                <div>
                                    <p className="font-medium text-sm">{p.client.name} {p.client.familyName}</p>
                                    <p className="text-xs text-muted-foreground">{p.client.phone}</p>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(p.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
