import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { BadRequestError } from '@/errors'
import { listOrders, createOrder, getOrderById, updateOrderStatus, addOrderPayments, deleteOrder } from './order.service'
import { toOrderListItem, toOrderDetail } from '@/mappers/order.mapper'
import type { CreateOrderInput } from '@/dtos/orders/order.dto'

export async function GET(request: NextRequest) {
    try {
        const { status, search } = parseQuery(request, 'status', 'search')
        const orders = await listOrders({ status, search })
        return ok(orders.map(toOrderListItem))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody<CreateOrderInput>(request)
        const order = await createOrder(body as any)
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
        const body: any = await parseBody(request)

        if (body.status) {
            const result = await updateOrderStatus(id, body.status)
            return ok(result)
        }

        if (body.payments) {
            const result = await addOrderPayments(id, body.payments)
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
