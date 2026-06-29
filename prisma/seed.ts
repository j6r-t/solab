import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
})
async function seed() {
    console.log('🌱 Seeding Sofien Optic database...\n')

    // ─── 1. Admin User ───
    const existingUser = await prisma.user.findUnique({ where: { email: 'sofien@optic.tn' } })
    if (!existingUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10)
        await prisma.user.create({
            data: { email: 'sofien@optic.tn', name: 'Sofien', password: hashedPassword },
        })
        console.log('✅ Admin user created: sofien@optic.tn / admin123')
    } else {
        console.log('⏭️  Admin user already exists, skipping.')
    }

    // ─── 2. Clients ───
    const clientsData = [
        { name: 'Ahmed', familyName: 'Ben Ali', phone: '55123456', gender: 'male' as const, address: '12 Rue Habib Bourguiba, Tunis' },
        { name: 'Fatma', familyName: 'Trabelsi', phone: '52987654', gender: 'female' as const, address: '5 Av. Farhat Hached, Sfax' },
        { name: 'Mohamed', familyName: 'Jendoubi', phone: '96345678', gender: 'male' as const, address: '8 Rue de la Liberté, Sousse' },
        { name: 'Amira', familyName: 'Bouazizi', phone: '22456789', gender: 'female' as const, address: '3 Place Pasteur, Monastir' },
        { name: 'Youssef', familyName: 'Hamdi', phone: '90345612', gender: 'male' as const, address: '15 Blvd. 9 Avril, Tunis' },
        { name: 'Rim', familyName: 'Kallel', phone: '53876543', gender: 'female' as const, address: '7 Rue Ibn Khaldoun, Nabeul' },
    ]

    const clients = []
    for (const c of clientsData) {
        const existing = await prisma.client.findUnique({ where: { phone: c.phone } })
        if (!existing) {
            const client = await prisma.client.create({ data: c })
            clients.push(client)
            console.log(`✅ Client: ${c.name} ${c.familyName}`)
        } else {
            clients.push(existing)
            console.log(`⏭️  Client ${c.name} ${c.familyName} already exists`)
        }
    }

    // ─── 3. Products + QR Codes ───
    const productsData = [
        { name: 'Ray-Ban Aviator', brand: 'Ray-Ban', model: 'RB3025', category: 'eyewear' as const, price: 280, quantity: 8 },
        { name: 'Oakley Holbrook', brand: 'Oakley', model: 'OO9102', category: 'eyewear' as const, price: 350, quantity: 3 },
        { name: 'Tom Ford FT5401', brand: 'Tom Ford', model: 'FT5401', category: 'eyewear' as const, price: 520, quantity: 2 },
        { name: 'Persol PO3092V', brand: 'Persol', model: 'PO3092V', category: 'eyewear' as const, price: 310, quantity: 0 },
        { name: 'Verres Progressifs', brand: 'Essilor', model: 'Varilux Comfort 2', category: 'lens' as const, price: 180, quantity: 15 },
        { name: 'Verres Simples Anti-Reflet', brand: 'Essilor', model: 'Crizal Easy Pro', category: 'lens' as const, price: 120, quantity: 20 },
        { name: 'Verres Solaires Polarisés', brand: 'Zeiss', model: 'Polarized Pro', category: 'lens' as const, price: 200, quantity: 1 },
        { name: 'Étui Cuir Luxe', brand: 'Local', model: 'CL-100', category: 'accessory' as const, price: 35, quantity: 25 },
        { name: 'Chiffon Microfibre', brand: 'Local', model: 'CM-50', category: 'accessory' as const, price: 8, quantity: 50 },
        { name: 'Chaîne Lunettes', brand: 'Local', model: 'CH-200', category: 'accessory' as const, price: 15, quantity: 12 },
        { name: 'Ray-Ban Wayfarer', brand: 'Ray-Ban', model: 'RB2140', category: 'eyewear' as const, price: 260, quantity: 5 },
        { name: 'Verres Toriques', brand: 'Hoya', model: 'Hoyalux iD', category: 'lens' as const, price: 220, quantity: 7 },
    ]

    const products: Array<{ id: string; qrcode?: { code: string } | null }> = []
    const qrCounter = Date.now()
    for (const p of productsData) {
        const existing = await prisma.product.findFirst({ where: { name: p.name, brand: p.brand } })
        if (!existing) {
            const product = await prisma.product.create({
                data: {
                    ...p,
                    qrcode: {
                        create: {
                            code: `SOPT-${qrCounter}-${String(Math.floor(Math.random() * 900) + 100)}`,
                        },
                    },
                },
                include: { qrcode: true },
            })
            products.push(product)
            console.log(`✅ Product: ${p.name} (QR: ${product.qrcode?.code})`)
        } else {
            const withQr = await prisma.product.findFirst({
                where: { id: existing.id },
                include: { qrcode: true },
            })
            products.push(withQr!)
            console.log(`⏭️  Product ${p.name} already exists`)
        }
    }

    // ─── 4. Prescriptions ───
    const prescriptionsData = [
        {
            clientId: clients[0].id, // Ahmed
            sphRight: -2.25, cylRight: -0.75, axisRight: 180, addRight: 0, pdRight: 32,
            sphLeft: -1.75, cylLeft: -0.50, axisLeft: 175, addLeft: 0, pdLeft: 32,
            doctorName: 'Dr. Mansour',
        },
        {
            clientId: clients[1].id, // Fatma
            sphRight: 1.50, cylRight: -1.25, axisRight: 90, addRight: 2.00, pdRight: 30,
            sphLeft: 1.75, cylLeft: -1.00, axisLeft: 85, addLeft: 2.00, pdLeft: 30,
            doctorName: 'Dr. Ben Jannet',
        },
        {
            clientId: clients[2].id, // Mohamed
            sphRight: -3.00, cylRight: -1.50, axisRight: 10, addRight: 0, pdRight: 33,
            sphLeft: -2.50, cylLeft: -1.25, axisLeft: 5, addLeft: 0, pdLeft: 33,
            doctorName: 'Dr. Mansour',
        },
        {
            clientId: clients[1].id, // Fatma (2nd prescription)
            sphRight: 2.00, cylRight: -0.50, axisRight: 80, addRight: 2.25, pdRight: 30,
            sphLeft: 2.25, cylLeft: -0.75, axisLeft: 95, addLeft: 2.25, pdLeft: 30,
            doctorName: 'Dr. Boukadida',
        },
    ]

    for (const rx of prescriptionsData) {
        const existing = await prisma.prescription.findFirst({
            where: { clientId: rx.clientId, doctorName: rx.doctorName, sphRight: rx.sphRight },
        })
        if (!existing) {
            await prisma.prescription.create({ data: rx })
            console.log(`✅ Prescription for ${clients.find(c => c.id === rx.clientId)?.name}`)
        } else {
            console.log(`⏭️  Prescription already exists`)
        }
    }

    // ─── 5. Orders + Items + Payments ───
    const ordersData = [
        {
            clientIdx: 0, // Ahmed
            orderNumber: 1001,
            totalAmount: 460,
            orderType: 'standard' as const,
            status: 'completed' as const,
            items: [
                { productIdx: 0, quantity: 1, unitPrice: 280 }, // Ray-Ban Aviator
                { productIdx: 4, quantity: 1, unitPrice: 180 }, // Verres Progressifs
            ],
            payments: [
                { amount: 230, type: 'deposit' as const },
                { amount: 230, type: 'balance' as const },
            ],
            repairs: [],
        },
        {
            clientIdx: 1, // Fatma
            orderNumber: 1002,
            totalAmount: 520,
            orderType: 'standard' as const,
            status: 'completed' as const,
            items: [
                { productIdx: 2, quantity: 1, unitPrice: 520 }, // Tom Ford
            ],
            payments: [
                { amount: 520, type: 'full' as const },
            ],
            repairs: [],
        },
        {
            clientIdx: 2, // Mohamed
            orderNumber: 1003,
            totalAmount: 530,
            orderType: 'standard' as const,
            status: 'pending' as const,
            items: [
                { productIdx: 1, quantity: 1, unitPrice: 350 }, // Oakley
                { productIdx: 11, quantity: 1, unitPrice: 180 }, // Verres Toriques
            ],
            payments: [
                { amount: 200, type: 'deposit' as const },
            ],
            repairs: [],
        },
        {
            clientIdx: 3, // Amira
            orderNumber: 1004,
            totalAmount: 350,
            orderType: 'remounting' as const,
            status: 'pending' as const,
            items: [
                { productIdx: 5, quantity: 1, unitPrice: 120 }, // Verres Simples
            ],
            payments: [
                { amount: 100, type: 'deposit' as const },
            ],
            repairs: [
                { type: 'Remontage verres', status: 'pending' as const, expectedCompletionDate: new Date(Date.now() + 3 * 86400000), repairServiceName: 'Remontage', price: 130 },
            ],
        },
        {
            clientIdx: 4, // Youssef
            orderNumber: 1005,
            totalAmount: 800,
            orderType: 'standard' as const,
            status: 'completed' as const,
            items: [
                { productIdx: 10, quantity: 1, unitPrice: 260 }, // Ray-Ban Wayfarer
                { productIdx: 6, quantity: 1, unitPrice: 200 }, // Verres Solaires
                { productIdx: 7, quantity: 1, unitPrice: 35 },  // Étui
                { productIdx: 9, quantity: 1, unitPrice: 15 },  // Chaîne
                { productIdx: 8, quantity: 2, unitPrice: 8 },   // Chiffon x2
            ],
            payments: [
                { amount: 400, type: 'deposit' as const },
                { amount: 400, type: 'balance' as const },
            ],
            repairs: [],
        },
        {
            clientIdx: 5, // Rim
            orderNumber: 1006,
            totalAmount: 395,
            orderType: 'standard' as const,
            status: 'pending' as const,
            items: [
                { productIdx: 3, quantity: 1, unitPrice: 310 }, // Persol
                { productIdx: 5, quantity: 1, unitPrice: 85 },  // Verres Simples (discounted)
            ],
            payments: [],
            repairs: [],
        },
    ]

    for (const orderData of ordersData) {
        const existing = await prisma.order.findFirst({ where: { orderNumber: orderData.orderNumber } })
        if (existing) {
            console.log(`⏭️  Order #${orderData.orderNumber} already exists`)
            continue
        }

        const client = clients[orderData.clientIdx]

        // Create repair services first if needed
        const repairServiceIds: string[] = []
        for (const repair of orderData.repairs) {
            let service = await prisma.repairService.findFirst({ where: { name: repair.repairServiceName } })
            if (!service) {
                service = await prisma.repairService.create({
                    data: { name: repair.repairServiceName, defaultPrice: repair.price },
                })
                console.log(`  ✅ Repair service: ${repair.repairServiceName}`)
            }
            repairServiceIds.push(service.id)
        }

        const order = await prisma.order.create({
            data: {
                orderNumber: orderData.orderNumber,
                clientId: client.id,
                totalAmount: orderData.totalAmount,
                orderType: orderData.orderType,
                status: orderData.status,
                items: {
                    create: orderData.items.map((item) => ({
                        productId: products[item.productIdx].id,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                },
                payments: {
                    create: orderData.payments,
                },
                repairs: {
                    create: orderData.repairs.map((repair, idx) => ({
                        type: repair.type,
                        status: repair.status,
                        expectedCompletionDate: repair.expectedCompletionDate,
                        repairServiceId: repairServiceIds[idx],
                        price: repair.price,
                    })),
                },
            },
        })

        const paid = orderData.payments.reduce((s, p) => s + p.amount, 0)
        console.log(`✅ Order #${orderData.orderNumber} — ${client.name} ${client.familyName} — ${paid}/${orderData.totalAmount} TND`)
    }

    // ─── 6. Stock Adjustments (a couple of examples) ───
    const adjustments = [
        { productId: products[0]?.id, quantity: 5, reason: 'restock' as const },
        { productId: products[6]?.id, quantity: -1, reason: 'damage' as const },
    ]
    for (const adj of adjustments) {
        if (!adj.productId) continue
        await prisma.stockAdjustment.create({ data: adj })
        if (adj.reason === 'restock') {
            await prisma.product.update({ where: { id: adj.productId }, data: { quantity: { increment: adj.quantity } } })
        } else {
            await prisma.product.update({ where: { id: adj.productId }, data: { quantity: { increment: adj.quantity } } })
        }
        console.log(`✅ Stock adjustment: ${adj.reason} ${Math.abs(adj.quantity)} for product ${adj.productId.slice(0, 8)}`)
    }

    console.log('\n🎉 Seed complete! Database is populated with sample data.')
    console.log('   Login: sofien@optic.tn / admin123')
}

seed()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())