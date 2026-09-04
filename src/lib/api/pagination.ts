import type { NextRequest } from 'next/server'

export interface PaginationParams {
    page: number
    limit: number
}

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export function parsePagination(request: NextRequest): PaginationParams {
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))
    return { page, limit }
}

export function paginated<T>(allItems: T[], page: number, limit: number): PaginatedResponse<T> {
    const total = allItems.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const start = (page - 1) * limit
    const data = allItems.slice(start, start + limit)
    return {
        data,
        pagination: { page, limit, total, totalPages },
    }
}