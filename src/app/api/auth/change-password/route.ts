import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.slice(7)
        const email = await verifyToken(token)
        if (!email) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { currentPassword, newPassword } = await request.json()
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
        }

        const user = await db.user.findUnique({ where: { email } })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const valid = await bcrypt.compare(currentPassword, user.password)
        if (!valid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await db.user.update({ where: { email }, data: { password: hashedPassword } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('POST /api/auth/change-password error:', error)
        return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
    }
}
