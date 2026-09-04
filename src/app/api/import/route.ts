import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { createClient } from '@/modules/partners/clients/client.service'
import { createFournisseur } from '@/modules/partners/fournisseurs/fournisseur.service'
import { z } from 'zod'


const previewSchema = z.object({
    entity: z.enum(['clients', 'fournisseurs']),
    rows: z.array(z.record(z.string(), z.string().nullable())),
    mapping: z.record(z.string(), z.string()),
})

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody(request, previewSchema)
        const { entity, rows, mapping } = body

        const mapped = rows.map((row) => {
            const result: Record<string, string | null> = {}
            for (const [oldField, newField] of Object.entries(mapping)) {
                if (newField) result[newField] = row[oldField] ?? null
            }
            return result
        })

        const existingPhones = new Set<string>()
        if (entity === 'clients') {
            const { clientRepo } = await import('@/lib/database/repositories')
            const all = await clientRepo.findMany({ select: { phone: true } })
            all.forEach((c: { phone: string }) => existingPhones.add(c.phone))
        }

        const duplicates = entity === 'clients'
            ? mapped.map((r) => r.phone ? existingPhones.has(r.phone as string) : false)
            : mapped.map(() => false)

        return ok({ preview: mapped, duplicates, total: mapped.length })
    } catch (error) {
        return handleError(error)
    }
}

const confirmSchema = z.object({
    entity: z.enum(['clients', 'fournisseurs']),
    rows: z.array(z.record(z.string(), z.unknown())),
})

export async function PUT(request: NextRequest) {
    try {
        const body = await parseBody(request, confirmSchema)
        const { entity, rows } = body
        let imported = 0
        const errors: { row: number; error: string }[] = []

        for (let i = 0; i < rows.length; i++) {
            try {
                if (entity === 'clients') {
                    await createClient(rows[i])
                } else {
                    await createFournisseur(rows[i] as unknown as Parameters<typeof createFournisseur>[0])
                }
                imported++
            } catch (e: unknown) {
                errors.push({ row: i + 1, error: e instanceof Error ? e.message : 'Unknown error' })
            }
        }

        return ok({ imported, errors, total: rows.length })
    } catch (error) {
        return handleError(error)
    }
}
