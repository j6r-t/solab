'use client'

import { useState, useRef } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, Download, ArrowLeft, ArrowRight } from 'lucide-react'
import { parseCSV } from '@/lib/csv'
import { toast } from 'sonner'

interface PreviewRow {
    data: Record<string, string | null>
    duplicate: boolean
}

interface ImportSummary {
    imported: number
    errors: { row: number; error: string }[]
    total: number
}

type EntityType = 'clients' | 'fournisseurs'

const entityLabels: Record<EntityType, string> = {
    clients: 'Clients',
    fournisseurs: 'Suppliers',
}

const targetFields: Record<EntityType, { key: string; label: string; required: boolean }[]> = {
    clients: [
        { key: 'name', label: 'First Name', required: true },
        { key: 'familyName', label: 'Family Name', required: true },
        { key: 'phone', label: 'Phone', required: true },
        { key: 'address', label: 'Address', required: false },
        { key: 'gender', label: 'Gender', required: false },
        { key: 'birthDate', label: 'Birth Date', required: false },
        { key: 'notes', label: 'Notes', required: false },
        { key: 'organization', label: 'Organization', required: false },
    ],
    fournisseurs: [
        { key: 'name', label: 'Name', required: true },
        { key: 'phone', label: 'Phone', required: false },
        { key: 'address', label: 'Address', required: false },
        { key: 'email', label: 'Email', required: false },
        { key: 'taxId', label: 'Tax ID', required: false },
    ],
}

const fieldNameHints: Record<string, string[]> = {
    name: ['name', 'nom', 'raison_sociale', 'first name', 'prénom', 'prenom'],
    familyName: ['familyname', 'family name', 'nom de famille', 'last name', 'nom', 'prénom', 'prenom'],
    phone: ['phone', 'telephone', 'téléphone', 'tel', 'n° tél', 'n__tél.1'],
    address: ['address', 'adresse', 'adresse_'],
    gender: ['gender', 'genre'],
    birthDate: ['birthdate', 'birth date', 'date_naissance', 'date naissance'],
    notes: ['notes', 'observation', 'observations'],
    organization: ['organization', 'organisme', 'company', 'société'],
    email: ['email', 'e-mail', 'mail'],
    taxId: ['taxid', 'tax id', 'matricule_fiscale', 'matricule fiscal'],
}

function autoDetectMapping(headers: string[], entity: EntityType): Record<string, string> {
    const mapping: Record<string, string> = {}
    const targetKeys = targetFields[entity].map((f) => f.key)

    for (const header of headers) {
        const hl = header.toLowerCase().replace(/[^a-z0-9éèêëàâäùûüôöîïç]/g, '')
        let matched: string | null = null
        for (const [key, hints] of Object.entries(fieldNameHints)) {
            if (!targetKeys.includes(key)) continue
            if (hints.some((h) => hl.includes(h))) {
                matched = key
                break
            }
        }
        if (matched) mapping[header] = matched
    }
    return mapping
}

