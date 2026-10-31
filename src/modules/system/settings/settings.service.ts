import { db } from '@/lib/database/db'
import { auditService } from '@/modules/system/audit'

/** Whitelist of writable setting keys (anything else is rejected). */
export const SETTING_KEYS = ['profit_percentage'] as const
export type SettingKey = (typeof SETTING_KEYS)[number]

export async function getSetting(key: string): Promise<string | null> {
    const row = await db.setting.findUnique({ where: { key } })
    return row?.value ?? null
}

export async function upsertSetting(key: string, value: string, userId?: string) {
    if (!SETTING_KEYS.includes(key as SettingKey)) {
        throw new Error(`Unknown setting key: ${key}`)
    }
    const row = await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    })
    await auditService.log({ action: 'SETTING_UPDATED', entityType: 'SETTING', entityId: key, metadata: { value, userId } })
    return row
}
