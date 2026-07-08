export interface CreateRepairInput {
    opticianShopId: string
    type: string
    servicePrice: number
    expectedCompletionDate: string
    repairServiceId?: string
    lensBlankLeftId?: string
    lensBlankRightId?: string
    lensBlankPrice?: number
    frameFrom?: 'shop' | 'optician' | 'client' | 'external'
}

export interface UpdateRepairInput {
    status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
}

export interface AtelierWorkOrderResponse {
    id: string
    orderId: string | null
    opticianShopId: string | null
    source: 'internal' | 'optician'
    type: string
    status: string
    servicePrice: string
    lensBlankPrice: string | null
    expectedCompletionDate: Date | null
    frameFrom: string | null
    lensBlankLeft: { id: string; brand: string; thickness: string } | null
    lensBlankRight: { id: string; brand: string; thickness: string } | null
    brokenLensBlank: string | null
    replacementLeft: { id: string; brand: string; thickness: string } | null
    replacementRight: { id: string; brand: string; thickness: string } | null
    repairService: { id: string; name: string } | null
    opticianShop: { id: string; name: string } | null
    order: {
        id: string
        orderNumber: number
        client: { id: string; name: string; familyName: string; phone: string }
    } | null
    createdAt: Date
}

export { type CreateRepairInput as CreateAtelierWorkOrderInput, type UpdateRepairInput as UpdateAtelierWorkOrderInput }
