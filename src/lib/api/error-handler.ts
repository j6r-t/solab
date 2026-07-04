import { NextResponse } from 'next/server'
import { NotFoundError, ValidationError, ConflictError, UnauthorizedError, ForbiddenError } from '@/lib/errors'

export function handleError(error: unknown) {
    if (error instanceof NotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof ValidationError) {
        const body = error.fields ? { error: error.fields } : { error: error.message }
        return NextResponse.json(body, { status: 400 })
    }
    if (error instanceof ConflictError) {
        return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error instanceof UnauthorizedError) {
        return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
        return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
