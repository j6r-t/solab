import { clientRepo } from '@/lib/database/repositories'
import { Prisma } from '@prisma/client'
import { ConflictError } from '@/errors'
import { auditService } from '@/modules/audit'

export async function listClients(params?: { search?: string; gender?: string }) {
    const where: Prisma.ClientWhereInput = {}
    if (params?.search) {
        where.OR = [
            { name: { contains: params.search } },
            { familyName: { contains: params.search } },
            { phone: { contains: params.search } },
        ]
    }
    if (params?.gender) {
        where.gender = params.gender as 'male' | 'female'
    }
    return clientRepo.findMany({ where, orderBy: { createdAt: 'desc' } })
}

export async function createClient(data: { name: string; familyName: string; phone: string; address?: string; gender?: 'male' | 'female' }) {
    const existing = await clientRepo.findUnique({ where: { phone: data.phone } })
    if (existing) {
        throw new ConflictError('A client with this phone already exists')
    }
    const client = await clientRepo.create({ data: data as any })
    await auditService.log({ action: 'CLIENT_CREATED', entityType: 'CLIENT', entityId: client.id, metadata: { name: data.name, phone: data.phone } })
    return client
}

export async function updateClient(id: string, data: Partial<{ name: string; familyName: string; phone: string; address?: string; gender?: 'male' | 'female' }>) {
    const result = await clientRepo.update({ where: { id }, data: data as any })
    await auditService.log({ action: 'CLIENT_UPDATED', entityType: 'CLIENT', entityId: id })
    return result
}

export async function deleteClient(id: string) {
    await clientRepo.delete({ where: { id } })
    await auditService.log({ action: 'CLIENT_DELETED', entityType: 'CLIENT', entityId: id })
}
