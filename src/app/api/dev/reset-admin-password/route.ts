import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { userRepo } from '@/lib/database/repositories'
import { hashPassword } from '@/modules/system/auth/auth.service'
import { ForbiddenError, NotFoundError } from '@/lib/errors'
import { parseBody } from '@/lib/api/parse'
import { z } from 'zod'

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

/**
 * Reset admin password (development only)
 * This is a temporary endpoint for development purposes
 * WARNING: Remove this in production!
 */
export async function POST(request: NextRequest) {
    try {
        if (process.env.NODE_ENV === 'production') {
            throw new ForbiddenError('This endpoint is not available in production')
        }

        const { newPassword } = await parseBody(request, resetPasswordSchema)

        const admin = await userRepo.findFirst()
        if (!admin) {
            throw new NotFoundError('No admin user found')
        }

        const hashedPassword = await hashPassword(newPassword)
        await userRepo.update({
            where: { id: admin.id },
            data: { password: hashedPassword }
        })

        return ok({ 
            message: 'Admin password reset successfully',
            email: admin.email,
        })
    } catch (error) {
        return handleError(error)
    }
}
