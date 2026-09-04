export interface CreateRepairInput {
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
}

export interface UpdateRepairInput {
    status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
}

export interface AtelierWorkOrderResponse {
    id: string
    orderId: string | null
    opticianShopId: string | null
    source: 'internal' | 'optician'
    status: string
    servicePrice: string
    lensBlankPrice: string | null
    paymentStatus: string
    amountPaid: string
    expectedCompletionDate: Date | null
    lensBlankLeft: { id: string; brand: string; thickness: string; lensType: string; material: string; coating: string; sellingPrice: string } | null
    lensBlankRight: { id: string; brand: string; thickness: string; lensType: string; material: string; coating: string; sellingPrice: string } | null
    brokenLensBlank: string | null
    replacementLeft: { id: string; brand: string; thickness: string } | null
    replacementRight: { id: string; brand: string; thickness: string } | null
    workOrderServices: { id: string; repairService: { id: string; name: string }; price: string }[]
    opticianShop: { id: string; name: string } | null
    prescription: {
        id: string
        sphRight: string; cylRight: string; axisRight: number; addRight: string; pdRight: number
        sphLeft: string; cylLeft: string; axisLeft: number; addLeft: string; pdLeft: number
        thickness: string | null; lensType: string | null; material: string | null; coating: string | null
        notes: string | null
    } | null
    bill: {
        id: string; billNumber: string; totalAmount: string; paidAmount: string; status: string
    } | null
    order: {
        id: string
        orderNumber: number
        client: { id: string; name: string; familyName: string; phone: string }
    } | null
    createdAt: Date
}

export { type CreateRepairInput as CreateAtelierWorkOrderInput, type UpdateRepairInput as UpdateAtelierWorkOrderInput }
