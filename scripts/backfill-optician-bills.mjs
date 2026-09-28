/**
 * Sofien Optic — backfill missing optician-shop bills
 *
 * Run manually (owner approval):  node scripts/backfill-optician-bills.mjs
 *
 * Idempotent: work orders that already have a bill are skipped, so the script
 * can be re-run safely at any time. Cancelled work orders are skipped too.
 *
 * For every AtelierWorkOrder tied to an optician shop that has no bill yet,
 * creates an OpticianShopBill (number FAC-{SHOPABBR}-{seq3}, same prefix as
 * bill creation; the sequence scans ALL bills because billNumber is globally
 * unique) whose items are the work order's services at their recorded price.
 * total = sum of items; paidAmount/status are seeded from payments already
 * recorded on the work order (capped at the total) so money collected before
 * bills existed is not lost. A repair pass also seeds bills created by the
 * old backfill (which hardcoded paidAmount 0) as long as no payment was ever
 * recorded on them. No payment, price or stock change is ever made.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function shopAbbreviation(name) {
    return (
        name
            .split(' ')
            .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase())
            .filter(Boolean)
            .join('')
            .slice(0, 4) || 'SUP'
    )
}

async function nextBillNumber(tx, shopId, shopName) {
    const abbr = shopAbbreviation(shopName)
    // billNumber is globally unique — scan ALL bills so two shops sharing an
    // abbreviation can never generate the same number
    const existing = await tx.opticianShopBill.findMany({
        select: { billNumber: true },
    })
    let maxSeq = 0
    const prefix = `FAC-${abbr}-`
    for (const b of existing) {
        if (b.billNumber.startsWith(prefix)) {
            const num = parseInt(b.billNumber.slice(prefix.length), 10)
            if (!isNaN(num) && num > maxSeq) maxSeq = num
        }
    }
    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
}

async function main() {
    console.log('🔍 Scanning optician work orders without a bill...')

    const workOrders = await prisma.atelierWorkOrder.findMany({
        where: { opticianShopId: { not: null }, status: { not: 'cancelled' } },
        include: {
            bill: true,
            opticianShop: { select: { id: true, name: true } },
            workOrderServices: { include: { repairService: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'asc' },
    })

    const missing = workOrders.filter((wo) => !wo.bill && wo.opticianShop)
    console.log(`Found ${workOrders.length} optician work order(s), ${missing.length} without a bill.`)

    let created = 0
    let skippedNoServices = 0

    for (const wo of missing) {
        if (!wo.workOrderServices.length) {
            skippedNoServices++
            console.log(`⚠️  Skipping WO ${wo.id} — no services recorded, nothing to invoice.`)
            continue
        }

        const items = wo.workOrderServices.map((s) => ({
            description: s.repairService?.name || 'Service',
            quantity: 1,
            unitPrice: s.price,
            itemType: 'service',
        }))
        const totalAmount = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0)
        // Seed from work-order history: money already collected on the WO
        const paidAmount = Math.min(Number(wo.amountPaid || 0), totalAmount)
        const status = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partiallyPaid' : 'unpaid'

        const billNumber = await nextBillNumber(prisma, wo.opticianShopId, wo.opticianShop.name)

        await prisma.$transaction(async (tx) => {
            await tx.opticianShopBill.create({
                data: {
                    billNumber,
                    opticianShopId: wo.opticianShopId,
                    workOrderId: wo.id,
                    totalAmount,
                    paidAmount,
                    status,
                    items: { create: items },
                },
            })
        })

        created++
        const paidNote = paidAmount > 0 ? ` (already paid ${paidAmount.toFixed(3)} TND on work order)` : ''
        console.log(`✅ Created bill ${billNumber} for WO ${wo.id} (${totalAmount.toFixed(3)} TND)${paidNote}`)
    }

    console.log('\n🔍 Repairing bills created by the old backfill (paidAmount was hardcoded to 0)...')

    // Old runs seeded every bill with paidAmount 0 / unpaid, losing money the
    // work order had already collected. Only untouched bills are repaired:
    // zero payments and still unpaid — any bill with payments is already
    // governed by its payment ledger and is left alone.
    const staleBills = await prisma.opticianShopBill.findMany({
        where: { paidAmount: 0, status: 'unpaid', workOrderId: { not: null }, payments: { none: {} } },
        select: {
            id: true,
            billNumber: true,
            totalAmount: true,
            workOrder: { select: { amountPaid: true } },
        },
    })

    let repaired = 0
    for (const bill of staleBills) {
        const paidAmount = Math.min(Number(bill.workOrder?.amountPaid || 0), Number(bill.totalAmount))
        if (paidAmount <= 0) continue
        const status = paidAmount >= Number(bill.totalAmount) ? 'paid' : 'partiallyPaid'
        await prisma.$transaction(async (tx) => {
            await tx.opticianShopBill.update({ where: { id: bill.id }, data: { paidAmount, status } })
            const paymentStatus = status === 'paid' ? 'paid' : 'partial'
            await tx.atelierWorkOrder.update({ where: { id: bill.workOrderId }, data: { amountPaid: paidAmount, paymentStatus } })
        })
        repaired++
        console.log(`🔧 Repaired bill ${bill.billNumber} — seeded ${paidAmount.toFixed(3)} TND from work order`)
    }

    console.log('\n──────────────────────────────')
    console.log(`Work orders scanned:    ${workOrders.length}`)
    console.log(`Bills created:          ${created}`)
    if (skippedNoServices) console.log(`Skipped (no services):  ${skippedNoServices}`)
    console.log(`Bills repaired:         ${repaired}`)
    console.log('Done.')
}

main()
    .catch((e) => {
        console.error('❌ Backfill failed:', e)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
