import { PrismaClient } from '@prisma/client'

const SOFT_DELETE_MODELS: ReadonlySet<string> = new Set(['client', 'doctor', 'fournisseur', 'order', 'opticianshop'])
const SOFT_DELETE_READ_OPS: ReadonlySet<string> = new Set(['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'])
const ORDER_SOFT_DELETE_READ_OPS: ReadonlySet<string> = new Set(['findMany', 'count', 'aggregate', 'groupBy'])

function isSoftDeletedRow(result: unknown): boolean {
    return result !== null && typeof result === 'object' && 'deletedAt' in result && result.deletedAt !== null
}

function createExtendedPrismaClient() {
    return new PrismaClient().$extends({
        query: {
            $allOperations: async ({ model, operation, args, query }) => {
                const softDeleteModel = model?.toLowerCase()
                if (!softDeleteModel || !SOFT_DELETE_MODELS.has(softDeleteModel)) {
                    return query(args)
                }
                if (operation === 'findUnique') {
                    const result = await query(args)
                    return isSoftDeletedRow(result) ? null : result
                }
                const readOps = softDeleteModel === 'order' ? ORDER_SOFT_DELETE_READ_OPS : SOFT_DELETE_READ_OPS
                if (!readOps.has(operation)) {
                    return query(args)
                }
                const queryArgs = args ?? {}
                queryArgs.where = { ...queryArgs.where, deletedAt: null }
                return query(queryArgs)
            },
        },
    })
}

const globalForPrisma = globalThis as unknown as {
    prisma?: { client: PrismaClient; softDeleteExtension: true }
}

function getDb(): PrismaClient {
    const cached = globalForPrisma.prisma
    if (cached?.softDeleteExtension) return cached.client
    const client = createExtendedPrismaClient() as unknown as PrismaClient
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = { client, softDeleteExtension: true }
    return client
}

export const db: PrismaClient = getDb()
