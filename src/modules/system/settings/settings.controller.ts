import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { requireRole } from '@/lib/api/auth'
import { getSetting, upsertSetting, SETTING_KEYS } from './settings.service'

const READ_ROLES = ['admin', 'shop', 'atelier']
const WRITE_ROLES = ['admin']

const settingValueSchema = z.object({
    value: z.string().min(1).max(200),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
    try {
        requireRole(READ_ROLES)(request)
        const { key } = await params
        const value = await getSetting(key)
        return ok({ key, value })
    } catch (error) {
        return handleError(error)
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
    try {
        requireRole(WRITE_ROLES)(request)
        const { key } = await params
        if (!SETTING_KEYS.includes(key as (typeof SETTING_KEYS)[number])) {
            return ok({ key, value: null })
        }
        const { value } = await parseBody(request, settingValueSchema)
        const row = await upsertSetting(key, value)
        return ok({ key: row.key, value: row.value })
    } catch (error) {
        return handleError(error)
    }
}
