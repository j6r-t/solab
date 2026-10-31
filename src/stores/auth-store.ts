import { create } from 'zustand'
import { useViewStore } from './view-store'

interface User {
    id: string
    email: string
    name: string | null
    role: string
}

interface AuthState {
    isAuthenticated: boolean
    user: User | null
    setAuth: (token: string, user: User) => void
    setUser: (user: User) => void
    logout: () => void
}

// Initialize from localStorage on first load
const getInitialState = () => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth-token')
        const storedUser = localStorage.getItem('auth-user')
        
        if (token && storedUser) {
            try {
                const user = JSON.parse(storedUser)
                return { isAuthenticated: true, user }
            } catch {
                localStorage.removeItem('auth-token')
                localStorage.removeItem('auth-user')
                return { isAuthenticated: false, user: null }
            }
        }
    }
    return { isAuthenticated: false, user: null }
}

// Module-level single-flight guard: when the JWT expires, several requests can
// 401 at once — only the first one may run the logout/redirect sequence.
let isForcedLogout = false

/**
 * Forced logout after the server rejected the session (401).
 * Reuses the same primitives as the manual logout button (view-store reset,
 * localStorage clear, auth-store reset, server cookie deletion), then does a
 * full page load of '/' which also drops the react-query cache.
 */
export function forceLogout(): void {
    if (isForcedLogout) return
    isForcedLogout = true
    useAuthStore.getState().logout()
    if (typeof window !== 'undefined') {
        window.location.replace('/')
    }
}

export const useAuthStore = create<AuthState>()((set) => ({
    ...getInitialState(),
    setAuth: (token: string, user: User) => {
        // Store in localStorage for persistence across page reloads
        localStorage.setItem('auth-token', token)
        localStorage.setItem('auth-user', JSON.stringify(user))
        set({ isAuthenticated: true, user })
    },
    setUser: (user: User) => {
        localStorage.setItem('auth-user', JSON.stringify(user))
        set({ user })
    },
    logout: () => {
        useViewStore.getState().reset()
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
        set({ isAuthenticated: false, user: null })
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    },
}))
