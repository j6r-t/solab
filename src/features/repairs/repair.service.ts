import { repairRepo, opticianShopRepo } from '@/lib/database/repositories'
import { sendRepairReadySms } from '@/lib/services/sms'
import { BadRequestError, NotFoundError } from '@/errors'
import { auditService } from '@/modules/audit'

const WORK_ORDER_INCLUDE = {
    repairService: true,
    opticianShop: { select: { id: true, name: true } },
    order: {
        select: {
            id: true,
            orderNumber: true,
            client: { select: { id: true, name: true, familyName: true, phone: true } },
        },
    },
    lensBlankLeft: { select: { id: true, brand: true, thickness: true } },
    lensBlankRight: { select: { id: true, brand: true, thickness: true } },
    replacementLeft: { select: { id: true, brand: true, thickness: true } },
    replacementRight: { select: { id: true, brand: true, thickness: true } },
} as const

export async function listRepairs(params?: { status?: string; search?: string; source?: string; type?: string }) {
    const where: any = {}
    if (params?.status) where.status = params.status
    if (params?.type) where.type = params.type
    if (params?.source === 'internal') {
        where.orderId = { not: null }
    } else if (params?.source === 'optician') {
        where.opticianShopId = { not: null }
    }
    if (params?.search) {
        where.OR = [
            { order: { client: { name: { contains: params.search } } } },
            { order: { client: { familyName: { contains: params.search } } } },
            { opticianShop: { name: { contains: params.search } } },
        ]
    }
    return repairRepo.findMany({
        where,
        include: WORK_ORDER_INCLUDE,
        orderBy: { expectedCompletionDate: 'asc' },
    })
}

export async function getRepair(id: string) {
    const repair = await repairRepo.findUnique({
        where: { id },
        include: WORK_ORDER_INCLUDE,
    })
    if (!repair) throw new NotFoundError('Work order not found')
    return repair
}

export async function createRepair(data: {
    opticianShopId: string
    type: string
    servicePrice: number
    expectedCompletionDate: string
    repairServiceId?: string
    lensBlankLeftId?: string
    lensBlankRightId?: string
    lensBlankPrice?: number
    frameFrom?: string
}) {
    const { opticianShopId, type, servicePrice, expectedCompletionDate, repairServiceId, lensBlankLeftId, lensBlankRightId, lensBlankPrice, frameFrom } = data
    if (!opticianShopId) throw new BadRequestError('Optician shop is required')

    const shop = await opticianShopRepo.findUnique({ where: { id: opticianShopId } })
    if (!shop) throw new NotFoundError('Optician shop not found')

    const repair = await repairRepo.create({
        data: {
            opticianShopId,
            type,
            source: 'optician',
            servicePrice,
            status: 'pending',
            dueDate: new Date(expectedCompletionDate || Date.now()),
            expectedCompletionDate: new Date(expectedCompletionDate || Date.now()),
            repairServiceId: repairServiceId || null,
            lensBlankLeftId: lensBlankLeftId || null,
            lensBlankRightId: lensBlankRightId || null,
            lensBlankPrice: lensBlankPrice || null,
            frameFrom: frameFrom || null,
        },
        include: { ...WORK_ORDER_INCLUDE },
    })

    await auditService.log({
        action: 'REPAIR_CREATED',
        entityType: 'REPAIR',
        entityId: repair.id,
        metadata: { opticianShopId, type, servicePrice },
    })

    return repair
}

export async function updateRepairStatus(id: string, status: string) {
    const updateData: any = { status }
    if (status === 'in_progress') updateData.startedAt = new Date()
    if (status === 'completed') updateData.completedAt = new Date()

    const repair = await repairRepo.update({
        where: { id },
        data: updateData,
        include: { ...WORK_ORDER_INCLUDE },
    })

    if (status === 'completed') {
        await sendRepairReadySms(id)
        await auditService.log({ action: 'REPAIR_COMPLETED', entityType: 'REPAIR', entityId: id })
    }

    return repair
}

export async function assignLensBlanks(id: string, data: {
    lensBlankLeftId?: string
    lensBlankRightId?: string
    frameFrom?: string
    lensBlankPrice?: number
}) {
    const repair = await repairRepo.findUnique({ where: { id } })
    if (!repair) throw new NotFoundError('Work order not found')

    return repairRepo.update({
        where: { id },
        data: {
            lensBlankLeftId: data.lensBlankLeftId ?? repair.lensBlankLeftId,
            lensBlankRightId: data.lensBlankRightId ?? repair.lensBlankRightId,
            frameFrom: data.frameFrom ?? repair.frameFrom,
            lensBlankPrice: data.lensBlankPrice ?? repair.lensBlankPrice,
        },
        include: { ...WORK_ORDER_INCLUDE },
    })
}

export async function declareBreakage(id: string, data: {
    brokenLensBlank: 'none' | 'left' | 'right' | 'both'
    replacementLeftId?: string
    replacementRightId?: string
}) {
    const repair = await repairRepo.findUnique({ where: { id } })
    if (!repair) throw new NotFoundError('Work order not found')

    return repairRepo.update({
        where: { id },
        data: {
            brokenLensBlank: data.brokenLensBlank,
            replacementLeftId: data.replacementLeftId || null,
            replacementRightId: data.replacementRightId || null,
        },
        include: { ...WORK_ORDER_INCLUDE },
    })
}

export async function deleteRepair(id: string) {
    await repairRepo.delete({ where: { id } })
}

export async function recordPayment(id: string, amount: number) {
    const repair = await repairRepo.findUnique({ where: { id } })
    if (!repair) throw new NotFoundError('Work order not found')

    const totalDue = Number(repair.servicePrice) + Number(repair.lensBlankPrice || 0)
    const newAmountPaid = Number(repair.amountPaid) + amount
    const paymentStatus = newAmountPaid >= totalDue ? 'paid' : newAmountPaid > 0 ? 'partial' : 'pending'

    return repairRepo.update({
        where: { id },
        data: {
            amountPaid: newAmountPaid,
            paymentStatus,
        },
        include: { ...WORK_ORDER_INCLUDE },
    })
}
