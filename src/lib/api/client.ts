import type { PaginatedResponse } from '@/lib/api/pagination'
import { forceLogout } from '@/stores/auth-store'

interface RequestOptions extends RequestInit {
    keepEnvelope?: boolean
}

const CONNECTION_ERROR_MESSAGE = 'Connection lost — check that the server is running, then try again'

/** Error thrown for non-2xx API responses; carries status and the server's errorCode. */
export class ApiError extends Error {
    status: number
    errorCode?: string
    fields?: unknown

    constructor(message: string, status: number, errorCode?: string, fields?: unknown) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.errorCode = errorCode
        this.fields = fields
    }
}

// Endpoints whose own 401 means "bad credentials", not "session expired" —
// they must never trigger the auto-logout redirect.
const PUBLIC_AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/setup']

async function fetchWithRetry(url: string, init?: RequestInit, retries = 2): Promise<Response> {
    const isGet = !init?.method || init.method === 'GET'
    for (let attempt = 0; ; attempt++) {
        try {
            return await fetch(url, init)
        } catch (error) {
            if (!(error instanceof TypeError)) throw error
            if (!isGet || attempt >= retries) throw new Error(CONNECTION_ERROR_MESSAGE)
            await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)))
        }
    }
}

async function request<T>(url: string, init?: RequestOptions): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

    const headers: Record<string, string> = {}
    if (init?.headers) Object.assign(headers, init.headers)
    if (init?.method && init.method !== 'GET') headers['Content-Type'] = 'application/json'
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetchWithRetry(url, { ...init, headers })
    const body = await res.json().catch(() => null)

    if (!res.ok) {
        const message = body?.message || (body?.fields ? JSON.stringify(body.fields) : `Request failed (${res.status})`)

        // Expired/invalid JWT: log out exactly once and land on the login page.
        // forceLogout() is single-flight, so concurrent 401s are no-ops.
        if (res.status === 401 && !PUBLIC_AUTH_ENDPOINTS.some((ep) => url.startsWith(ep))) {
            forceLogout()
        }

        throw new ApiError(message, res.status, body?.errorCode, body?.fields)
    }

    if (!init?.keepEnvelope && body && typeof body === 'object' && 'data' in body && 'pagination' in body) {
        return body.data as T
    }

    return body
}

function buildQuery(params?: Record<string, string | undefined>): string {
    const sp = new URLSearchParams()
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== '') sp.set(key, value)
        }
    }
    return sp.toString()
}

export const api = {
    get: <T>(path: string, params?: Record<string, string | undefined>): Promise<T> => {
        const qs = buildQuery(params)
        return request<T>(qs ? `${path}?${qs}` : path)
    },

    getPaginated: <T>(path: string, params?: Record<string, string | undefined>): Promise<PaginatedResponse<T>> => {
        const qs = buildQuery(params)
        return request<PaginatedResponse<T>>(qs ? `${path}?${qs}` : path, { keepEnvelope: true })
    },

    post: <T>(path: string, data?: unknown): Promise<T> => {
        return request<T>(path, { method: 'POST', body: JSON.stringify(data) })
    },

    patch: <T>(path: string, data?: unknown): Promise<T> => {
        return request<T>(path, { method: 'PATCH', body: JSON.stringify(data) })
    },

    del: <T = void>(path: string): Promise<T> => {
        return request<T>(path, { method: 'DELETE' })
    },
}
