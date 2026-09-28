import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { userRepo } from '@/lib/database/repositories'
import { JWT_SECRET } from '@/lib/constants'
import { BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { auditService } from '@/modules/system/audit'

// JWT_SECRET must be set in environment variables
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required for authentication')
}

const secret = new TextEncoder().encode(JWT_SECRET)

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

export async function createToken(user: { email: string; role: string }): Promise<string> {
    return new SignJWT({ email: user.email, role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret)
}

export async function verifyToken(token: string): Promise<{ email: string; role: string } | null> {
    try {
        const { payload } = await jwtVerify(token, secret)
        if (!payload.email) return null
        return { email: payload.email as string, role: (payload.role as string) || 'admin' }
    } catch {
        return null
    }
}

export async function authenticateUser(email: string, password: string) {
    if (!email || !password) throw new BadRequestError('Email and password are required')

    const user = await userRepo.findUnique({ where: { email } })
    if (!user || !(await comparePassword(password, user.password))) {
        throw new UnauthorizedError('Invalid email or password')
    }

    const token = await createToken({ email: user.email, role: user.role })
    await auditService.log({ userId: user.id, action: 'USER_LOGIN', entityType: 'USER', entityId: user.id, metadata: { email: user.email } })
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }
}

export async function setupAdmin() {
    const existing = await userRepo.findFirst()
    if (existing) throw new BadRequestError('Admin user already exists')

    // Generate a secure random password
    const defaultPassword = generateSecurePassword()
    const hashedPassword = await hashPassword(defaultPassword)
    const user = await userRepo.create({
        data: { email: 'owner@sofien.tn', name: 'Sofien', password: hashedPassword },
    })

    await auditService.log({ userId: user.id, action: 'ADMIN_SETUP', entityType: 'USER', entityId: user.id, metadata: { email: user.email } })
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, defaultPassword }
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
    const length = 16
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    const randomValues = new Uint32Array(length)
    
    // Use crypto.randomValues for secure random numbers
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randomValues)
    } else {
        // Fallback to Math.random (less secure, but should not happen in Node.js)
        for (let i = 0; i < length; i++) {
            randomValues[i] = Math.floor(Math.random() * 0x100000000)
        }
    }
    
    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length]
    }
    
    return password
}

export async function changePassword(email: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) throw new BadRequestError('Current password and new password are required')
    if (newPassword.length < 6) throw new BadRequestError('New password must be at least 6 characters')

    const user = await userRepo.findUnique({ where: { email } })
    if (!user) throw new NotFoundError('User not found')

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) throw new ForbiddenError('Current password is incorrect')

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await userRepo.update({ where: { email }, data: { password: hashedPassword } })
    await auditService.log({ userId: user.id, action: 'PASSWORD_CHANGED', entityType: 'USER', entityId: user.id })
    return { success: true }
}

export async function updateProfile(currentEmail: string, data: { name?: string | null; email?: string }) {
    const user = await userRepo.findUnique({ where: { email: currentEmail } })
    if (!user) throw new NotFoundError('User not found')

    const updateData: { name?: string | null; email?: string } = {}
    if (data.name !== undefined) updateData.name = data.name

    if (data.email !== undefined && data.email.toLowerCase() !== user.email.toLowerCase()) {
        const newEmail = data.email
        const existing = await userRepo.findMany()
        if (existing.some((u) => u.id !== user.id && u.email.toLowerCase() === newEmail.toLowerCase())) {
            throw new BadRequestError('Email already taken')
        }
        updateData.email = newEmail
    }

    const updated = await userRepo.update({ where: { id: user.id }, data: updateData })
    await auditService.log({ userId: updated.id, action: 'PROFILE_UPDATED', entityType: 'USER', entityId: updated.id, metadata: { fields: Object.keys(updateData) } })
    const token = await createToken({ email: updated.email, role: updated.role })
    return { user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role }, token }
}
