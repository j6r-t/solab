import { Prisma } from '@prisma/client'
import { clientRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { ConflictError, NotFoundError } from '@/lib/errors'
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
    return clientRepo.findMany({ where, orderBy: { createdAt: 'desc' } })
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
