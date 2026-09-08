import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { productSchema } from './stock.schema'
import { listProducts, createProduct, updateProduct, deleteProduct } from './stock.service'
import { toProductResponse } from '@/modules/inventory/stock/mappers/stock.mapper'

const STOCK_ROLES = ['admin', 'shop']

export async function GET(request: NextRequest) {
    try {
        requireRole(STOCK_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { search, category, fournisseurId, stockStatus, brand, lensType, material, coating, thickness, sphFrom, sphTo, cylFrom, cylTo, addFrom, addTo, excludeCategory } = parseQuery(
            request, 'search', 'category', 'fournisseurId', 'stockStatus', 'brand', 'lensType', 'material', 'coating', 'thickness', 'sphFrom', 'sphTo', 'cylFrom', 'cylTo', 'addFrom', 'addTo', 'excludeCategory'
        )
        const products = await listProducts({ search, category, fournisseurId, stockStatus, brand, lensType, material, coating, thickness, sphFrom, sphTo, cylFrom, cylTo, addFrom, addTo, excludeCategory })
        return ok(paginated(products.map(toProductResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(STOCK_ROLES)(request)
        const data = await parseBody(request, productSchema)
        const product = await createProduct(data)
        return created(toProductResponse(product))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(STOCK_ROLES)(request)
        const { id } = await params
        const data = await parseBody(request, productSchema.partial())
        const product = await updateProduct(id, data)
        return ok(toProductResponse(product))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(STOCK_ROLES)(request)
        const { id } = await params
        await deleteProduct(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