export function ImportPage() {
    const { t } = useTranslation()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [step, setStep] = useState(1)
    const [entity, setEntity] = useState<EntityType>('clients')
    const [headers, setHeaders] = useState<string[]>([])
    const [rawRows, setRawRows] = useState<string[][]>([])
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const [preview, setPreview] = useState<PreviewRow[]>([])
    const [importing, setImporting] = useState(false)
    const [summary, setSummary] = useState<ImportSummary | null>(null)

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            const text = ev.target?.result as string
            const parsed = parseCSV(text)
            if (parsed.headers.length === 0 || parsed.rows.length === 0) {
                toast.error('File appears empty or unreadable')
                return
            }
            setHeaders(parsed.headers)
            setRawRows(parsed.rows)
            const auto = autoDetectMapping(parsed.headers, entity)
            setMapping(auto)
            setStep(2)
        }
        reader.readAsText(file)
    }

    async function handlePreview() {
        const rows = rawRows.map((row) => {
            const obj: Record<string, string | null> = {}
            headers.forEach((h, i) => { obj[h] = row[i] ?? null })
            return obj
        })

        try {
            const res = await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity, rows, mapping }),
            })
            if (!res.ok) throw new Error('Preview failed')
            const data = await res.json()
            setPreview(
                data.preview.map((p: Record<string, unknown>, i: number) => ({
                    data: p as Record<string, string | null>,
                    duplicate: data.duplicates[i],
                }))
            )
            setStep(3)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to generate preview')
        }
    }

    async function handleImport() {
        setImporting(true)
        try {
            const mappedRows = preview.map((p) => p.data)
            const res = await fetch('/api/import', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity, rows: mappedRows }),
            })
            if (!res.ok) throw new Error('Import failed')
            const data = await res.json()
            setSummary(data)
            setStep(4)
            if (data.imported > 0) toast.success(`${data.imported} records imported successfully`)
            if (data.errors.length > 0) toast.error(`${data.errors.length} records failed`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Import failed')
        } finally {
            setImporting(false)
        }
    }

    function reset() {
        setStep(1)
        setHeaders([])
        setRawRows([])
        setMapping({})
        setPreview([])
        setSummary(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const requiredMapped = targetFields[entity]
        .filter((f) => f.required)
        .every((f) => Object.values(mapping).includes(f.key))

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('import.title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('import.description')}</p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 text-sm">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                        </div>
                        <span className={step >= s ? 'text-foreground' : 'text-muted-foreground'}>
                            {s === 1 ? t('import.stepFile') : s === 2 ? t('import.stepMap') : s === 3 ? t('import.stepPreview') : t('import.stepDone')}
                        </span>
                        {s < 4 && <span className="text-muted-foreground/30">→</span>}
                    </div>
                ))}
            </div>

            {/* Step 1: Select entity + upload */}
            {step === 1 && (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center space-y-4">
                    <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                    <div className="space-y-2">
                        <p className="font-medium">{t('import.selectEntity')}</p>
                        <p className="text-sm text-muted-foreground">{t('import.csvHint')}</p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <Select value={entity} onValueChange={(v) => setEntity(v as EntityType)}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="clients">{t('import.entityClients')}</SelectItem>
                                <SelectItem value="fournisseurs">{t('import.entitySuppliers')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={() => fileInputRef.current?.click()}>
                            <Upload className="h-4 w-4 mr-2" />
                            {t('common.import')}
                        </Button>
                        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
                    </div>
                </div>
            )}

            {/* Step 2: Column mapping */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="font-medium">{t('import.mapColumns')}</p>
                        <Button onClick={handlePreview} disabled={!requiredMapped}>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Preview
                        </Button>
                    </div>
                    <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30">
                                <tr>
                                    <th className="text-left p-3 font-medium text-muted-foreground">CSV Column</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">First value</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Maps to</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {headers.map((header) => (
                                    <tr key={header} className="row-hover">
                                        <td className="p-3 font-medium">{header}</td>
                                        <td className="p-3 text-muted-foreground text-xs truncate max-w-[200px]">
                                            {rawRows[0]?.[headers.indexOf(header)] || '—'}
                                        </td>
                                        <td className="p-3">
                                            <Select
                                                value={mapping[header] || ''}
                                                onValueChange={(v) => setMapping((prev) => ({ ...prev, [header]: v }))}
                                            >
                                                <SelectTrigger className="w-44">
                                                    <SelectValue placeholder={t('import.skipColumn')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">— {t('import.skipColumn')} —</SelectItem>
                                                    {targetFields[entity].map((f) => (
                                                        <SelectItem key={f.key} value={f.key}>
                                                            {f.label} {f.required ? '*' : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!requiredMapped && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            {t('import.requiredFields')}
                        </p>
                    )}
                    <Button variant="outline" onClick={reset}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>
            )}

            {/* Step 3: Preview + confirm */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t('import.previewRecords', { count: preview.length })}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {t('import.duplicatesDetected', { count: preview.filter((p) => p.duplicate).length })}
                            </p>
                        </div>
                        <Button onClick={handleImport} disabled={importing}>
                            {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t('import.importRecords', { count: preview.length })}
                        </Button>
                    </div>
                    <div className="border rounded-xl overflow-x-auto max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30 sticky top-0 z-10">
                                <tr>
                                    <th className="text-left p-3 font-medium text-muted-foreground">#</th>
                                    {Object.keys(preview[0]?.data || {}).map((key) => (
                                        <th key={key} className="text-left p-3 font-medium text-muted-foreground">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {preview.slice(0, 50).map((row, i) => (
                                    <tr key={i} className={row.duplicate ? 'bg-destructive/5' : 'row-hover'}>
                                        <td className="p-3 text-muted-foreground text-xs">{i + 1}</td>
                                        {Object.entries(row.data).map(([key, val], j) => (
                                            <td key={j} className="p-3 truncate max-w-[150px]">
                                                <span className="flex items-center gap-1">
                                                    {val || '—'}
                                                    {row.duplicate && key === 'phone' && (
                                                        <Badge variant="destructive" className="text-[10px] h-4 px-1">duplicate</Badge>
                                                    )}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {preview.length > 50 && (
                            <p className="text-center py-3 text-sm text-muted-foreground">
                                {t('import.moreRecords', { count: preview.length - 50 })}
                            </p>
                        )}
                    </div>
                    <Button variant="outline" onClick={() => setStep(2)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to mapping
                    </Button>
                </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && summary && (
                <div className="border-2 rounded-xl p-8 text-center space-y-4">
                    {summary.errors.length === 0 ? (
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    ) : (
                        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
                    )}
                    <div>
                        <p className="text-lg font-medium">
                            {t('import.recordsImported', { imported: summary.imported, total: summary.total })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('import.importComplete', { entity: t(entity === 'clients' ? 'import.entityClients' : 'import.entitySuppliers') })}
                        </p>
                    </div>
                    {summary.errors.length > 0 && (
                        <div className="text-left border rounded-lg p-3 max-h-40 overflow-y-auto">
                            <p className="text-sm font-medium text-destructive mb-2">{t('import.errors')}</p>
                            {summary.errors.map((e) => (
                                <p key={e.row} className="text-xs text-muted-foreground">{t('import.rowError', { row: e.row, error: e.error })}</p>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-center gap-3">
                        <Button onClick={reset}>
                            <Upload className="h-4 w-4 mr-2" />
                            {t('import.importAnother')}
                        </Button>
                        <Button variant="outline" onClick={() => { const a = document.createElement('a'); a.href = `/api/export/${entity}`; a.click() }}>
                            <Download className="h-4 w-4 mr-2" />
                            {t('import.downloadExport', { entity: t(entity === 'clients' ? 'import.entityClients' : 'import.entitySuppliers') })}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
