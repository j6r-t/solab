async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

    const headers: Record<string, string> = {}
    if (init?.headers) Object.assign(headers, init.headers)
    if (init?.method && init.method !== 'GET') headers['Content-Type'] = 'application/json'
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(url, { ...init, headers })
    const body = await res.json().catch(() => null)

    if (!res.ok) {
        const message = body?.message || (body?.fields ? JSON.stringify(body.fields) : `Request failed (${res.status})`)
        throw new Error(message)
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
