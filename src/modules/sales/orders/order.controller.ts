import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { BadRequestError } from '@/lib/errors'
import { listOrders, createOrder, getOrderById, updateOrderStatus, addOrderPayments, deleteOrder } from './order.service'
import { toOrderListItem, toOrderDetail } from '@/modules/sales/orders/mappers/order.mapper'
import { createOrderSchema, updateOrderStatusSchema, addOrderPaymentsSchema } from '@/modules/sales/orders/order.schema'

export async function GET(request: NextRequest) {
    try {
        const { page, limit } = parsePagination(request)
        const { status, search, clientId } = parseQuery(request, 'status', 'search', 'clientId')
        const orders = await listOrders({ status, search, clientId })
        return ok(paginated(orders.map(toOrderListItem), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody(request, createOrderSchema)
        const order = await createOrder(body)
        return created(toOrderDetail(order))
    } catch (error) {
        return handleError(error)
    }
}

export async function GET_ID(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const order = await getOrderById(id)
        return ok(toOrderDetail(order))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const raw = await request.json()

        if (raw.payments) {
            const { payments } = addOrderPaymentsSchema.parse(raw)
            const result = await addOrderPayments(id, payments)
            return ok(result)
        }

        if (raw.status) {
            const { status } = updateOrderStatusSchema.parse(raw)
            const result = await updateOrderStatus(id, status)
            return ok(result)
        }

        throw new BadRequestError('No valid updates')
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteOrder(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}