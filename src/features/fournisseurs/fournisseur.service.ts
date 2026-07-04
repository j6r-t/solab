import { fournisseurRepo } from '@/lib/database/repositories'
import { Prisma } from '@prisma/client'
import { NotFoundError } from '@/errors'

export async function listFournisseurs(params?: { search?: string }) {
    const where: Prisma.FournisseurWhereInput = {}
    if (params?.search) {
        where.OR = [
            { name: { contains: params.search } },
            { phone: { contains: params.search } },
        ]
    }
    return fournisseurRepo.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
    })
}

interface FournisseurInput {
    name: string
    phone?: string
    address?: string | null
}

export async function createFournisseur(data: FournisseurInput) {
    return fournisseurRepo.create({ data: { name: data.name, phone: data.phone ?? '', address: data.address ?? null } })
}

export async function updateFournisseur(id: string, data: Partial<FournisseurInput>) {
    const existing = await fournisseurRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Fournisseur not found')
    return fournisseurRepo.update({ where: { id }, data })
}

export async function deleteFournisseur(id: string) {
    const existing = await fournisseurRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Fournisseur not found')
    await fournisseurRepo.delete({ where: { id } })
}
