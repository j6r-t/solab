import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
    try {
        const existing = await db.user.findFirst()
        if (existing) {
            return NextResponse.json({ error: 'Admin user already exists' }, { status: 400 })
        }

        const hashedPassword = await hashPassword('admin123')

        const user = await db.user.create({
            data: {
                email: 'owner@sofien.tn',
                name: 'Sofien',
                password: hashedPassword,
            },
        })

        return NextResponse.json({
            message: 'Admin user created',
            user: { id: user.id, email: user.email, name: user.name },
            defaultPassword: 'admin123',
        })
    } catch (error) {
        console.error('POST /api/auth/setup error:', error)
        return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
    }
}