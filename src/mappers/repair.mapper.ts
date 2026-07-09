import type { AtelierWorkOrderResponse } from '@/dtos/repairs/repair.dto'

export function toRepairResponse(repair: any): AtelierWorkOrderResponse {
    return {
        id: repair.id,
        orderId: repair.orderId || null,
        opticianShopId: repair.opticianShopId || null,
        source: repair.opticianShopId ? 'optician' : 'internal',
        type: repair.type,
        status: repair.status,
        servicePrice: (repair.servicePrice || 0).toString(),
        lensBlankPrice: repair.lensBlankPrice != null ? repair.lensBlankPrice.toString() : null,
        paymentStatus: repair.paymentStatus || 'pending',
        amountPaid: (repair.amountPaid || 0).toString(),
        expectedCompletionDate: repair.expectedCompletionDate,
        frameFrom: repair.frameFrom || null,
        lensBlankLeft: repair.lensBlankLeft || null,
        lensBlankRight: repair.lensBlankRight || null,
        brokenLensBlank: repair.brokenLensBlank || null,
        replacementLeft: repair.replacementLeft || null,
        replacementRight: repair.replacementRight || null,
        repairService: repair.repairService || null,
        opticianShop: repair.opticianShop || null,
        order: repair.order || null,
        createdAt: repair.createdAt,
    }
}
