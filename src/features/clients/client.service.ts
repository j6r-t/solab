import { clientRepo } from '@/lib/database/repositories'
import { Prisma } from '@prisma/client'
import { ConflictError } from '@/lib/errors'

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
    return clientRepo.create({ data: data as any })
}

export async function updateClient(id: string, data: Partial<{ name: string; familyName: string; phone: string; address?: string; gender?: 'male' | 'female' }>) {
    return clientRepo.update({ where: { id }, data: data as any })
}

export async function deleteClient(id: string) {
    await clientRepo.delete({ where: { id } })
}
