import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { userRepo } from '@/lib/database/repositories'
import { JWT_SECRET_FALLBACK } from '@/lib/constants'
import { BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError } from '@/errors'
import { auditService } from '@/modules/audit'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || JWT_SECRET_FALLBACK)

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

    const hashedPassword = await hashPassword('admin123')
    const user = await userRepo.create({
        data: { email: 'owner@sofien.tn', name: 'Sofien', password: hashedPassword },
    })

    await auditService.log({ userId: user.id, action: 'ADMIN_SETUP', entityType: 'USER', entityId: user.id, metadata: { email: user.email } })
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, defaultPassword: 'admin123' }
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
