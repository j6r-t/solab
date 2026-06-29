import { create } from 'zustand'

interface User {
    id: string
    email: string
    name: string | null
}

interface AuthState {
    isAuthenticated: boolean
    user: User | null
    setAuth: (token: string, user: User) => void
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
            } catch (e) {
                localStorage.removeItem('auth-token')
                localStorage.removeItem('auth-user')
                return { isAuthenticated: false, user: null }
            }
        }
    }
    return { isAuthenticated: false, user: null }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    ...getInitialState(),
    setAuth: (token: string, user: User) => {
        // Store in localStorage for persistence across page reloads
        localStorage.setItem('auth-token', token)
        localStorage.setItem('auth-user', JSON.stringify(user))
        set({ isAuthenticated: true, user })
    },
    logout: () => {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
        set({ isAuthenticated: false, user: null })
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    },
}))
