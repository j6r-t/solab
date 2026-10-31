import { NextRequest } from 'next/server'
import { handleError } from '@/lib/middlewares/errorHandler'
import { requireRole } from '@/lib/api/auth'
import { BadRequestError } from '@/lib/errors'
import { toCSV } from '@/lib/csv'

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
    try {
        const { entity } = await params

        if (entity === 'fournisseurs') {
            requireRole(['admin', 'shop', 'atelier'])(request)
        } else {
            requireRole(['admin', 'shop'])(request)
        }

        let headers: string[] = []
        let rows: (string | number | null | undefined)[][] = []

        if (entity === 'clients') {
            const { clientRepo } = await import('@/lib/database/repositories')
            const clients = await clientRepo.findMany({ orderBy: { createdAt: 'desc' } })
            headers = ['name', 'familyName', 'phone', 'address', 'gender', 'birthDate', 'notes', 'organization']
            rows = clients.map((c: Record<string, unknown>) => [
                c.name as string, c.familyName as string, c.phone as string, c.address as string | null, c.gender as string | null, c.birthDate as string | null, c.notes as string | null, c.organization as string | null,
            ]) as (string | number | null | undefined)[][]
        } else if (entity === 'fournisseurs') {
            const { fournisseurRepo } = await import('@/lib/database/repositories')
            const items = await fournisseurRepo.findMany({ orderBy: { name: 'asc' } })
            headers = ['name', 'phone', 'address', 'email', 'taxId']
            rows = items.map((f: Record<string, unknown>) => [f.name as string, f.phone as string, f.address as string | null, f.email as string | null, f.taxId as string | null]) as (string | number | null | undefined)[][]
        } else if (entity === 'products') {
            const { productRepo } = await import('@/lib/database/repositories')
            const items = await productRepo.findMany({ orderBy: { name: 'asc' } })
            headers = ['name', 'brand', 'model', 'category', 'price', 'priceAfterTax', 'costPrice', 'quantity', 'lensType', 'material', 'coating', 'sph', 'cyl', 'add', 'thickness']
            rows = items.map((p: Record<string, unknown>) => [
                p.name as string, p.brand as string | null, p.model as string | null, p.category as string | null, p.price as number | null, p.priceAfterTax as number | null, p.costPrice as number | null, p.quantity as number | null,
                p.lensType as string | null, p.material as string | null, p.coating as string | null, p.sph as string | null, p.cyl as string | null, p.add as string | null, p.thickness as string | null,
            ]) as (string | number | null | undefined)[][]
        } else if (entity === 'orders') {
            const { orderRepo } = await import('@/lib/database/repositories')
            const items = await orderRepo.findMany({
                orderBy: { createdAt: 'desc' },
                include: { client: { select: { name: true, familyName: true } } },
            })
            headers = ['orderNumber', 'client', 'orderType', 'status', 'totalAmount', 'turnaroundDays']
            rows = items.map((o: Record<string, unknown>) => {
                const client = o.client as { name: string; familyName: string } | null
                return [
                    o.orderNumber as string, client ? `${client.name} ${client.familyName}` : '',
                    o.orderType as string, o.status as string, o.totalAmount as number | null, o.turnaroundDays as number | null,
                ] as (string | number | null | undefined)[]
            })
        } else {
            throw new BadRequestError('Unknown entity')
        }

        const csv = toCSV(headers, rows)
        const filename = `${entity}_${new Date().toISOString().split('T')[0]}.csv`

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (error) {
        return handleError(error)
    }
}
