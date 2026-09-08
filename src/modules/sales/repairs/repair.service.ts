import { repairRepo, opticianShopRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { sendRepairReadySms } from '@/lib/services/sms'
import { BadRequestError, NotFoundError } from '@/lib/errors'
import { auditService } from '@/modules/system/audit'
import { LensType, LensMaterial, LensCoating, BillItemType, AtelierWorkOrderStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'

export const WORK_ORDER_INCLUDE = {
    workOrderServices: { include: { repairService: true } },
    opticianShop: { select: { id: true, name: true } },
    order: {
        select: {
            id: true,
            orderNumber: true,
            client: { select: { id: true, name: true, familyName: true, phone: true } },
        },
    },
    lensBlankLeft: { select: { id: true, brand: true, thickness: true, lensType: true, material: true, coating: true, sellingPrice: true } },
    lensBlankRight: { select: { id: true, brand: true, thickness: true, lensType: true, material: true, coating: true, sellingPrice: true } },
    replacementLeft: { select: { id: true, brand: true, thickness: true } },
    replacementRight: { select: { id: true, brand: true, thickness: true } },
    prescription: true,
    bill: { select: { id: true, billNumber: true, totalAmount: true, paidAmount: true, status: true } },
} as const

function supplierAbbreviation(name: string): string {
    return name
        .split(' ')
        .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase())
        .filter(Boolean)
        .join('')
        .slice(0, 4) || 'SUP'
}

export async function listRepairs(params?: { status?: string; search?: string; source?: string; type?: string }) {
    const where: Prisma.AtelierWorkOrderWhereInput = {}
    if (params?.status) where.status = params.status as AtelierWorkOrderStatus
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
    serviceIds: string[]
    expectedCompletionDate: string
    lensSource: 'stock' | 'optician'
    // Prescription
    sphRight: number
    cylRight: number
    axisRight: number
    addRight: number
    pdRight: number
    sphLeft: number
    cylLeft: number
    axisLeft: number
    addLeft: number
    pdLeft: number
    thickness?: string
    lensType?: string
    material?: string
    coating?: string
    prescriptionNotes?: string
    // Lens blanks (only when lensSource = 'stock')
    lensBlankLeftId?: string
    lensBlankRightId?: string
    lensBlankPrice?: number
}) {
    if (!data.opticianShopId) throw new BadRequestError('Optician shop is required')
    if (!data.serviceIds?.length) throw new BadRequestError('At least one service is required')

    const shop = await opticianShopRepo.findUnique({ where: { id: data.opticianShopId } })
    if (!shop) throw new NotFoundError('Optician shop not found')

    // Validate services exist
    const services = await db.repairService.findMany({
        where: { id: { in: data.serviceIds } },
    })
    if (services.length !== data.serviceIds.length) throw new BadRequestError('One or more selected services not found')

    // Calculate service price from selected services
    const servicePrice = services.reduce((sum, s) => sum + Number(s.defaultPrice), 0)

    // If lenses from stock, validate provided blanks exist and have stock
    if (data.lensSource === 'stock') {
        if (data.lensBlankLeftId) {
            const blank = await db.lensBlank.findUnique({ where: { id: data.lensBlankLeftId } })
            if (!blank) throw new BadRequestError('Left lens blank not found')
            if (blank.quantity < 1) throw new BadRequestError(`Left eye blank "${blank.brand}" is out of stock`)
        }
        if (data.lensBlankRightId) {
            const blank = await db.lensBlank.findUnique({ where: { id: data.lensBlankRightId } })
            if (!blank) throw new BadRequestError('Right lens blank not found')
            if (blank.quantity < 1) throw new BadRequestError(`Right eye blank "${blank.brand}" is out of stock`)
        }
    }

    const dueDate = new Date(data.expectedCompletionDate || Date.now())

    // Create work order + prescription + services + bill in a transaction
    const repair = await db.$transaction(async (tx) => {
        // 1. Create the work order
        const wo = await tx.atelierWorkOrder.create({
            data: {
                opticianShopId: data.opticianShopId,
                source: 'optician',
                servicePrice,
                status: 'pending',
                dueDate,
                expectedCompletionDate: dueDate,
                lensBlankLeftId: data.lensSource === 'stock' ? (data.lensBlankLeftId || null) : null,
                lensBlankRightId: data.lensSource === 'stock' ? (data.lensBlankRightId || null) : null,
                lensBlankPrice: data.lensSource === 'stock' ? (data.lensBlankPrice || null) : null,
            },
        })

        // 2. Create the prescription
        await tx.opticianShopPrescription.create({
            data: {
                opticianShopId: data.opticianShopId,
                workOrderId: wo.id,
                sphRight: data.sphRight,
                cylRight: data.cylRight,
                axisRight: data.axisRight,
                addRight: data.addRight,
                pdRight: data.pdRight,
                sphLeft: data.sphLeft,
                cylLeft: data.cylLeft,
                axisLeft: data.axisLeft,
                addLeft: data.addLeft,
                pdLeft: data.pdLeft,
                thickness: data.thickness || null,
                lensType: (data.lensType as LensType) || null,
                material: (data.material as LensMaterial) || null,
                coating: (data.coating as LensCoating) || null,
                notes: data.prescriptionNotes || null,
            },
        })

        // 3. Create work order services
        for (const serviceId of data.serviceIds) {
            const svc = services.find((s) => s.id === serviceId)!
            await tx.workOrderService.create({
                data: {
                    workOrderId: wo.id,
                    repairServiceId: serviceId,
                    price: Number(svc.defaultPrice),
                },
            })
        }

        // 4. If lenses from stock: decrement blank stock + create bill (per-blank)
        if (data.lensSource === 'stock' && (data.lensBlankLeftId || data.lensBlankRightId)) {
            const billItems: { description: string; quantity: number; unitPrice: number; itemType: BillItemType; lensBlankId?: string }[] = []

            // Service line items
            for (const svc of services) {
                billItems.push({
                    description: svc.name,
                    quantity: 1,
                    unitPrice: Number(svc.defaultPrice),
                    itemType: 'service' as BillItemType,
                })
            }

            // Left blank: decrement + adjust + bill item
            if (data.lensBlankLeftId) {
                const leftBlank = await tx.lensBlank.findUnique({ where: { id: data.lensBlankLeftId } })
                await tx.lensBlank.update({ where: { id: data.lensBlankLeftId }, data: { quantity: { decrement: 1 } } })
                await tx.lensBlankAdjustment.create({
                    data: { lensBlankId: data.lensBlankLeftId, quantity: -1, reason: 'used_in_mounting', workOrderId: wo.id },
                })
                if (leftBlank) {
                    billItems.push({
                        description: `${leftBlank.brand} ${leftBlank.lensType} ${leftBlank.material} ${leftBlank.thickness} (Left)`,
                        quantity: 1,
                        unitPrice: Number(leftBlank.sellingPrice),
                        itemType: 'lens_blank' as BillItemType,
                        lensBlankId: data.lensBlankLeftId,
                    })
                }
            }

            // Right blank: decrement + adjust + bill item
            if (data.lensBlankRightId) {
                const rightBlank = await tx.lensBlank.findUnique({ where: { id: data.lensBlankRightId } })
                await tx.lensBlank.update({ where: { id: data.lensBlankRightId }, data: { quantity: { decrement: 1 } } })
                await tx.lensBlankAdjustment.create({
                    data: { lensBlankId: data.lensBlankRightId, quantity: -1, reason: 'used_in_mounting', workOrderId: wo.id },
                })
                if (rightBlank) {
                    billItems.push({
                        description: `${rightBlank.brand} ${rightBlank.lensType} ${rightBlank.material} ${rightBlank.thickness} (Right)`,
                        quantity: 1,
                        unitPrice: Number(rightBlank.sellingPrice),
                        itemType: 'lens_blank' as BillItemType,
                        lensBlankId: data.lensBlankRightId,
                    })
                }
            }

            // Create the bill (only if at least one blank was assigned)
            if (data.lensBlankLeftId || data.lensBlankRightId) {
                const totalAmount = billItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

                // Generate bill number
                const abbr = supplierAbbreviation(shop.name)
                const existingBills = await tx.opticianShopBill.findMany({
                    where: { opticianShopId: data.opticianShopId },
                    select: { billNumber: true },
                })
                let maxSeq = 0
                const prefix = `FAC-${abbr}-`
                for (const b of existingBills) {
                    if (b.billNumber.startsWith(prefix)) {
                        const num = parseInt(b.billNumber.slice(prefix.length), 10)
                        if (!isNaN(num) && num > maxSeq) maxSeq = num
                    }
                }
                const billNumber = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`

                // Create the bill
                await tx.opticianShopBill.create({
                    data: {
                        billNumber,
                        opticianShopId: data.opticianShopId,
                        workOrderId: wo.id,
                        totalAmount,
                        paidAmount: 0,
                        status: 'unpaid',
                        items: {
                            create: billItems,
                        },
                    },
                })
            }
        }

        return wo
    }, { timeout: 15000 })

    // Re-fetch with all includes
    const full = await repairRepo.findUnique({
        where: { id: repair.id },
        include: WORK_ORDER_INCLUDE,
    })
    if (!full) throw new NotFoundError('Work order not found')

    await auditService.log({
        action: 'REPAIR_CREATED',
        entityType: 'REPAIR',
        entityId: repair.id,
        metadata: { opticianShopId: data.opticianShopId, serviceIds: data.serviceIds, lensSource: data.lensSource },
    })

    return full
}

export async function updateRepairStatus(id: string, status: string) {
    const updateData: Prisma.AtelierWorkOrderUpdateInput = { status: status as AtelierWorkOrderStatus }
    if (status === 'in_progress') updateData.startedAt = new Date()
    if (status === 'completed') updateData.completedAt = new Date()

    const repair = await repairRepo.update({
        where: { id },
        data: updateData,
        include: { ...WORK_ORDER_INCLUDE },
    })
    if (!repair) throw new NotFoundError('Work order not found')

    if (status === 'completed') {
        await sendRepairReadySms(id)
        await auditService.log({ action: 'REPAIR_COMPLETED', entityType: 'REPAIR', entityId: id })
    }

    return repair
}

export async function assignLensBlanks(id: string, data: {
    lensBlankLeftId?: string
    lensBlankRightId?: string
    lensBlankPrice?: number
}) {
    const repair = await repairRepo.findUnique({ where: { id } })
    if (!repair) throw new NotFoundError('Work order not found')

    const updated = await repairRepo.update({
        where: { id },
        data: {
            lensBlankLeftId: data.lensBlankLeftId ?? repair.lensBlankLeftId,
            lensBlankRightId: data.lensBlankRightId ?? repair.lensBlankRightId,
            lensBlankPrice: data.lensBlankPrice ?? repair.lensBlankPrice,
        },
        include: { ...WORK_ORDER_INCLUDE },
    })
    if (!updated) throw new NotFoundError('Work order not found')
    return updated
}

export async function declareBreakage(id: string, data: {
    brokenLensBlank: 'none' | 'left' | 'right' | 'both'
    replacementLeftId?: string
    replacementRightId?: string
}) {
    const repair = await repairRepo.findUnique({ where: { id } })
    if (!repair) throw new NotFoundError('Work order not found')

    // COST RULE (owner requirement): declaring a breakage must never change what
    // the client is billed. servicePrice, lensBlankPrice, amountPaid and any
    // OpticianShopBill / bill items stay exactly as they are — the atelier
    // absorbs the replacement cost. Only stock and the adjustment ledger move.
    await db.$transaction(async (tx) => {
        // 1. Record the declaration on the work order (only overwrite replacements that are provided)
        const woData: Prisma.AtelierWorkOrderUncheckedUpdateInput = {
            brokenLensBlank: data.brokenLensBlank,
        }
        if (data.replacementLeftId !== undefined) woData.replacementLeftId = data.replacementLeftId || null
        if (data.replacementRightId !== undefined) woData.replacementRightId = data.replacementRightId || null
        await tx.atelierWorkOrder.update({ where: { id }, data: woData })

        // 2. Consume a replacement blank from stock for each broken stock-sourced eye
        //    (a non-null blank id on the work order means the blank came from our shelves;
        //    the broken original was already consumed at creation with 'used_in_mounting',
        //    so the replacement is a new physical blank leaving the shelf).
        //    Optician-supplied eyes (null blank id) are recorded only — no stock movement.
        const brokenEyes: ('left' | 'right')[] =
            data.brokenLensBlank === 'both' ? ['left', 'right'] :
            data.brokenLensBlank === 'none' ? [] :
            [data.brokenLensBlank]

        for (const eye of brokenEyes) {
            const stockBlankId = eye === 'left' ? repair.lensBlankLeftId : repair.lensBlankRightId
            const replacementId = eye === 'left' ? data.replacementLeftId : data.replacementRightId
            if (!stockBlankId || !replacementId) continue

            const replacement = await tx.lensBlank.findUnique({ where: { id: replacementId } })
            if (!replacement) throw new NotFoundError(`${eye === 'left' ? 'Left' : 'Right'} replacement lens blank not found`)
            if (replacement.quantity < 1) throw new BadRequestError('Insufficient stock')

            await tx.lensBlank.update({ where: { id: replacementId }, data: { quantity: { decrement: 1 } } })
            await tx.lensBlankAdjustment.create({
                data: { lensBlankId: replacementId, quantity: -1, reason: 'broken_during_mounting', workOrderId: id },
            })
        }
    }, { timeout: 15000 })

    // Re-fetch with all includes
    const updated = await repairRepo.findUnique({
        where: { id },
        include: { ...WORK_ORDER_INCLUDE },
    })
    if (!updated) throw new NotFoundError('Work order not found')

    await auditService.log({
        action: 'BREAKAGE_DECLARED',
        entityType: 'REPAIR',
        entityId: id,
        metadata: { brokenLensBlank: data.brokenLensBlank, replacementLeftId: data.replacementLeftId, replacementRightId: data.replacementRightId },
    })

    return updated
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

    const updated = await repairRepo.update({
        where: { id },
        data: {
            amountPaid: newAmountPaid,
            paymentStatus,
        },
        include: { ...WORK_ORDER_INCLUDE },
    })
    if (!updated) throw new NotFoundError('Work order not found')
    return updated
}
