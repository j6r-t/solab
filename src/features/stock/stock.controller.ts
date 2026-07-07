import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { productSchema } from './stock.schema'
import { listProducts, createProduct, updateProduct, deleteProduct } from './stock.service'
import { toProductResponse } from '@/mappers/stock.mapper'

export async function GET(request: NextRequest) {
    try {
        const { search, category, fournisseurId, stockStatus, brand, lensType, material, coating, thickness, sphFrom, sphTo, cylFrom, cylTo, addFrom, addTo } = parseQuery(
            request, 'search', 'category', 'fournisseurId', 'stockStatus', 'brand', 'lensType', 'material', 'coating', 'thickness', 'sphFrom', 'sphTo', 'cylFrom', 'cylTo', 'addFrom', 'addTo'
        )
        const products = await listProducts({ search, category, fournisseurId, stockStatus, brand, lensType, material, coating, thickness, sphFrom, sphTo, cylFrom, cylTo, addFrom, addTo })
        return ok(products.map(toProductResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await parseBody(request, productSchema)
        const product = await createProduct(data)
        return created(toProductResponse(product))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const data = await parseBody(request, productSchema.partial())
        const product = await updateProduct(id, data)
        return ok(toProductResponse(product))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteProduct(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
