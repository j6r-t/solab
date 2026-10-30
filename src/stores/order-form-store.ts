import { create } from 'zustand'
import type { OrderItemInput, OrderRepairInput, PaymentRow } from '@/modules/sales/orders/order-form.types'

interface OrderFormState {
    // Core state
    orderType: 'standard' | 'remounting' | 'direct_sale'
    selectedClientId: string
    selectedPrescriptionId: string
    expectedCompletionDate: string

    // Items and repairs
    items: OrderItemInput[]
    repairs: OrderRepairInput[]

    // Payments
    paymentType: 'full' | 'deposit'
    paymentRows: PaymentRow[]

    // UI state
    clientSearch: string
    productSearch: string
    selectedServiceIds: string[]
    showNewRx: boolean

    // Calculated values
    totalItemsPrice: number
    totalRepairsPrice: number
    grandTotal: number

    // Actions
    setOrderType: (type: 'standard' | 'remounting' | 'direct_sale') => void
    setSelectedClientId: (id: string) => void
    setSelectedPrescriptionId: (id: string) => void
    setExpectedCompletionDate: (date: string) => void

    addItem: (product: OrderItemInput) => void
    updateItem: (index: number, field: keyof OrderItemInput, value: number) => void
    removeItem: (index: number) => void

    addRepair: (date: string) => void
    updateRepair: (index: number, field: keyof OrderRepairInput, value: string | number) => void
    removeRepair: (index: number) => void

    toggleRepairService: (serviceId: string) => void
    updateServiceRepairDate: (serviceId: string, date: string) => void

    addPaymentRow: () => void
    updatePaymentRow: (index: number, field: keyof PaymentRow, value: string | number) => void
    removePaymentRow: (index: number) => void

    setClientSearch: (search: string) => void
    setProductSearch: (search: string) => void
    setShowNewRx: (show: boolean) => void
    reset: () => void
}

export const useOrderFormStore = create<OrderFormState>((set) => ({
    // Initial state from createInitialState
    orderType: 'standard',
    selectedClientId: '',
    selectedPrescriptionId: '',
    expectedCompletionDate: '',
    items: [],
    repairs: [],
    paymentType: 'full',
    paymentRows: [{ key: 'pay_1', amount: '', method: 'cash', number: '', bank: '', dueDate: '' }],
    clientSearch: '',
    productSearch: '',
    selectedServiceIds: [],
    showNewRx: false,

    // Calculated values
    totalItemsPrice: 0,
    totalRepairsPrice: 0,
    grandTotal: 0,

    // Actions
    setOrderType: (type) => set({ orderType: type, paymentType: type === 'direct_sale' ? 'full' : 'full' }),
    setSelectedClientId: (id) => set({ selectedClientId: id, selectedPrescriptionId: '' }),
    setSelectedPrescriptionId: (id) => set({ selectedPrescriptionId: id }),
    setExpectedCompletionDate: (date) => set({ expectedCompletionDate: date }),

    addItem: (product) => set((state) => {
        const existingIndex = state.items.findIndex((item) => item.lensBlankId === product.lensBlankId)
        if (existingIndex >= 0) {
            const updatedItems = [...state.items]
            updatedItems[existingIndex] = {
                ...updatedItems[existingIndex],
                quantity: updatedItems[existingIndex].quantity + 1
            }
            return { items: updatedItems }
        }
        return { items: [...state.items, { ...product, quantity: 1 }] }
    }),

    updateItem: (index, field, value) => set((state) => ({
        items: state.items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    })),

    removeItem: (index) => set((state) => ({
        items: state.items.filter((_, i) => i !== index)
    })),

    addRepair: (date) => set((state) => ({
        repairs: [...state.repairs, { type: '', price: 0, expectedCompletionDate: date }]
    })),

    updateRepair: (index, field, value) => set((state) => ({
        repairs: state.repairs.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    })),

    removeRepair: (index) => set((state) => ({
        repairs: state.repairs.filter((_, i) => i !== index)
    })),

    toggleRepairService: (serviceId) => set((state) => {
        const isSelected = state.selectedServiceIds.includes(serviceId)
        const date = state.expectedCompletionDate || new Date().toISOString().split('T')[0]

        if (isSelected) {
            return {
                selectedServiceIds: state.selectedServiceIds.filter((id) => id !== serviceId),
                repairs: state.repairs.filter((r) => r.repairServiceId !== serviceId)
            }
        }
        return {
            selectedServiceIds: [...state.selectedServiceIds, serviceId],
            repairs: [...state.repairs, {
                type: '',
                price: 0,
                expectedCompletionDate: date,
                repairServiceId: serviceId
            }]
        }
    }),

    updateServiceRepairDate: (serviceId, date) => set((state) => ({
        repairs: state.repairs.map((r) => (r.repairServiceId === serviceId ? { ...r, expectedCompletionDate: date } : r))
    })),

    addPaymentRow: () => set((state) => ({
        paymentRows: [...state.paymentRows, { key: 'pay_' + Date.now(), amount: '', method: 'cash', number: '', bank: '', dueDate: '' }]
    })),

    updatePaymentRow: (index, field, value) => set((state) => ({
        paymentRows: state.paymentRows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    })),

    removePaymentRow: (index) => set((state) => ({
        paymentRows: state.paymentRows.filter((_, i) => i !== index)
    })),

    setClientSearch: (search) => set({ clientSearch: search }),
    setProductSearch: (search) => set({ productSearch: search }),
    setShowNewRx: (show) => set({ showNewRx: show }),

    // Reset form
    reset: () => set({
        orderType: 'standard',
        selectedClientId: '',
        selectedPrescriptionId: '',
        expectedCompletionDate: '',
        items: [],
        repairs: [],
        paymentType: 'full',
        paymentRows: [{ key: 'pay_1', amount: '', method: 'cash', number: '', bank: '', dueDate: '' }],
        clientSearch: '',
        productSearch: '',
        selectedServiceIds: [],
        showNewRx: false,
        totalItemsPrice: 0,
        totalRepairsPrice: 0,
        grandTotal: 0,
    }),
}))
