import { NextRequest } from 'next/server'
import { ok, created } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { userRepo } from '@/lib/database/repositories'
import { hashPassword } from '@/modules/system/auth/auth.service'
import { requireRole } from '@/lib/api/auth'
import { createUserSchema } from './user.schema'

export async function GET(request: NextRequest) {
    try {
        requireRole(['admin'])(request)
        const { page, limit } = parsePagination(request)
        
        const users = await userRepo.findMany({
            orderBy: { createdAt: 'desc' }
        })
        
        const safeUsers = users.map(({ password, updatedAt, ...safeUser }) => safeUser)
        
        return ok(paginated(safeUsers, page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(['admin'])(request)
        
        const { email, name, password, role } = await parseBody(request, createUserSchema)
        
        const existing = await userRepo.findUnique({ where: { email } })
        if (existing) {
            const { BadRequestError } = await import('@/lib/errors')
            throw new BadRequestError('User with this email already exists')
        }
        
        const hashedPassword = await hashPassword(password)
        const newUser = await userRepo.create({
            data: {
                email,
                name: name || null,
                password: hashedPassword,
                role
            }
        })
        
        const { password: _, updatedAt: __, ...safeUser } = newUser
        
        return created(safeUser)
    } catch (error) {
        return handleError(error)
    }
}