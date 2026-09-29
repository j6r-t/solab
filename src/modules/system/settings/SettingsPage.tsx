'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useLocaleStore } from '@/stores/locale-store'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Globe, User, Wrench, Plus, Pencil, Trash2, Eye, KeyRound, Loader2, Sun, Moon, Monitor } from 'lucide-react'
import { changePassword, updateProfile } from '@/modules/system/auth/auth.api'
import { useAuthStore } from '@/stores/auth-store'
import { useThemeStore } from '@/stores/theme-store'
import { fetchRepairServices, createRepairService, updateRepairService, deleteRepairService, fetchNamedItems } from './settings.api'
import { toast } from 'sonner'

interface RepairService {
    id: string
    name: string
    defaultPrice: string
}

interface NamedItem {
    id: string
    name: string
}

function NamedItemCard({ title, icon: Icon, description, apiPath }: {
    title: string
    icon: typeof Eye
    description: string
    apiPath: string
}) {
    const { t } = useTranslation()
    const { data: itemsData, refetch } = useQuery({
        queryKey: ['settings-items', apiPath],
        queryFn: () => fetchNamedItems(apiPath),
    })
    const items = itemsData ?? []
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<NamedItem | null>(null)
    const [itemName, setItemName] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<NamedItem | null>(null)
    const [saving, setSaving] = useState(false)

    function openNew() { setEditing(null); setItemName(''); setDialogOpen(true) }

    function openEdit(item: NamedItem) { setEditing(item); setItemName(item.name); setDialogOpen(true) }

    async function handleSave() {
        if (!itemName.trim()) return
        setSaving(true)
        try {
            if (editing) {
                const res = await fetch(`${apiPath}/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: itemName.trim() }) })
                if (!res.ok) throw new Error()
                toast.success(t('settings.itemUpdated'))
            } else {
                const res = await fetch(apiPath, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: itemName.trim() }) })
                if (!res.ok) throw new Error()
                toast.success(t('settings.itemCreated'))
            }
            setDialogOpen(false); await refetch()
        } catch { toast.error(t('settings.saveFailed')) }
        finally { setSaving(false) }
    }

    async function handleDelete() {
        if (!deleteTarget) return
        try {
            const res = await fetch(`${apiPath}/${deleteTarget.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            toast.success(t('settings.itemDeleted'))
            setDeleteTarget(null); await refetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('settings.deleteFailed'))
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Icon className="h-5 w-5" />
                            {title}
                        </CardTitle>
                        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />{t('settings.newItem')}</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{description}</p>
                    {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">{t('settings.noItems')}</p>
                    ) : (
                        <div className="border rounded-lg divide-y">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                                    <span className="text-sm font-medium">{item.name}</span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(item)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="w-full sm:max-w-sm">
                    <DialogHeader><DialogTitle>{editing ? t('settings.editItem') : t('settings.newItem')}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('settings.itemName')}</Label>
                            <Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
                        </div>
                        <Button onClick={handleSave} disabled={saving || !itemName.trim()} className="w-full">
                            {saving ? t('common.saving') : t('common.save')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('common.delete')}
                description={`${t('settings.confirmDelete')} "${deleteTarget?.name}"?`}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={handleDelete}
            />
        </>
    )
}

export function SettingsPage() {
    const { t } = useTranslation()
    const { locale, setLocale } = useLocaleStore()
    const { theme, setTheme } = useThemeStore()
    const { user, setAuth } = useAuthStore()
    const role = user?.role || 'admin'
    const showAtelierSettings = role === 'admin' || role === 'atelier'
    const [userName, setUserName] = useState(user?.name ?? '')
    const [userEmail, setUserEmail] = useState(user?.email ?? '')
    const [services, setServices] = useState<RepairService[]>([])
    const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<RepairService | null>(null)
    const [serviceName, setServiceName] = useState('')
    const [servicePrice, setServicePrice] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<RepairService | null>(null)
    const [saving, setSaving] = useState(false)
    const [pwCurrent, setPwCurrent] = useState('')
    const [pwNew, setPwNew] = useState('')
    const [pwConfirm, setPwConfirm] = useState('')
    const [pwSaving, setPwSaving] = useState(false)
    const [profileSaving, setProfileSaving] = useState(false)
    async function handleSaveProfile() {
        setProfileSaving(true)
        try {
            const payload: { name?: string | null; email?: string } = { name: userName.trim() || null }
            if (userEmail.trim()) payload.email = userEmail.trim()
            const { user: updatedUser, token } = await updateProfile(payload)
            setAuth(token, updatedUser)
            toast.success(t('settings.profileUpdated'))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('settings.profileUpdateFailed'))
        } finally {
            setProfileSaving(false)
        }
    }
    async function handleChangePassword() {
        if (!pwCurrent || !pwNew) return
        if (pwNew !== pwConfirm) return toast.error(t('settings.passwordMismatch'))
        if (pwNew.length < 6) return toast.error(t('settings.passwordTooShort'))
        setPwSaving(true)
        try {
            await changePassword(pwCurrent, pwNew)
            toast.success(t('settings.passwordUpdated'))
            setPwCurrent(''); setPwNew(''); setPwConfirm('')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('settings.passwordUpdateFailed'))
        } finally {
            setPwSaving(false)
        }
    }

    function loadServices() {
        fetchRepairServices().then((data) => setServices(data || [])).catch(() => {})
    }

    useEffect(() => { if (showAtelierSettings) loadServices() }, [showAtelierSettings])

    function openNewService() { setEditingService(null); setServiceName(''); setServicePrice(''); setServiceDialogOpen(true) }

    function openEditService(service: RepairService) { setEditingService(service); setServiceName(service.name); setServicePrice(service.defaultPrice); setServiceDialogOpen(true) }

    async function handleSaveService() {
        if (!serviceName.trim() || !servicePrice) return
        setSaving(true)
        try {
            if (editingService) {
                await updateRepairService(editingService.id, { name: serviceName.trim(), defaultPrice: servicePrice })
                toast.success(t('settings.serviceUpdated'))
            } else {
                await createRepairService({ name: serviceName.trim(), defaultPrice: servicePrice })
                toast.success(t('settings.serviceCreated'))
            }
            setServiceDialogOpen(false); loadServices()
        } catch { toast.error(t('settings.serviceSaveFailed')) }
        finally { setSaving(false) }
    }

    async function handleDeleteService() {
        if (!deleteTarget) return
        try {
            await deleteRepairService(deleteTarget.id)
            toast.success(t('settings.serviceDeleted')); setDeleteTarget(null); loadServices()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete service')
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Globe className="h-5 w-5" />
                        {t('settings.language')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Button variant={locale === 'eng' ? 'default' : 'outline'} onClick={() => setLocale('eng')}>English</Button>
                        <Button variant={locale === 'fr' ? 'default' : 'outline'} onClick={() => setLocale('fr')}>Français</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sun className="h-5 w-5" />
                        {t('settings.theme')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        {([
                            { value: 'light' as const, label: t('settings.themeLight'), Icon: Sun },
                            { value: 'dark' as const, label: t('settings.themeDark'), Icon: Moon },
                            { value: 'system' as const, label: t('settings.themeSystem'), Icon: Monitor },
                        ]).map(({ value, label, Icon }) => (
                            <Button
                                key={value}
                                variant={theme === value ? 'default' : 'outline'}
                                onClick={() => setTheme(value)}
                                className="gap-2"
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" />
                        {t('settings.profile')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t('settings.name')}</Label>
                        <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="owner@sofien.tn" />
                    </div>
                    <Button size="sm" onClick={handleSaveProfile} disabled={profileSaving}>
                        {profileSaving && <Loader2 className="h-4 w-4 mr-1 animate-spinner" />}
                        {t('common.save')}
                    </Button>
                    <div className="border-t pt-4 space-y-3">
                        <p className="text-sm font-medium flex items-center gap-2"><KeyRound className="h-4 w-4" />{t('settings.updatePassword')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">{t('settings.currentPassword')}</Label>
                                <Input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">{t('settings.newPassword')}</Label>
                                <Input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">{t('settings.confirmPassword')}</Label>
                                <Input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
                            </div>
                        </div>
                        <Button size="sm" onClick={handleChangePassword} disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}>
                            {pwSaving && <Loader2 className="h-4 w-4 mr-1 animate-spinner" />}
                            {t('settings.updatePassword')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showAtelierSettings && (
                <>
                    <h2 className="text-lg font-semibold pt-4 border-t">{t('role.atelier')}</h2>

                    <NamedItemCard
                        title={t('settings.lensBrands')}
                        icon={Eye}
                        description={t('settings.lensBrandsDesc')}
                        apiPath="/api/lens-brands"
                       
                    />

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Wrench className="h-5 w-5" />
                                    {t('settings.repairServices')}
                                </CardTitle>
                                <Button size="sm" onClick={openNewService}><Plus className="h-4 w-4 mr-1" />{t('settings.newService')}</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">{t('settings.repairServicesDesc')}</p>
                            {services.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">{t('settings.noServices')}</p>
                            ) : (
                                <div className="border rounded-lg divide-y">
                                    {services.map((service) => (
                                        <div key={service.id} className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span className="text-sm font-medium">{service.name}</span>
                                                <span className="text-sm text-muted-foreground">{parseFloat(service.defaultPrice).toFixed(3)} TND</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditService(service)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(service)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                    <DialogContent className="w-full sm:max-w-sm">
                        <DialogHeader><DialogTitle>{editingService ? t('settings.editService') : t('settings.newService')}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('settings.serviceName')}</Label>
                                <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="e.g. Frame Adjustment" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('settings.defaultPrice')}</Label>
                                <Input type="number" step="0.001" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="0.000" />
                            </div>
                            <Button onClick={handleSaveService} disabled={saving || !serviceName.trim() || !servicePrice} className="w-full">
                                {saving ? t('common.saving') : t('common.save')}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                </>)}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title={t('common.delete')}
                description={`${t('settings.confirmDelete')} "${deleteTarget?.name}"?`}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={handleDeleteService}
            />
        </div>
    )
}
