import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseQuery } from '@/lib/api/parse'
import { parsePagination } from '@/lib/api/pagination'
import { db } from '@/lib/database/db'
import { Prisma } from '@prisma/client'
import { requireRole } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
    try {
        requireRole(['admin'])(request)
        const { page, limit } = parsePagination(request)
        const { action, entityType, entityId, from, to } = parseQuery(request, 'action', 'entityType', 'entityId', 'from', 'to')

        const where: Prisma.AuditLogWhereInput = {}
        if (action) where.action = { contains: action }
        if (entityType) where.entityType = entityType
        if (entityId) where.entityId = entityId
        if (from || to) {
            const createdAt: Prisma.DateTimeFilter = {}
            if (from) createdAt.gte = new Date(from)
            if (to) createdAt.lte = new Date(to)
            where.createdAt = createdAt
        }

        const [logs, total, users] = await Promise.all([
            db.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.auditLog.count({ where }),
            db.user.findMany({ select: { id: true, email: true, name: true } }),
        ])

        const userMap = new Map(users.map((u) => [u.id, u.name || u.email]))
        const data = logs.map((log) => ({
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            user: log.userId ? userMap.get(log.userId) || log.userId : null,
            metadata: log.metadata ? (JSON.parse(log.metadata) as Record<string, unknown>) : {},
            createdAt: log.createdAt,
        }))

        return ok({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        })
    } catch (error) {
        return handleError(error)
    }
}

export async function GET_TYPES(request: NextRequest) {
    try {
        requireRole(['admin'])(request)
        const rows = await db.auditLog.findMany({
            distinct: ['entityType'],
            select: { entityType: true },
            orderBy: { entityType: 'asc' },
        })
        return ok(rows.map((r) => r.entityType))
    } catch (error) {
        return handleError(error)
    }
}
