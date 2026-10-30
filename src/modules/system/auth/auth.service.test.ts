/**
 * Unit tests for auth.service.ts
 * Run with: npm test -- auth.service.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock bcryptjs first (before auth.service is imported)
const mockHash = vi.fn()
const mockCompare = vi.fn()
vi.mock('bcryptjs', () => ({
    default: { hash: mockHash, compare: mockCompare },
    hash: mockHash,
    compare: mockCompare,
}))

// Mock database repositories
const mockFindUnique = vi.fn()
const mockFindFirst = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
vi.mock('@/lib/database/repositories', () => ({
    userRepo: {
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        create: mockCreate,
        update: mockUpdate,
    },
}))

// Mock audit service
const mockLog = vi.fn()
vi.mock('@/modules/system/audit', () => ({
    auditService: {
        log: mockLog,
    },
}))

// Mock errors
vi.mock('@/lib/errors', () => ({
    BadRequestError: class BadRequestError extends Error {
        constructor(message: string) {
            super(message)
            this.name = 'BadRequestError'
        }
    },
    UnauthorizedError: class UnauthorizedError extends Error {
        constructor(message: string) {
            super(message)
            this.name = 'UnauthorizedError'
        }
    },
    NotFoundError: class NotFoundError extends Error {
        constructor(message: string) {
            super(message)
            this.name = 'NotFoundError'
        }
    },
    ForbiddenError: class ForbiddenError extends Error {
        constructor(message: string) {
            super(message)
            this.name = 'ForbiddenError'
        }
    },
}))

// Mock jose - need to use a class-based approach for SignJWT
class MockSignJWT {
    private payload: Record<string, unknown>
    private protectedHeader: Record<string, unknown> = {}
    private expirationTime: string | number = '1h'

    constructor(payload: Record<string, unknown>) {
        this.payload = payload
    }

    setProtectedHeader(header: Record<string, unknown>) {
        this.protectedHeader = header
        return this
    }

    setExpirationTime(time: string | number) {
        this.expirationTime = time
        return this
    }

    async sign(_secret: unknown) {
        // Return a simple JWT-like string
        return `jwt-token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    }
}

vi.mock('jose', () => ({
    SignJWT: MockSignJWT,
    jwtVerify: vi.fn(),
}))

describe('auth.service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    describe('hashPassword', () => {
        it('should hash a password using bcrypt', async () => {
            mockHash.mockResolvedValue('hashed-password')
            const { hashPassword } = await import('./auth.service')
            const result = await hashPassword('mypassword')
            expect(result).toBe('hashed-password')
            expect(mockHash).toHaveBeenCalledWith('mypassword', 10)
        })
    })

    describe('comparePassword', () => {
        it('should compare password with hash using bcrypt', async () => {
            mockCompare.mockResolvedValue(true)
            const { comparePassword } = await import('./auth.service')
            const result = await comparePassword('mypassword', 'hashed-password')
            expect(result).toBe(true)
            expect(mockCompare).toHaveBeenCalledWith('mypassword', 'hashed-password')
        })
    })

    describe('createToken', () => {
        it('should create a JWT token', async () => {
            const { createToken } = await import('./auth.service')
            const result = await createToken({ email: 'test@example.com', role: 'admin' })
            expect(result).toMatch(/^jwt-token-/)
        })
    })

    describe('verifyToken', () => {
        it('should verify a valid token and return payload', async () => {
            const mockJwtVerify = vi.fn().mockResolvedValue({
                payload: { email: 'test@example.com', role: 'admin' },
            })
            vi.doMock('jose', () => ({
                SignJWT: MockSignJWT,
                jwtVerify: mockJwtVerify,
            }))
            const { verifyToken } = await import('./auth.service')
            const result = await verifyToken('valid-token')
            expect(result).toEqual({ email: 'test@example.com', role: 'admin' })
        })

        it('should return null for invalid token', async () => {
            const mockJwtVerify = vi.fn().mockRejectedValue(new Error('Invalid token'))
            vi.doMock('jose', () => ({
                SignJWT: MockSignJWT,
                jwtVerify: mockJwtVerify,
            }))
            const { verifyToken } = await import('./auth.service')
            const result = await verifyToken('invalid-token')
            expect(result).toBeNull()
        })

        it('should return null if token has no email', async () => {
            const mockJwtVerify = vi.fn().mockResolvedValue({
                payload: { role: 'admin' },
            })
            vi.doMock('jose', () => ({
                SignJWT: MockSignJWT,
                jwtVerify: mockJwtVerify,
            }))
            const { verifyToken } = await import('./auth.service')
            const result = await verifyToken('token-without-email')
            expect(result).toBeNull()
        })
    })

    describe('authenticateUser', () => {
        it('should throw BadRequestError if email or password missing', async () => {
            const { authenticateUser } = await import('./auth.service')
            await expect(authenticateUser('', 'password')).rejects.toThrow('Email and password are required')
            await expect(authenticateUser('test@example.com', '')).rejects.toThrow('Email and password are required')
        })

        it('should throw UnauthorizedError if user not found', async () => {
            mockFindUnique.mockResolvedValue(null)
            const { authenticateUser } = await import('./auth.service')
            await expect(authenticateUser('test@example.com', 'password')).rejects.toThrow('Invalid email or password')
        })

        it('should throw UnauthorizedError if password mismatch', async () => {
            mockFindUnique.mockResolvedValue({ id: '1', email: 'test@example.com', password: 'hashed' })
            mockCompare.mockResolvedValue(false)
            const { authenticateUser } = await import('./auth.service')
            await expect(authenticateUser('test@example.com', 'wrong-password')).rejects.toThrow('Invalid email or password')
        })

        it('should return token and user on successful authentication', async () => {
            const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'admin', password: 'hashed' }
            mockFindUnique.mockResolvedValue(mockUser)
            mockCompare.mockResolvedValue(true)

            const { authenticateUser } = await import('./auth.service')
            const result = await authenticateUser('test@example.com', 'password')

            expect(result).toEqual({
                token: expect.stringMatching(/^jwt-token-/),
                user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'admin' },
            })
            expect(mockLog).toHaveBeenCalledWith({
                action: 'USER_LOGIN',
                entityType: 'USER',
                entityId: '1',
                metadata: { email: 'test@example.com' },
                userId: '1',
            })
        })
    })

    describe('setupAdmin', () => {
        it('should throw error if admin already exists', async () => {
            mockFindFirst.mockResolvedValue({ id: '1' })
            const { setupAdmin } = await import('./auth.service')
            await expect(setupAdmin()).rejects.toThrow('Admin user already exists')
        })

        it('should create admin user with secure password', async () => {
            mockFindFirst.mockResolvedValue(null)
            mockCreate.mockResolvedValue({ id: '1', email: 'owner@sofien.tn', name: 'Sofien', role: 'admin' })
            mockHash.mockResolvedValue('hashed-password')

            const { setupAdmin } = await import('./auth.service')
            const result = await setupAdmin()

            expect(result.user.email).toBe('owner@sofien.tn')
            expect(result.user.name).toBe('Sofien')
            expect(result.user.role).toBe('admin')
            expect(result.defaultPassword).toBeDefined()
            expect(mockHash).toHaveBeenCalled()
        })
    })

    describe('changePassword', () => {
        it('should throw BadRequestError if passwords missing', async () => {
            const { changePassword } = await import('./auth.service')
            await expect(changePassword('test@example.com', '', 'newpass')).rejects.toThrow('Current password and new password are required')
            await expect(changePassword('test@example.com', 'oldpass', '')).rejects.toThrow('Current password and new password are required')
        })

        it('should throw BadRequestError if new password too short', async () => {
            const { changePassword } = await import('./auth.service')
            await expect(changePassword('test@example.com', 'oldpass', 'short')).rejects.toThrow('New password must be at least 6 characters')
        })

        it('should throw NotFoundError if user not found', async () => {
            mockFindUnique.mockResolvedValue(null)
            const { changePassword } = await import('./auth.service')
            await expect(changePassword('test@example.com', 'oldpass', 'newpassword')).rejects.toThrow('User not found')
        })

        it('should throw ForbiddenError if current password incorrect', async () => {
            mockFindUnique.mockResolvedValue({ id: '1', password: 'hashed' })
            mockCompare.mockResolvedValue(false)
            const { changePassword } = await import('./auth.service')
            await expect(changePassword('test@example.com', 'wrongpass', 'newpassword')).rejects.toThrow('Current password is incorrect')
        })

        it('should change password successfully', async () => {
            const mockUser = { id: '1', password: 'hashed', email: 'test@example.com', role: 'admin' }
            mockFindUnique.mockResolvedValue(mockUser)
            mockCompare.mockResolvedValue(true)
            mockHash.mockResolvedValue('new-hashed-password')
            mockUpdate.mockResolvedValue(mockUser)

            const { changePassword } = await import('./auth.service')
            const result = await changePassword('test@example.com', 'oldpass', 'newpassword')

            expect(result).toEqual({ success: true })
            expect(mockHash).toHaveBeenCalledWith('newpassword', 10)
            expect(mockLog).toHaveBeenCalledWith({
                action: 'PASSWORD_CHANGED',
                entityType: 'USER',
                entityId: '1',
                userId: '1',
            })
        })
    })
})
