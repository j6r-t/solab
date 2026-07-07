import { fournisseurRepo } from '@/lib/database/repositories'
import { Prisma } from '@prisma/client'
import { NotFoundError } from '@/errors'

export async function listFournisseurs(params?: { search?: string; entity?: string }) {
    const where: Prisma.FournisseurWhereInput = {}
    if (params?.search) {
        where.OR = [
            { name: { contains: params.search } },
            { phone: { contains: params.search } },
        ]
    }
    if (params?.entity) {
        where.entity = params.entity
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
    email?: string | null
    taxId?: string | null
}

export async function createFournisseur(data: FournisseurInput & { entity?: string }) {
    return fournisseurRepo.create({ data: { name: data.name, phone: data.phone ?? '', address: data.address ?? null, email: data.email ?? null, taxId: data.taxId ?? null, entity: data.entity ?? 'shop' } })
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
