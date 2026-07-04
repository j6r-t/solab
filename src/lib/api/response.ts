import { NextResponse } from 'next/server'

export function ok<T>(data: T) {
    return NextResponse.json(data)
}

export function created<T>(data: T) {
    return NextResponse.json(data, { status: 201 })
}

export function noContent() {
    return NextResponse.json({ success: true })
}
