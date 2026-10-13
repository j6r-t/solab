import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        root: './src',
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            reportOnFailure: true,
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
