import { repairServiceRepo, repairRepo } from '@/lib/database/repositories'
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors'

export async function listRepairServices() {
    return repairServiceRepo.findMany({ orderBy: { name: 'asc' } })
}

export async function createRepairService(data: { name: string; defaultPrice: number }) {
    if (!data.name || data.defaultPrice === undefined) {
        throw new ValidationError('Name and default price are required')
    }
    return repairServiceRepo.create({ data: { name: data.name, defaultPrice: parseFloat(String(data.defaultPrice)) } })
}

export async function updateRepairService(id: string, data: { name?: string; defaultPrice?: number }) {
    const existing = await repairServiceRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Repair service not found')
    return repairServiceRepo.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.defaultPrice !== undefined && { defaultPrice: parseFloat(String(data.defaultPrice)) }),
        },
    })
}

export async function deleteRepairService(id: string) {
    const existing = await repairServiceRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Repair service not found')
    const linked = await repairRepo.findFirst({ where: { repairServiceId: id } })
    if (linked) throw new ConflictError('Cannot delete: service is linked to existing repairs')
    await repairServiceRepo.delete({ where: { id } })
}
