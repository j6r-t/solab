import { NextResponse } from 'next/server'
import { AppError } from '@/errors'

interface ErrorResponse {
    success: false
    statusCode: number
    message: string
    errorCode?: string
    fields?: unknown
    stack?: string
}

export function handleError(error: unknown) {
    if (error instanceof AppError) {
        const body: ErrorResponse = {
            success: false,
            statusCode: error.statusCode,
            message: error.message,
        }
        if (error.errorCode) body.errorCode = error.errorCode
        if ('fields' in error && error.fields) body.fields = error.fields
        if (process.env.NODE_ENV !== 'production') body.stack = error.stack

        return NextResponse.json(body, { status: error.statusCode })
    }

    console.error('Unhandled error:', error)

    const isDev = process.env.NODE_ENV !== 'production'
    const body: ErrorResponse = {
        success: false,
        statusCode: 500,
        message: isDev ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error',
    }
    if (isDev && error instanceof Error) body.stack = error.stack

    return NextResponse.json(body, { status: 500 })
}
