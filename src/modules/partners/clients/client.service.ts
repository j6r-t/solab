import { Prisma } from '@prisma/client'
import { clientRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { ConflictError, NotFoundError } from '@/lib/errors'
import { effectivePaymentTotal } from '@/lib/utils/payments'
import { auditService } from '@/modules/system/audit'

export async function listClients(params?: { search?: string; gender?: string }) {
    const where: Record<string, unknown> = {}
    if (params?.search) {
        where.OR = [
            { name: { contains: params.search } },
            { familyName: { contains: params.search } },
            { phone: { contains: params.search } },
        ]
    }
    if (params?.gender) where.gender = params.gender
    const clients = await clientRepo.findMany({ where, orderBy: { createdAt: 'desc' } })
    if (clients.length === 0) return clients

    const ids = clients.map((c) => c.id)
    const [revenueGroups, balanceOrders, visitGroups] = await Promise.all([
        db.order.groupBy({
            by: ['clientId'],
            where: { clientId: { in: ids }, status: 'completed' },
            _sum: { totalAmount: true },
        }),
        db.order.findMany({
            where: { clientId: { in: ids }, status: { not: 'cancelled' } },
            select: {
                clientId: true,
                totalAmount: true,
                payments: { select: { amount: true, method: true, cheque: { select: { status: true } } } },
            },
        }),
        db.order.groupBy({
            by: ['clientId'],
            where: { clientId: { in: ids }, status: { not: 'cancelled' } },
            _max: { createdAt: true },
        }),
    ])

    // Balance = sum over ALL non-cancelled orders of (totalAmount - effectivePaymentTotal):
    // true client debt — cheques/traites count only once cashed (approved definition).
    const revenueByClient = new Map(revenueGroups.map((g) => [g.clientId, Number(g._sum.totalAmount ?? 0)]))
    const balanceByClient = new Map<string, number>()
    for (const order of balanceOrders) {
        const paid = effectivePaymentTotal(order.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })), 'client')
        balanceByClient.set(order.clientId, (balanceByClient.get(order.clientId) ?? 0) + Number(order.totalAmount) - paid)
    }
    const lastVisitByClient = new Map(visitGroups.map((g) => [g.clientId, g._max.createdAt]))

    return clients.map((client) => ({
        ...client,
        revenue: (revenueByClient.get(client.id) ?? 0).toString(),
        balance: (balanceByClient.get(client.id) ?? 0).toString(),
        lastVisitAt: lastVisitByClient.get(client.id) ?? null,
    }))
}

export async function getClientById(id: string) {
    const client = await clientRepo.findUnique({ where: { id } })
    if (!client) throw new NotFoundError('Client not found')
    return client
}

export async function createClient(data: Record<string, unknown>) {
    const existing = await clientRepo.findUnique({ where: { phone: data.phone as string } })
    if (existing) throw new ConflictError('A client with this phone number already exists')
    const client = await clientRepo.create({ data: data as Prisma.ClientCreateInput })
    await auditService.log({ action: 'CLIENT_CREATED', entityType: 'CLIENT', entityId: client.id, metadata: data })
    return client
}

export async function updateClient(id: string, data: Record<string, unknown>) {
    if (data.phone) {
        const duplicate = await db.client.findFirst({ where: { phone: data.phone as string, NOT: { id } } })
        if (duplicate) throw new ConflictError('A client with this phone number already exists')
    }
    const client = await clientRepo.update({ where: { id }, data: data as Prisma.ClientUpdateInput })
    await auditService.log({ action: 'CLIENT_UPDATED', entityType: 'CLIENT', entityId: id, metadata: data })
    return client
}

export async function deleteClient(id: string) {
    await clientRepo.update({ where: { id }, data: { deletedAt: new Date() } })
    await auditService.log({ action: 'CLIENT_DELETED', entityType: 'CLIENT', entityId: id })
}
