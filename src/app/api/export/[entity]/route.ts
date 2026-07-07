import { NextRequest } from 'next/server'
import { handleError } from '@/middlewares/errorHandler'
import { toCSV } from '@/lib/csv'

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
    try {
        const { entity } = await params
        const { searchParams } = new URL(request.url)
        const format = searchParams.get('format') || 'csv'

        let headers: string[] = []
        let rows: (string | number | null | undefined)[][] = []

        if (entity === 'clients') {
            const { clientRepo } = await import('@/lib/database/repositories')
            const clients = await clientRepo.findMany({ orderBy: { createdAt: 'desc' } })
            headers = ['id', 'name', 'familyName', 'phone', 'address', 'gender', 'birthDate', 'notes', 'organization', 'createdAt']
            rows = clients.map((c: Record<string, unknown>) => [
                c.id as string, c.name as string, c.familyName as string, c.phone as string, c.address as string | null, c.gender as string | null, c.birthDate as string | null, c.notes as string | null, c.organization as string | null, c.createdAt as string,
            ]) as (string | number | null | undefined)[][]
        } else if (entity === 'fournisseurs') {
            const { fournisseurRepo } = await import('@/lib/database/repositories')
            const items = await fournisseurRepo.findMany({ orderBy: { name: 'asc' } })
            headers = ['id', 'name', 'phone', 'address', 'email', 'taxId', 'createdAt']
            rows = items.map((f: Record<string, unknown>) => [f.id as string, f.name as string, f.phone as string, f.address as string | null, f.email as string | null, f.taxId as string | null, f.createdAt as string]) as (string | number | null | undefined)[][]
        } else if (entity === 'products') {
            const { productRepo } = await import('@/lib/database/repositories')
            const items = await productRepo.findMany({ orderBy: { name: 'asc' } })
            headers = ['id', 'name', 'brand', 'model', 'category', 'price', 'costPrice', 'quantity', 'lensType', 'material', 'coating', 'sph', 'cyl', 'add', 'thickness', 'createdAt']
            rows = items.map((p: Record<string, unknown>) => [
                p.id as string, p.name as string, p.brand as string | null, p.model as string | null, p.category as string | null, p.price as number | null, p.costPrice as number | null, p.quantity as number | null,
                p.lensType as string | null, p.material as string | null, p.coating as string | null, p.sph as string | null, p.cyl as string | null, p.add as string | null, p.thickness as string | null, p.createdAt as string,
            ]) as (string | number | null | undefined)[][]
        } else if (entity === 'orders') {
            const { orderRepo } = await import('@/lib/database/repositories')
            const items = await orderRepo.findMany({
                orderBy: { createdAt: 'desc' },
                include: { client: { select: { name: true, familyName: true } } },
            })
            headers = ['id', 'orderNumber', 'client', 'orderType', 'status', 'totalAmount', 'turnaroundDays', 'createdAt']
            rows = items.map((o: Record<string, unknown>) => {
                const client = o.client as { name: string; familyName: string } | null
                return [
                    o.id as string, o.orderNumber as string, client ? `${client.name} ${client.familyName}` : '',
                    o.orderType as string, o.status as string, o.totalAmount as number | null, o.turnaroundDays as number | null, o.createdAt as string,
                ] as (string | number | null | undefined)[]
            })
        } else {
            return new Response('Unknown entity', { status: 400 })
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
