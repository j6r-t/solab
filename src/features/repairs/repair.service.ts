import { repairRepo } from '@/lib/database/repositories'
import { sendRepairReadySms } from '@/lib/services/sms'
import { Prisma } from '@prisma/client'
import { ValidationError } from '@/lib/errors'

export async function listRepairs(params?: { status?: string; search?: string }) {
    const where: Prisma.RepairWhereInput = { repairServiceId: { not: null } }
    if (params?.status) where.status = params.status as any
    if (params?.search) {
        where.order = {
            client: {
                OR: [
                    { name: { contains: params.search } },
                    { familyName: { contains: params.search } },
                ],
            },
        }
    }
    return repairRepo.findMany({
        where,
        include: {
            repairService: true,
            order: {
                select: {
                    id: true,
                    orderNumber: true,
                    client: { select: { id: true, name: true, familyName: true, phone: true } },
                },
            },
        },
        orderBy: { expectedCompletionDate: 'asc' },
    })
}

export async function updateRepairStatus(id: string, status: string) {
    if (status === 'completed') {
        const repair = await repairRepo.update({ where: { id }, data: { status: 'completed' } })
        await sendRepairReadySms(id)
        return repair
    }
    if (status) {
        return repairRepo.update({ where: { id }, data: { status: status as any } })
    }
    throw new ValidationError('Status is required')
}

export async function deleteRepair(id: string) {
    await repairRepo.delete({ where: { id } })
}
