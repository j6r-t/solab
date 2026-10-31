import { Prisma } from '@prisma/client'
import { bankRepo } from '@/lib/database/repositories'
import { BadRequestError, ConflictError, NotFoundError } from '@/lib/errors'
import { auditService } from '@/modules/system/audit'

function mapDuplicate(error: unknown, name: string): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return new ConflictError(`A bank named "${name}" already exists`)
    }
    return error
}

export async function listBanks() {
    return bankRepo.findMany({ orderBy: { name: 'asc' } })
}

export async function createBank(data: { name: string }) {
    if (!data.name) throw new BadRequestError('Name is required')
    try {
        const bank = await bankRepo.create({ data: { name: data.name } })
        await auditService.log({
            action: 'BANK_CREATED',
            entityType: 'BANK',
            entityId: bank.id,
            metadata: { name: bank.name },
        })
        return bank
    } catch (error) {
        throw mapDuplicate(error, data.name)
    }
}

export async function updateBank(id: string, data: { name?: string }) {
    const existing = await bankRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Bank not found')
    try {
        const bank = await bankRepo.update({ where: { id }, data })
        await auditService.log({
            action: 'BANK_UPDATED',
            entityType: 'BANK',
            entityId: id,
            metadata: { previousName: existing.name, name: bank.name },
        })
        return bank
    } catch (error) {
        throw mapDuplicate(error, data.name ?? existing.name)
    }
}

export async function deleteBank(id: string) {
    const existing = await bankRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Bank not found')
    await bankRepo.delete({ where: { id } })
    await auditService.log({
        action: 'BANK_DELETED',
        entityType: 'BANK',
        entityId: id,
        metadata: { name: existing.name },
    })
}
