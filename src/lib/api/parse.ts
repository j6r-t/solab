import { NextRequest } from 'next/server'
import type { ZodSchema } from 'zod'
import { ValidationError } from '@/lib/errors'

export async function parseBody<T>(request: NextRequest, schema?: ZodSchema<T>): Promise<T> {
    const body = await request.json()
    if (schema) {
        const parsed = schema.safeParse(body)
        if (!parsed.success) {
            throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors)
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
