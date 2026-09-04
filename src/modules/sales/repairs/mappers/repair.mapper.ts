import type { AtelierWorkOrderResponse } from '@/modules/sales/repairs/dtos/repair.dto'
import type { WORK_ORDER_INCLUDE } from '../repair.service'
import type { Prisma } from '@prisma/client'

type Numeric = Prisma.Decimal | string | number | null

type RepairWithRelations = Prisma.AtelierWorkOrderGetPayload<{ include: typeof WORK_ORDER_INCLUDE }>

function toStr(val: Numeric): string {
    if (val == null) return '0'
    if (typeof val === 'string') return val
    if (typeof val === 'number') return val.toString()
    return String(val)
}

type LensBlankSide = RepairWithRelations['lensBlankLeft']

function toLensBlankSide(blank: LensBlankSide) {
    return blank ? { ...blank, sellingPrice: toStr(blank.sellingPrice) } : null
}

export function toRepairResponse(repair: RepairWithRelations): AtelierWorkOrderResponse {
    return {
        id: repair.id,
        orderId: repair.orderId || null,
        opticianShopId: repair.opticianShopId || null,
        source: repair.opticianShopId ? 'optician' : 'internal',
        status: repair.status,
        servicePrice: (repair.servicePrice || 0).toString(),
        lensBlankPrice: repair.lensBlankPrice != null ? repair.lensBlankPrice.toString() : null,
        paymentStatus: repair.paymentStatus || 'pending',
        amountPaid: (repair.amountPaid || 0).toString(),
        expectedCompletionDate: repair.expectedCompletionDate,
        lensBlankLeft: toLensBlankSide(repair.lensBlankLeft),
        lensBlankRight: toLensBlankSide(repair.lensBlankRight),
        brokenLensBlank: repair.brokenLensBlank || null,
        replacementLeft: repair.replacementLeft || null,
        replacementRight: repair.replacementRight || null,
        workOrderServices: (repair.workOrderServices || []).map((s) => ({
            id: s.id,
            repairService: s.repairService,
            price: (s.price || 0).toString(),
        })),
        opticianShop: repair.opticianShop || null,
        prescription: repair.prescription
            ? {
                id: repair.prescription.id,
                sphRight: toStr(repair.prescription.sphRight),
                cylRight: toStr(repair.prescription.cylRight),
                axisRight: repair.prescription.axisRight,
                addRight: toStr(repair.prescription.addRight),
                pdRight: repair.prescription.pdRight,
                sphLeft: toStr(repair.prescription.sphLeft),
                cylLeft: toStr(repair.prescription.cylLeft),
                axisLeft: repair.prescription.axisLeft,
                addLeft: toStr(repair.prescription.addLeft),
                pdLeft: repair.prescription.pdLeft,
                thickness: repair.prescription.thickness ?? null,
                lensType: repair.prescription.lensType ?? null,
                material: repair.prescription.material ?? null,
                coating: repair.prescription.coating ?? null,
                notes: repair.prescription.notes ?? null,
            }
            : null,
        bill: repair.bill
            ? {
                id: repair.bill.id,
                billNumber: repair.bill.billNumber,
                totalAmount: toStr(repair.bill.totalAmount),
                paidAmount: toStr(repair.bill.paidAmount),
                status: repair.bill.status,
            }
            : null,
        order: repair.order || null,
        createdAt: repair.createdAt,
    }
}
