import { lensBrandRepo } from '@/lib/database/repositories'
import { BadRequestError, NotFoundError } from '@/errors'

export async function listLensBrands() {
    return lensBrandRepo.findMany({ orderBy: { name: 'asc' } })
}

export async function createLensBrand(data: { name: string }) {
    if (!data.name) throw new BadRequestError('Name is required')
    return lensBrandRepo.create({ data: { name: data.name } })
}

export async function updateLensBrand(id: string, data: { name?: string }) {
    const existing = await lensBrandRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Lens brand not found')
    return lensBrandRepo.update({ where: { id }, data })
}

export async function deleteLensBrand(id: string) {
    const existing = await lensBrandRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Lens brand not found')
    await lensBrandRepo.delete({ where: { id } })
}
