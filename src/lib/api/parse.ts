import { NextRequest } from 'next/server'
import { flattenError, type ZodType } from 'zod'
import { BadRequestError } from '@/lib/errors'

export async function parseBody<T>(request: NextRequest, schema?: ZodType<T>): Promise<T> {
    const body = await request.json()
    if (schema) {
        const parsed = schema.safeParse(body)
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', flattenError(parsed.error).fieldErrors)
        }
        return parsed.data
    }
    return body as T
}

export function parseQuery(request: NextRequest, ...keys: string[]): Record<string, string | undefined> {
    const { searchParams } = request.nextUrl
    const result: Record<string, string | undefined> = {}
    for (const key of keys) {
        result[key] = searchParams.get(key) || undefined
    }
    return result
}

export async function parseParams<T>(params: Promise<T>): Promise<T> {
    return params
}
