'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type ClientFormData, clientSchema } from './client.schema'

interface ClientFormProps {
    defaultValues?: Partial<ClientFormData>
    onSubmit: (data: ClientFormData) => Promise<void>
    onCancel: () => void
    saving?: boolean
}

export function ClientForm({ defaultValues, onSubmit, onCancel, saving: externalSaving }: ClientFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: defaultValues?.name || '',
            familyName: defaultValues?.familyName || '',
            phone: defaultValues?.phone || '',
            address: defaultValues?.address || '',
            gender: defaultValues?.gender || undefined,
            birthDate: defaultValues?.birthDate || '',
            notes: defaultValues?.notes || '',
            organization: defaultValues?.organization || '',
        },
    })

    const isSaving = externalSaving ?? false

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">First Name</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="familyName">Family Name</Label>
                    <Input id="familyName" {...register('familyName')} />
                    {errors.familyName && <p className="text-sm text-destructive">{errors.familyName.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select id="gender" {...register('gender')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">--</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input id="birthDate" type="date" {...register('birthDate')} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register('address')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" {...register('notes')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" {...register('organization')} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    )
}