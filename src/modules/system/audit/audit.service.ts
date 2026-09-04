import { db } from '@/lib/database/db'
import { logger } from '@/lib/logger'

interface AuditInput {
    userId?: string | null
    action: string
    entityType: string
    entityId?: string | null
    metadata?: Record<string, unknown>
}

export const auditService = {
    async log(input: AuditInput) {
        const metadata = JSON.stringify(input.metadata || {})

        try {
            await db.auditLog.create({
                data: {
                    userId: input.userId || null,
                    action: input.action,
                    entityType: input.entityType,
                    entityId: input.entityId || null,
                    metadata,
                },
            })
        } catch (error) {
            logger.error('Failed to write audit log', {
                action: input.action,
                entityType: input.entityType,
                error: error instanceof Error ? error.message : String(error),
            })
        }

        logger.info(`Audit: ${input.action}`, {
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            ...(input.metadata || {}),
        })
    },
}
