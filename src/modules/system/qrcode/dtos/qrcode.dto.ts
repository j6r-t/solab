export interface QRCodeResponse {
    id: string
    code: string
    product: {
        id: string
        name: string
        brand: string
        model: string
        category: string
        price: number
        priceAfterTax: number | null
    } | null
}
