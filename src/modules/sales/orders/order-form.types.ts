import { formatDate } from '@/lib/utils/dates'

export interface OrderItemInput {
    productId?: string
    lensBlankId?: string
    quantity: number
    unitPrice: number
    name?: string
    sellingPrice?: number
}

export interface OrderPaymentInput {
    amount: number
    type: 'full' | 'deposit' | 'balance'
    method?: 'cash' | 'cheque' | 'card'
    chequeId?: string
    dueDate?: string
    cheque?: { number: string; bankName?: string; type?: 'standard' | 'traite'; dueDate: string }
}

export interface OrderRepairInput {
    type: string
    price: number
    expectedCompletionDate: string
    repairServiceId?: string
}

export interface OrderFormData {
    clientId: string
    orderType: 'standard' | 'remounting' | 'direct_sale'
    items: OrderItemInput[]
    payments: OrderPaymentInput[]
    repairs: OrderRepairInput[]
    prescriptionId?: string
    turnaroundDays?: number
}

export interface Client {
    id: string
    name: string
    familyName: string
    phone: string
}

export interface Product {
    id: string
    name: string
    brand: string
    model: string
    price: string | number
    quantity?: number
    category: string
}

export interface PrescriptionOption {
    id: string
    doctor: { name: string } | null
    createdAt: string
    dateWritten: string | null
    client: { name: string; familyName: string }
    sphRight: string
    cylRight: string
    axisRight: number
    sphLeft: string
    cylLeft: string
    axisLeft: number
}

export interface RxDoctor {
    id: string
    name: string
    phone: string
}

export interface RepairService {
    id: string
    name: string
    defaultPrice: string
}

export interface LensBlankOption {
    id: string
    brand: string
    lensType: string | null
    material: string | null
    coating: string | null
    thickness: string | null
    sph: string
    cyl: string
    quantity: number
    costPrice: string
    sellingPrice: string
}

export interface OrderFormProps {
    defaultValues?: Partial<OrderFormData>
    onSubmit: (data: OrderFormData) => Promise<void>
    onCancel: () => void
    saving?: boolean
    forcedOrderType?: 'standard' | 'remounting' | 'direct_sale'
}

export type PaymentRowMethod = 'cash' | 'card' | 'cheque' | 'traite'

export interface PaymentRow {
    key: string
    amount: string
    method: PaymentRowMethod
    number: string
    bank: string
    dueDate: string
}

let payKeyCounter = 0
export function newPayKey() { return `pay_${++payKeyCounter}` }

export function newPaymentRow(): PaymentRow {
    return { key: newPayKey(), amount: '', method: 'cash', number: '', bank: '', dueDate: '' }
}

export function prescriptionLabel(p: PrescriptionOption): string {
    const date = formatDate(p.dateWritten || p.createdAt)
    return `OG:${p.cylLeft}(${p.sphLeft} , ${p.axisLeft}) | OD:${p.cylRight}(${p.sphRight} , ${p.axisRight}) ${date}`
}
