import { NextRequest } from 'next/server'
import { ok, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { userRepo } from '@/lib/database/repositories'
import { hashPassword } from '@/modules/system/auth/auth.service'
import { NotFoundError } from '@/lib/errors'
import { requireRole, getAuthenticatedUserWithRole } from '@/lib/api/auth'
import { updateUserSchema } from '../user.schema'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(['admin'])(request)
        
        const { id } = await params
        const user = await userRepo.findUnique({ where: { id } })
        
        if (!user) {
            throw new NotFoundError('User not found')
        }
        
        const { password, updatedAt, ...safeUser } = user
        return ok(safeUser)
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(['admin'])(request)
        
        const { id } = await params
        const body = await parseBody(request, updateUserSchema)
        
        const existing = await userRepo.findUnique({ where: { id } })
        if (!existing) {
            throw new NotFoundError('User not found')
        }
        
        const updateData: Record<string, unknown> = {}
        if (body.name !== undefined) updateData.name = body.name
        if (body.role !== undefined) updateData.role = body.role
        if (body.password) {
            updateData.password = await hashPassword(body.password)
        }
        
        const updatedUser = await userRepo.update({
            where: { id },
            data: updateData,
        })
        
        const { password: _, updatedAt: __, ...safeUser } = updatedUser
        return ok(safeUser)
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(['admin'])(request)
        const { id } = await params
        
        const currentUser = getAuthenticatedUserWithRole(request)
        const targetUser = await userRepo.findUnique({ where: { id } })
        if (!targetUser) {
            throw new NotFoundError('User not found')
        }
        if (targetUser.email === currentUser.email) {
            const { BadRequestError } = await import('@/lib/errors')
            throw new BadRequestError('Cannot delete your own account')
        }
        
        await userRepo.delete({ where: { id } })
        
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}