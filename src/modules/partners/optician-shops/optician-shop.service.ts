import { opticianShopRepo } from '@/lib/database/repositories'
import { Prisma } from '@prisma/client'
import { NotFoundError } from '@/lib/errors'

export async function listOpticianShops(params?: { search?: string }) {
    const where: Prisma.OpticianShopWhereInput = {}
    if (params?.search) {
        where.OR = [
            { name: { contains: params.search } },
            { phone: { contains: params.search } },
        ]
    }
    return opticianShopRepo.findMany({ where, orderBy: { name: 'asc' } })
}

export async function createOpticianShop(data: { name: string; phone: string; address?: string | null; notes?: string | null }) {
    return opticianShopRepo.create({ data })
}

export async function updateOpticianShop(id: string, data: { name?: string; phone?: string; address?: string | null; notes?: string | null }) {
    const existing = await opticianShopRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Optician shop not found')
    return opticianShopRepo.update({ where: { id }, data })
}

export async function deleteOpticianShop(id: string) {
    const existing = await opticianShopRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Optician shop not found')
    await opticianShopRepo.update({ where: { id }, data: { deletedAt: new Date() } })
}
