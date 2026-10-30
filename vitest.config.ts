import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    // Keep Vite's cache in the root node_modules (test.root is ./src, which
    // would otherwise create a src/node_modules cache dir).
    cacheDir: path.resolve(__dirname, 'node_modules/.vite'),
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
