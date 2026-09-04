import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
    theme: Theme
    setTheme: (theme: Theme) => void
}

function applyTheme(theme: Theme) {
    const root = document.documentElement
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
    } else {
        root.classList.toggle('dark', theme === 'dark')
    }
}

export const useThemeStore = create(persist<ThemeState>((set) => ({
    theme: 'light',
    setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
    },
}), {
    name: 'sofien_optic_theme',
}))
