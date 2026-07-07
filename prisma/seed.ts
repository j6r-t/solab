import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })

async function seed() {
    console.log('🌱 Seeding Sofien Optic database...\n')

    // ─── 1. Users (admin, shop, atelier) ──────────────────────────
    const usersInput = [
        { email: 'sofien@optic.tn', name: 'Sofien', password: 'admin123', role: 'admin' as const },
        { email: 'shop@sofien.tn', name: 'Kaouther', password: '123456', role: 'shop' as const },
        { email: 'atelier@sofien.tn', name: 'Mehdi', password: '123456', role: 'atelier' as const },
    ]
    for (const u of usersInput) {
        const existing = await prisma.user.findUnique({ where: { email: u.email } })
        if (!existing) {
            const hashed = await bcrypt.hash(u.password, 10)
            await prisma.user.create({ data: { email: u.email, name: u.name, password: hashed, role: u.role } })
            console.log(`✅ User: ${u.email} / ${u.password} [${u.role}]`)
        } else {
            console.log(`⏭️  User ${u.email} exists`)
        }
    }

    // ─── 2. Clients (12 clients) ────────────────────────────────────
    const clientsInput = [
        { name: 'Ahmed', familyName: 'Ben Ali', phone: '55123456', gender: 'male' as const, address: '12 Rue Habib Bourguiba, Tunis' },
        { name: 'Fatma', familyName: 'Trabelsi', phone: '52987654', gender: 'female' as const, address: '5 Av. Farhat Hached, Sfax' },
        { name: 'Mohamed', familyName: 'Jendoubi', phone: '96345678', gender: 'male' as const, address: '8 Rue de la Liberté, Sousse' },
        { name: 'Amira', familyName: 'Bouazizi', phone: '22456789', gender: 'female' as const, address: '3 Place Pasteur, Monastir' },
        { name: 'Youssef', familyName: 'Hamdi', phone: '90345612', gender: 'male' as const, address: '15 Blvd. 9 Avril, Tunis' },
        { name: 'Rim', familyName: 'Kallel', phone: '53876543', gender: 'female' as const, address: '7 Rue Ibn Khaldoun, Nabeul' },
        { name: 'Karim', familyName: 'Mabrouk', phone: '20123456', gender: 'male' as const, address: '22 Rue Mongi Slim, La Marsa' },
        { name: 'Salma', familyName: 'Ben Salah', phone: '22123478', gender: 'female' as const, address: '14 Av. Hédi Nouira, Bizerte' },
        { name: 'Nader', familyName: 'Gharbi', phone: '50223344', gender: 'male' as const, address: '9 Rue Tahar Haddad, Gabès' },
        { name: 'Monia', familyName: 'Laabidi', phone: '28556677', gender: 'female' as const, address: '6 Rue 2 Mars, Kairouan' },
        { name: 'Hichem', familyName: 'Ben Abdallah', phone: '94456789', gender: 'male' as const, address: '11 Rue des Jasmins, Hammamet' },
        { name: 'Noura', familyName: 'Slimane', phone: '21112233', gender: 'female' as const, address: '18 Rue de la Paix, Gafsa' },
    ]

    const clients: Array<{ id: string; name: string; familyName: string }> = []
    for (const c of clientsInput) {
        const existing = await prisma.client.findUnique({ where: { phone: c.phone } })
        if (!existing) {
            const client = await prisma.client.create({ data: c })
            clients.push(client)
            console.log(`✅ Client: ${c.name} ${c.familyName}`)
        } else {
            clients.push(existing)
        }
    }

    // ─── 3. Fournisseurs (6 suppliers: 4 shop + 2 atelier) ─────────
    const fournisseursInput = [
        { name: 'Optique Distribution Tunis', phone: '71234567', address: 'Zone Industrielle Charguia I, Tunis', entity: 'shop' },
        { name: 'EuroLens Méditerranée', phone: '73345678', address: 'Route de la Plage, Sousse', entity: 'shop' },
        { name: 'Essilor Tunisie', phone: '71987654', address: 'Immeuble Le Palace, Rue du Lac, Tunis', entity: 'atelier' },
        { name: 'Accessoires Optiques Sfax', phone: '74234567', address: 'Av. Habib Bourguiba, Sfax', entity: 'shop' },
        { name: 'Verres Haute Précision', phone: '75123456', address: 'Zone Industrielle Sidi Bou Said, Tunis', entity: 'atelier' },
        { name: 'Matériel Optique Bizerte', phone: '72456789', address: 'Rue 14 Janvier, Bizerte', entity: 'atelier' },
    ]

    const fournisseurs: Array<{ id: string; name: string }> = []
    for (const f of fournisseursInput) {
        const existing = await prisma.fournisseur.findFirst({ where: { phone: f.phone } })
        if (!existing) {
            const { entity, ...rest } = f
            const created = await prisma.fournisseur.create({ data: { ...rest, entity } })
            fournisseurs.push(created)
            console.log(`✅ Fournisseur: ${f.name} (${f.entity})`)
        } else {
            // Update entity on existing supplier to match current config
            const { entity, ...rest } = f
            await prisma.fournisseur.update({ where: { id: existing.id }, data: { entity } })
            fournisseurs.push(existing)
        }
    }

    // ─── 4. Doctors (5 doctors) ─────────────────────────────────────
    const doctorsInput = [
        { name: 'Dr. Mohamed Mansour', phone: '98123456', address: 'Polyclinique Taoufik, Tunis', specialization: 'Ophtalmologiste' },
        { name: 'Dr. Salma Ben Jannet', phone: '98234567', address: 'Centre Médical El Menzah, Tunis', specialization: 'Ophtalmologiste' },
        { name: 'Dr. Khaled Boukadida', phone: '98345678', address: 'Clinique les Oliviers, Sousse', specialization: 'Ophtalmologiste pédiatrique' },
        { name: 'Dr. Ines Mhiri', phone: '98456789', address: 'Cabinet Médical Lafayette, Tunis', specialization: 'Orthoptiste' },
        { name: 'Dr. Fathi Mezni', phone: '98567890', address: 'Hôpital Militaire, Tunis', specialization: 'Ophtalmologiste - Rétine' },
    ]

    const doctors: Array<{ id: string; name: string }> = []
    for (const d of doctorsInput) {
        const existing = await prisma.doctor.findFirst({ where: { phone: d.phone } })
        if (!existing) {
            const created = await prisma.doctor.create({ data: d })
            doctors.push(created)
            console.log(`✅ Doctor: ${d.name}`)
        } else {
            doctors.push(existing)
        }
    }

    // ─── 5. Products (20 products) ──────────────────────────────────
    const productsInput = [
        { name: 'Ray-Ban Aviator', brand: 'Ray-Ban', model: 'RB3025', category: 'lunette' as const, price: 280, costPrice: 160, quantity: 8, fournisseurIdx: 0 },
        { name: 'Ray-Ban Wayfarer', brand: 'Ray-Ban', model: 'RB2140', category: 'lunette' as const, price: 260, costPrice: 145, quantity: 5, fournisseurIdx: 0 },
        { name: 'Oakley Holbrook', brand: 'Oakley', model: 'OO9102', category: 'lunette' as const, price: 350, costPrice: 210, quantity: 3, fournisseurIdx: 0 },
        { name: 'Tom Ford FT5401', brand: 'Tom Ford', model: 'FT5401', category: 'lunette' as const, price: 520, costPrice: 310, quantity: 2, fournisseurIdx: 0 },
        { name: 'Persol PO3092V', brand: 'Persol', model: 'PO3092V', category: 'lunette' as const, price: 310, costPrice: 185, quantity: 4, fournisseurIdx: 0 },
        { name: 'Vogue VO2720', brand: 'Vogue', model: 'VO2720', category: 'lunette' as const, price: 190, costPrice: 100, quantity: 7, fournisseurIdx: 0 },
        { name: 'Biofinity Monthly', brand: 'CooperVision', model: 'Biofinity', category: 'lentille' as const, price: 85, costPrice: 45, quantity: 30, lensType: 'singleVision' as const, material: 'cr39' as const, coating: 'none' as const, fournisseurIdx: 1 },
        { name: 'Dailies Total 1', brand: 'Alcon', model: 'Dailies Total1', category: 'lentille' as const, price: 120, costPrice: 70, quantity: 20, lensType: 'singleVision' as const, material: 'cr39' as const, coating: 'none' as const, fournisseurIdx: 1 },
        { name: 'Air Optix HydraGlyde', brand: 'Alcon', model: 'Air Optix', category: 'lentille' as const, price: 95, costPrice: 55, quantity: 25, lensType: 'singleVision' as const, material: 'cr39' as const, coating: 'none' as const, fournisseurIdx: 1 },
        { name: 'Acuvue Oasys', brand: 'Johnson & Johnson', model: 'Acuvue Oasys', category: 'lentille' as const, price: 110, costPrice: 60, quantity: 15, lensType: 'singleVision' as const, material: 'polycarbonate' as const, coating: 'blueBlock' as const, fournisseurIdx: 1 },
        { name: 'Varilux Comfort 2', brand: 'Essilor', model: 'Varilux Comfort', category: 'verre' as const, price: 280, costPrice: 150, quantity: 10, thickness: '2.0', lensType: 'progressive' as const, material: 'highIndex' as const, coating: 'arScratch' as const, sph: -2.00, cyl: -0.75, add: 2.50, fournisseurIdx: 2 },
        { name: 'Crizal Easy Pro', brand: 'Essilor', model: 'Crizal Pro', category: 'verre' as const, price: 180, costPrice: 90, quantity: 15, thickness: '1.5', lensType: 'singleVision' as const, material: 'cr39' as const, coating: 'ar' as const, sph: -1.50, fournisseurIdx: 2 },
        { name: 'Stellify FreeForm', brand: 'Essilor', model: 'Stellify', category: 'verre' as const, price: 340, costPrice: 200, quantity: 5, thickness: '1.67', lensType: 'progressive' as const, material: 'highIndex' as const, coating: 'arBlueBlock' as const, sph: -3.00, cyl: -1.00, add: 2.75, fournisseurIdx: 2 },
        { name: 'Hoyalux iD', brand: 'Hoya', model: 'Hoyalux iD MyStyle', category: 'verre' as const, price: 310, costPrice: 175, quantity: 7, thickness: '1.6', lensType: 'progressive' as const, material: 'highIndex' as const, coating: 'arScratch' as const, sph: -0.75, cyl: -0.50, add: 2.25, fournisseurIdx: 2 },
        { name: 'Zeiss PhotoFusion', brand: 'Zeiss', model: 'PhotoFusion X', category: 'verre' as const, price: 260, costPrice: 140, quantity: 6, thickness: '1.5', lensType: 'photochromic' as const, material: 'polycarbonate' as const, coating: 'scratchResistant' as const, sph: 0.00, fournisseurIdx: 2 },
        { name: 'Essilor Anti-Fatigue', brand: 'Essilor', model: 'Essilor Anti-Fatigue', category: 'verre' as const, price: 220, costPrice: 120, quantity: 8, thickness: '1.5', lensType: 'office' as const, material: 'cr39' as const, coating: 'blueBlock' as const, sph: 0.75, add: 0.85, fournisseurIdx: 2 },
        { name: 'Varilux X Series', brand: 'Essilor', model: 'Varilux X', category: 'verre' as const, price: 420, costPrice: 260, quantity: 4, thickness: '1.74', lensType: 'progressive' as const, material: 'highIndex' as const, coating: 'arBlueBlock' as const, sph: -5.00, cyl: -1.50, add: 3.00, fournisseurIdx: 2 },
        { name: 'Crizal Single Vision 1.5', brand: 'Essilor', model: 'Crizal SV', category: 'verre' as const, price: 140, costPrice: 70, quantity: 20, thickness: '1.5', lensType: 'singleVision' as const, material: 'cr39' as const, coating: 'ar' as const, sph: -4.00, cyl: -2.00, fournisseurIdx: 2 },
        { name: 'Hoya Nulux EP', brand: 'Hoya', model: 'Nulux EP', category: 'verre' as const, price: 360, costPrice: 210, quantity: 3, thickness: '1.7', lensType: 'progressive' as const, material: 'highIndex' as const, coating: 'arScratch' as const, sph: -6.00, cyl: -1.25, add: 2.50, fournisseurIdx: 2 },
        { name: 'Zeiss SmartLife', brand: 'Zeiss', model: 'SmartLife', category: 'verre' as const, price: 380, costPrice: 230, quantity: 4, thickness: '1.6', lensType: 'bifocal' as const, material: 'polycarbonate' as const, coating: 'arBlueBlock' as const, sph: 1.50, add: 2.00, fournisseurIdx: 2 },
        { name: 'Étui Cuir Luxe', brand: 'Local', model: 'CL-100', category: 'accessory' as const, price: 35, costPrice: 12, quantity: 25, fournisseurIdx: 3 },
        { name: 'Chiffon Microfibre Lot 3', brand: 'Local', model: 'CM-50', category: 'accessory' as const, price: 12, costPrice: 4, quantity: 50, fournisseurIdx: 3 },
        { name: 'Chaîne Lunettes Argent', brand: 'Local', model: 'CH-200', category: 'accessory' as const, price: 15, costPrice: 5, quantity: 20, fournisseurIdx: 3 },
        { name: 'Spray Nettoyant 50ml', brand: 'Local', model: 'SN-50', category: 'accessory' as const, price: 8, costPrice: 2.5, quantity: 40, fournisseurIdx: 3 },
        { name: 'Nettoyant Lentilles 50ml', brand: 'Essilor', model: 'CL-50', category: 'nettoyant_lentilles' as const, price: 12, costPrice: 4.5, quantity: 30, thickness: '50ml', fournisseurIdx: 2 },
        { name: 'Nettoyant Lentilles 100ml', brand: 'Essilor', model: 'CL-100', category: 'nettoyant_lentilles' as const, price: 18, costPrice: 7, quantity: 20, thickness: '100ml', fournisseurIdx: 2 },
        { name: 'Solution Lentilles 360ml', brand: 'Alcon', model: 'SL-360', category: 'nettoyant_lentilles' as const, price: 28, costPrice: 12, quantity: 15, thickness: '360ml', fournisseurIdx: 1 },
        { name: 'Solution Lentilles 400ml', brand: 'Alcon', model: 'SL-400', category: 'nettoyant_lentilles' as const, price: 32, costPrice: 14, quantity: 10, thickness: '400ml', fournisseurIdx: 1 },
        { name: 'Nettoyant Monture 50ml', brand: 'Local', model: 'NM-50', category: 'nettoyant_monture' as const, price: 10, costPrice: 3.5, quantity: 25, thickness: '50ml', fournisseurIdx: 3 },
        { name: 'Spray Nettoyant Monture 50ml', brand: 'Zeiss', model: 'ZN-50', category: 'nettoyant_monture' as const, price: 14, costPrice: 5, quantity: 18, thickness: '50ml', fournisseurIdx: 2 },
    ]

    const products: Array<{ id: string }> = []
    const qrCounter = Date.now()
    for (const p of productsInput) {
        const existing = await prisma.product.findFirst({ where: { name: p.name, brand: p.brand } })
        if (!existing) {
            const { fournisseurIdx, lensType, material, coating, thickness, costPrice, ...rest } = p
            const product = await prisma.product.create({
                data: {
                    ...rest,
                    thickness: thickness || undefined,
                    lensType: lensType || undefined,
                    material: material || undefined,
                    coating: coating || undefined,
                    costPrice: costPrice || undefined,
                    fournisseurId: fournisseurs[fournisseurIdx].id,
                    qrcode: {
                        create: { code: `SOPT-${qrCounter}-${String(100 + Math.floor(Math.random() * 900))}` },
                    },
                },
                include: { qrcode: true },
            })
            products.push(product)
            console.log(`✅ Product: ${p.name} (QR: ${product.qrcode?.code})`)
        } else {
            products.push(existing)
        }
    }

    // ─── 6. Repair Services ─────────────────────────────────────────
    const repairServicesInput = [
        { name: 'Remontage complet', defaultPrice: 60 },
        { name: 'Soudure de monture', defaultPrice: 35 },
        { name: 'Changement branches', defaultPrice: 25 },
        { name: 'Ajustement & serrage', defaultPrice: 15 },
        { name: 'Remplacement plaquettes', defaultPrice: 10 },
        { name: 'Nettoyage ultrason', defaultPrice: 8 },
    ]

    const repairServices: Array<{ id: string; name: string }> = []
    for (const rs of repairServicesInput) {
        const existing = await prisma.repairService.findFirst({ where: { name: rs.name } })
        if (!existing) {
            const created = await prisma.repairService.create({ data: rs })
            repairServices.push(created)
            console.log(`✅ Repair service: ${rs.name} (${rs.defaultPrice} TND)`)
        } else {
            repairServices.push(existing)
        }
    }

    // ─── 7. Prescriptions (10 prescriptions) ────────────────────────
    const now = new Date()
    const day = (n: number) => new Date(now.getTime() - n * 86400000)

    const prescriptionsInput = [
        { clientIdx: 0, doctorIdx: 0, sphRight: -2.25, cylRight: -0.75, axisRight: 180, addRight: 0, pdRight: 32, sphLeft: -1.75, cylLeft: -0.50, axisLeft: 175, addLeft: 0, pdLeft: 32, dateWritten: day(60) },
        { clientIdx: 1, doctorIdx: 1, sphRight: 1.50, cylRight: -1.25, axisRight: 90, addRight: 2.00, pdRight: 30, sphLeft: 1.75, cylLeft: -1.00, axisLeft: 85, addLeft: 2.00, pdLeft: 30, dateWritten: day(120) },
        { clientIdx: 2, doctorIdx: 0, sphRight: -3.00, cylRight: -1.50, axisRight: 10, addRight: 0, pdRight: 33, sphLeft: -2.50, cylLeft: -1.25, axisLeft: 5, addLeft: 0, pdLeft: 33, dateWritten: day(45) },
        { clientIdx: 1, doctorIdx: 2, sphRight: 2.00, cylRight: -0.50, axisRight: 80, addRight: 2.25, pdRight: 30, sphLeft: 2.25, cylLeft: -0.75, axisLeft: 95, addLeft: 2.25, pdLeft: 30, dateWritten: day(15) },
        { clientIdx: 3, doctorIdx: 1, sphRight: -4.50, cylRight: -1.00, axisRight: 15, addRight: 0, pdRight: 31, sphLeft: -4.00, cylLeft: -0.75, axisLeft: 170, addLeft: 0, pdLeft: 31, dateWritten: day(90) },
        { clientIdx: 4, doctorIdx: 3, sphRight: -1.00, cylRight: 0, axisRight: 0, addRight: 1.50, pdRight: 33, sphLeft: -1.25, cylLeft: 0, axisLeft: 0, addLeft: 1.50, pdLeft: 33, dateWritten: day(200) },
        { clientIdx: 6, doctorIdx: 0, sphRight: -0.75, cylRight: -2.50, axisRight: 160, addRight: 2.75, pdRight: 31, sphLeft: -0.50, cylLeft: -2.25, axisLeft: 20, addLeft: 2.75, pdLeft: 31, dateWritten: day(30) },
        { clientIdx: 7, doctorIdx: 2, sphRight: -5.50, cylRight: -0.25, axisRight: 45, addRight: 0, pdRight: 30, sphLeft: -6.00, cylLeft: -0.50, axisLeft: 135, addLeft: 0, pdLeft: 30, dateWritten: day(180) },
        { clientIdx: 9, doctorIdx: 4, sphRight: 0.50, cylRight: -1.75, axisRight: 20, addRight: 2.50, pdRight: 32, sphLeft: 0.25, cylLeft: -2.00, axisLeft: 160, addLeft: 2.50, pdLeft: 32, dateWritten: day(75) },
        { clientIdx: 11, doctorIdx: 3, sphRight: -2.00, cylRight: -1.00, axisRight: 5, addRight: 0, pdRight: 33, sphLeft: -2.25, cylLeft: -0.75, axisLeft: 175, addLeft: 0, pdLeft: 33, dateWritten: day(10) },
    ]

    const prescriptions: Array<{ id: string; clientId: string }> = []
    for (const rx of prescriptionsInput) {
        const { clientIdx, doctorIdx, dateWritten, ...rxData } = rx
        const existing = await prisma.prescription.findFirst({
            where: { clientId: clients[clientIdx].id, sphRight: rx.sphRight, cylRight: rx.cylRight },
        })
        if (!existing) {
            const created = await prisma.prescription.create({
                data: {
                    ...rxData,
                    clientId: clients[clientIdx].id,
                    doctorId: doctors[doctorIdx].id,
                    dateWritten: dateWritten || undefined,
                },
            })
            prescriptions.push(created)
            console.log(`✅ Prescription for ${clients[clientIdx].name} ${clients[clientIdx].familyName}`)
        } else {
            prescriptions.push(existing)
        }
    }

    // ─── 8. Lens Brands ────────────────────────────────────────────
    const lensBrandNames = ['Essilor', 'Zeiss', 'Hoya', 'Rodenstock', 'Nikon', 'Shamir']
    for (const name of lensBrandNames) {
        const existing = await prisma.lensBrand.findUnique({ where: { name } })
        if (!existing) {
            await prisma.lensBrand.create({ data: { name } })
            console.log(`✅ Lens brand: ${name}`)
        }
    }

    // ─── 9. Optician Shops ─────────────────────────────────────────
    const opticianShopsInput = [
        { name: 'Optique Moderne', phone: '71223344', address: '15 Av. Habib Bourguiba, Sfax' },
        { name: 'Vision Plus', phone: '71998877', address: '8 Rue de Paris, Tunis' },
    ]
    const opticianShops: Array<{ id: string; name: string }> = []
    for (const s of opticianShopsInput) {
        const existing = await prisma.opticianShop.findFirst({ where: { phone: s.phone } })
        if (!existing) {
            const created = await prisma.opticianShop.create({ data: s })
            opticianShops.push(created)
            console.log(`✅ Optician shop: ${s.name}`)
        } else {
            opticianShops.push(existing)
        }
    }

    // ─── 10. Lens Blanks (10 records) ──────────────────────────────
    const lensBlanksInput = [
        { brand: 'Essilor', lensType: 'singleVision' as const, material: 'cr39' as const, coating: 'ar' as const, thickness: '1.50', sphMin: -6, sphMax: 4, cylMin: -2, cylMax: 0, costPrice: 18, sellingPrice: 45, quantity: 30, fournisseurIdx: 2 },
        { brand: 'Essilor', lensType: 'progressive' as const, material: 'highIndex' as const, coating: 'arScratch' as const, thickness: '1.60', sphMin: -8, sphMax: 6, cylMin: -4, cylMax: 0, costPrice: 55, sellingPrice: 120, quantity: 15, fournisseurIdx: 2 },
        { brand: 'Essilor', lensType: 'progressive' as const, material: 'highIndex' as const, coating: 'arBlueBlock' as const, thickness: '1.67', sphMin: -10, sphMax: 6, cylMin: -4, cylMax: 0, costPrice: 85, sellingPrice: 180, quantity: 8, fournisseurIdx: 2 },
        { brand: 'Zeiss', lensType: 'singleVision' as const, material: 'polycarbonate' as const, coating: 'scratchResistant' as const, thickness: '1.59', sphMin: -5, sphMax: 5, cylMin: -2, cylMax: 0, costPrice: 22, sellingPrice: 55, quantity: 25, fournisseurIdx: 2 },
        { brand: 'Zeiss', lensType: 'photochromic' as const, material: 'polycarbonate' as const, coating: 'blueBlock' as const, thickness: '1.59', sphMin: -6, sphMax: 4, cylMin: -2, cylMax: 0, costPrice: 40, sellingPrice: 95, quantity: 12, fournisseurIdx: 2 },
        { brand: 'Hoya', lensType: 'progressive' as const, material: 'highIndex' as const, coating: 'arScratch' as const, thickness: '1.70', sphMin: -12, sphMax: 8, cylMin: -4, cylMax: 0, costPrice: 95, sellingPrice: 200, quantity: 5, fournisseurIdx: 2 },
        { brand: 'Hoya', lensType: 'bifocal' as const, material: 'cr39' as const, coating: 'ar' as const, thickness: '1.50', sphMin: -4, sphMax: 4, cylMin: -2, cylMax: 0, costPrice: 20, sellingPrice: 50, quantity: 18, fournisseurIdx: 2 },
        { brand: 'Essilor', lensType: 'office' as const, material: 'cr39' as const, coating: 'blueBlock' as const, thickness: '1.50', sphMin: -4, sphMax: 4, cylMin: -2, cylMax: 0, costPrice: 28, sellingPrice: 65, quantity: 20, fournisseurIdx: 2 },
        { brand: 'Rodenstock', lensType: 'singleVision' as const, material: 'trivex' as const, coating: 'arScratch' as const, thickness: '1.53', sphMin: -8, sphMax: 6, cylMin: -3, cylMax: 0, costPrice: 35, sellingPrice: 80, quantity: 10, fournisseurIdx: 2 },
        { brand: 'Shamir', lensType: 'progressive' as const, material: 'highIndex' as const, coating: 'arBlueBlock' as const, thickness: '1.60', sphMin: -8, sphMax: 6, cylMin: -4, cylMax: 0, costPrice: 60, sellingPrice: 140, quantity: 7, fournisseurIdx: 2 },
    ]

    const lensBlanks: Array<{ id: string; brand: string; thickness: string }> = []
    for (const lb of lensBlanksInput) {
        const { fournisseurIdx, ...lbData } = lb
        const existing = await prisma.lensBlank.findFirst({
            where: { brand: lb.brand, thickness: lb.thickness, lensType: lb.lensType, material: lb.material },
        })
        if (!existing) {
            const created = await prisma.lensBlank.create({
                data: { ...lbData, fournisseurId: fournisseurs[fournisseurIdx].id },
            })
            lensBlanks.push(created)
            console.log(`✅ Lens blank: ${lb.brand} ${lb.thickness} ${lb.lensType} (qty: ${lb.quantity})`)
        } else {
            lensBlanks.push(existing)
        }
    }

    // ─── 11. Orders (12 orders with payment methods + cheques) ──────
    const nextOrderNumber = 1001

    interface OrderSeedItem { productIdx: number; quantity: number; unitPrice: number }
    interface OrderSeedPayment { amount: number; type: 'deposit' | 'balance' | 'full'; method?: string; chequeNumber?: string; chequeBank?: string; chequeDueDate?: Date }
    interface OrderSeedRepair { serviceIdx: number; price: number; date: Date }

    interface OrderSeed {
        clientIdx: number
        totalAmount: number
        orderType: 'standard' | 'remounting' | 'direct_sale'
        status: 'pending' | 'ready' | 'completed' | 'cancelled'
        items: OrderSeedItem[]
        payments: OrderSeedPayment[]
        repairs: OrderSeedRepair[]
        prescriptionIdx: number | null
        turnaroundDays: number | null
    }

    const ordersInput: OrderSeed[] = [
        { clientIdx: 0, totalAmount: 460, orderType: 'standard', status: 'completed',
            items: [{ productIdx: 0, quantity: 1, unitPrice: 280 }, { productIdx: 10, quantity: 1, unitPrice: 180 }],
            payments: [{ amount: 230, type: 'deposit', method: 'cash' }, { amount: 230, type: 'balance', method: 'card' }],
            repairs: [], prescriptionIdx: 0, turnaroundDays: 7 },
        { clientIdx: 1, totalAmount: 520, orderType: 'standard', status: 'completed',
            items: [{ productIdx: 3, quantity: 1, unitPrice: 520 }],
            payments: [{ amount: 520, type: 'full', method: 'cheque', chequeNumber: 'CHQ-001', chequeBank: 'BIAT', chequeDueDate: day(-3) }],
            repairs: [], prescriptionIdx: 1, turnaroundDays: 5 },
        { clientIdx: 2, totalAmount: 530, orderType: 'standard', status: 'pending',
            items: [{ productIdx: 2, quantity: 1, unitPrice: 350 }, { productIdx: 13, quantity: 1, unitPrice: 180 }],
            payments: [{ amount: 200, type: 'deposit', method: 'cash' }],
            repairs: [], prescriptionIdx: 2, turnaroundDays: 10 },
        { clientIdx: 3, totalAmount: 290, orderType: 'remounting', status: 'pending',
            items: [{ productIdx: 11, quantity: 1, unitPrice: 180 }],
            payments: [{ amount: 100, type: 'deposit', method: 'cash' }],
            repairs: [{ serviceIdx: 0, price: 60, date: day(-7) }, { serviceIdx: 3, price: 15, date: day(-7) }],
            prescriptionIdx: 4, turnaroundDays: 7 },
        { clientIdx: 4, totalAmount: 562, orderType: 'standard', status: 'completed',
            items: [{ productIdx: 1, quantity: 1, unitPrice: 260 }, { productIdx: 14, quantity: 1, unitPrice: 220 }, { productIdx: 16, quantity: 1, unitPrice: 35 }, { productIdx: 18, quantity: 1, unitPrice: 15 }, { productIdx: 17, quantity: 2, unitPrice: 12 }],
            payments: [{ amount: 562, type: 'full', method: 'card' }],
            repairs: [], prescriptionIdx: 5, turnaroundDays: 14 },
        { clientIdx: 5, totalAmount: 405, orderType: 'standard', status: 'pending',
            items: [{ productIdx: 4, quantity: 1, unitPrice: 310 }, { productIdx: 11, quantity: 1, unitPrice: 95 }],
            payments: [], repairs: [], prescriptionIdx: null, turnaroundDays: null },
        { clientIdx: 6, totalAmount: 62, orderType: 'direct_sale', status: 'completed',
            items: [{ productIdx: 16, quantity: 1, unitPrice: 35 }, { productIdx: 17, quantity: 1, unitPrice: 12 }, { productIdx: 19, quantity: 1, unitPrice: 15 }],
            payments: [{ amount: 62, type: 'full', method: 'cash' }],
            repairs: [], prescriptionIdx: null, turnaroundDays: null },
        { clientIdx: 7, totalAmount: 440, orderType: 'standard', status: 'ready',
            items: [{ productIdx: 5, quantity: 1, unitPrice: 190 }, { productIdx: 12, quantity: 1, unitPrice: 250 }],
            payments: [{ amount: 250, type: 'deposit', method: 'cash' }],
            repairs: [], prescriptionIdx: 7, turnaroundDays: 3 },
        { clientIdx: 8, totalAmount: 360, orderType: 'standard', status: 'cancelled',
            items: [{ productIdx: 0, quantity: 1, unitPrice: 280 }, { productIdx: 11, quantity: 1, unitPrice: 80 }],
            payments: [{ amount: 100, type: 'deposit', method: 'cash' }],
            repairs: [], prescriptionIdx: null, turnaroundDays: null },
        { clientIdx: 9, totalAmount: 425, orderType: 'remounting', status: 'ready',
            items: [{ productIdx: 15, quantity: 1, unitPrice: 260 }, { productIdx: 10, quantity: 1, unitPrice: 150 }],
            payments: [{ amount: 200, type: 'deposit', method: 'traite' }],
            repairs: [{ serviceIdx: 0, price: 60, date: day(2) }, { serviceIdx: 1, price: 35, date: day(2) }],
            prescriptionIdx: 8, turnaroundDays: 5 },
        { clientIdx: 10, totalAmount: 240, orderType: 'direct_sale', status: 'completed',
            items: [{ productIdx: 6, quantity: 2, unitPrice: 85 }, { productIdx: 9, quantity: 1, unitPrice: 70 }],
            payments: [{ amount: 240, type: 'full', method: 'transfer' }],
            repairs: [], prescriptionIdx: null, turnaroundDays: null },
        { clientIdx: 11, totalAmount: 605, orderType: 'standard', status: 'pending',
            items: [{ productIdx: 3, quantity: 1, unitPrice: 520 }, { productIdx: 15, quantity: 1, unitPrice: 85 }],
            payments: [{ amount: 150, type: 'deposit', method: 'cash' }],
            repairs: [], prescriptionIdx: 9, turnaroundDays: 10 },
    ]

    for (let idx = 0; idx < ordersInput.length; idx++) {
        const o = ordersInput[idx]
        const orderNumber = nextOrderNumber + idx
        const existing = await prisma.order.findFirst({ where: { orderNumber } })
        if (existing) { console.log(`⏭️  Order #${orderNumber} exists`); continue }

        const client = clients[o.clientIdx]

        const paymentCreates: any[] = []
        for (const p of o.payments) {
            let chequeId: string | undefined
            if (p.method === 'cheque' && p.chequeNumber) {
                const cheque = await prisma.cheque.create({
                    data: {
                        number: p.chequeNumber,
                        bankName: p.chequeBank || '',
                        amount: p.amount,
                        dueDate: p.chequeDueDate || day(30),
                        entityType: 'client_payment',
                    },
                })
                chequeId = cheque.id
            }
            paymentCreates.push({
                amount: p.amount,
                type: p.type,
                method: p.method || 'cash',
                chequeId: chequeId || null,
                paidAt: new Date(),
            })
        }

        const order = await prisma.order.create({
            data: {
                orderNumber,
                clientId: client.id,
                totalAmount: o.totalAmount,
                orderType: o.orderType,
                status: o.status,
                turnaroundDays: o.turnaroundDays,
                prescriptionId: o.prescriptionIdx !== null ? prescriptions[o.prescriptionIdx]?.id || null : null,
                items: { create: o.items.map((item) => ({ productId: products[item.productIdx].id, quantity: item.quantity, unitPrice: item.unitPrice })) },
                payments: { create: paymentCreates },
                workOrders: o.repairs.length > 0 ? {
                    create: o.repairs.map((r) => ({
                        type: 'repair' as const,
                        source: 'internal' as const,
                        status: 'pending' as const,
                        dueDate: r.date,
                        expectedCompletionDate: r.date,
                        repairServiceId: repairServices[r.serviceIdx].id,
                        servicePrice: r.price,
                    })),
                } : undefined,
            },
        })

        const paid = o.payments.reduce((s, p) => s + p.amount, 0)
        console.log(`✅ Order #${orderNumber} — ${client.name} ${client.familyName} — ${paid}/${o.totalAmount} TND [${o.status}]`)
    }

    // ─── 12. Direct Atelier Work Orders (optician-sourced) ──────────
    const directWorkOrdersInput = [
        { opticianShopIdx: 0, type: 'mounting' as const, source: 'optician' as const, status: 'pending' as const, servicePrice: 80, repairServiceIdx: 0, dueDate: day(-3), lensBlankIdx: 1, frameFrom: 'optician' as const },
        { opticianShopIdx: 1, type: 'mounting' as const, source: 'optician' as const, status: 'in_progress' as const, servicePrice: 80, repairServiceIdx: 0, dueDate: day(5), lensBlankIdx: 4, frameFrom: 'client' as const },
        { opticianShopIdx: 0, type: 'repair' as const, source: 'optician' as const, status: 'completed' as const, servicePrice: 35, repairServiceIdx: 1, dueDate: day(-10) },
        { opticianShopIdx: 1, type: 'mounting' as const, source: 'optician' as const, status: 'completed' as const, servicePrice: 80, repairServiceIdx: 0, dueDate: day(-15), lensBlankIdx: 2, lensBlankPrice: 180, frameFrom: 'optician' as const },
        { opticianShopIdx: 1, type: 'mounting' as const, source: 'optician' as const, status: 'delivered' as const, servicePrice: 80, repairServiceIdx: 0, dueDate: day(-20), lensBlankIdx: 0, lensBlankPrice: 45, frameFrom: 'shop' as const },
    ]

    const existingDirect = await prisma.atelierWorkOrder.count({ where: { source: 'optician' } })
    if (existingDirect === 0) {
        for (const wo of directWorkOrdersInput) {
            const { lensBlankIdx, lensBlankPrice, repairServiceIdx, frameFrom, opticianShopIdx, ...woData } = wo
            const lensBlank = lensBlankIdx !== undefined ? lensBlanks[lensBlankIdx] : undefined

            const status = wo.status
            const startedAt = status === 'in_progress' || status === 'completed' || status === 'delivered' ? day(-2) : null
            const completedAt = status === 'completed' || status === 'delivered' ? day(-1) : null

            await prisma.atelierWorkOrder.create({
                data: {
                    ...woData,
                    opticianShopId: opticianShops[opticianShopIdx].id,
                    repairServiceId: repairServices[repairServiceIdx].id,
                    lensBlankLeftId: lensBlank ? lensBlank.id : null,
                    frameFrom: frameFrom || null,
                    lensBlankPrice: lensBlankPrice || null,
                    startedAt,
                    completedAt,
                    expectedCompletionDate: wo.dueDate,
                },
            })
            console.log(`✅ Direct work order: ${wo.source}/${wo.type} for ${opticianShops[opticianShopIdx].name} [${wo.status}]`)
        }
    } else {
        console.log(`⏭️  ${existingDirect} direct work orders exist`)
    }

    // ─── 13. Purchase Invoices (5 invoices) ────────────────────────
    const purchaseInvoicesInput = [
        { invoiceNumber: 'FAC-ODT-001', fournisseurIdx: 0, entity: 'shop' as const, items: [
            { productIdx: 0, quantity: 5, unitPrice: 150 },
            { productIdx: 3, quantity: 3, unitPrice: 290 },
            { productIdx: 21, quantity: 20, unitPrice: 3.5 },
        ]},
        { invoiceNumber: 'FAC-ELM-001', fournisseurIdx: 1, entity: 'shop' as const, items: [
            { productIdx: 6, quantity: 10, unitPrice: 40 },
            { productIdx: 8, quantity: 15, unitPrice: 48 },
        ]},
        { invoiceNumber: 'FAC-ET-001', fournisseurIdx: 2, entity: 'atelier' as const, items: [
            { lensBlankIdx: 0, quantity: 20, unitPrice: 16 },
            { lensBlankIdx: 1, quantity: 10, unitPrice: 50 },
            { lensBlankIdx: 3, quantity: 15, unitPrice: 20 },
        ]},
        { invoiceNumber: 'FAC-ET-002', fournisseurIdx: 2, entity: 'atelier' as const, items: [
            { lensBlankIdx: 2, quantity: 5, unitPrice: 80 },
            { lensBlankIdx: 5, quantity: 3, unitPrice: 88 },
            { lensBlankIdx: 7, quantity: 10, unitPrice: 25 },
        ]},
        { invoiceNumber: 'FAC-VHP-001', fournisseurIdx: 4, entity: 'atelier' as const, items: [
            { lensBlankIdx: 4, quantity: 12, unitPrice: 60 },
            { lensBlankIdx: 6, quantity: 8, unitPrice: 35 },
        ]},
    ]

    const existingInvoicesCount = await prisma.purchaseInvoice.count()
    if (existingInvoicesCount === 0 || existingInvoicesCount !== purchaseInvoicesInput.length) {
        if (existingInvoicesCount > 0) {
            // Delete all existing traites, supplier payments, and invoices to re-create
            await prisma.traite.deleteMany()
            await prisma.supplierPayment.deleteMany()
            await prisma.purchaseInvoiceItem.deleteMany()
            await prisma.purchaseInvoice.deleteMany()
        }
        for (const inv of purchaseInvoicesInput) {
            const totalAmount = inv.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

            await prisma.purchaseInvoice.create({
                data: {
                    invoiceNumber: inv.invoiceNumber,
                    fournisseurId: fournisseurs[inv.fournisseurIdx].id,
                    entity: inv.entity,
                    date: day(Math.floor(Math.random() * 30)),
                    totalAmount,
                    paidAmount: 0,
                    items: {
                        create: inv.items.map((item) => ({
                            productId: 'productIdx' in item ? products[(item as any).productIdx].id : null,
                            lensBlankId: 'lensBlankIdx' in item ? lensBlanks[(item as any).lensBlankIdx].id : null,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
            })
            console.log(`✅ Purchase invoice: ${inv.invoiceNumber} (${inv.entity}) — ${totalAmount.toFixed(3)} TND`)
        }
    } else {
        console.log(`⏭️  ${existingInvoicesCount} purchase invoices exist`)
    }

    // ─── 14. Supplier Payments + Cheques + Traites ─────────────────
    const existingPayments = await prisma.supplierPayment.count()
    if (existingPayments === 0) {
        // Get the created invoices
        const invoices = await prisma.purchaseInvoice.findMany({ orderBy: { date: 'asc' } })
        if (invoices.length >= 4) {
            // Cash payment on first shop invoice (partial)
            await prisma.supplierPayment.create({
                data: {
                    purchaseInvoiceId: invoices[0].id,
                    amount: Number(invoices[0].totalAmount) / 2,
                    method: 'cash',
                    paidAt: day(5),
                },
            })
            await prisma.purchaseInvoice.update({
                where: { id: invoices[0].id },
                data: { paidAmount: Number(invoices[0].totalAmount) / 2 },
            })
            console.log(`✅ Cash payment on ${invoices[0].invoiceNumber} (50%)`)

            // Cheque payment on the first atelier invoice (full)
            const cheque = await prisma.cheque.create({
                data: {
                    number: 'CHQ-SUP-001',
                    bankName: 'Amen Bank',
                    amount: Number(invoices[2].totalAmount),
                    dueDate: day(15),
                    entityType: 'supplier_payment',
                },
            })
            await prisma.supplierPayment.create({
                data: {
                    purchaseInvoiceId: invoices[2].id,
                    amount: Number(invoices[2].totalAmount),
                    method: 'cheque',
                    chequeId: cheque.id,
                    paidAt: day(2),
                },
            })
            await prisma.purchaseInvoice.update({
                where: { id: invoices[2].id },
                data: { paidAmount: Number(invoices[2].totalAmount) },
            })
            console.log(`✅ Cheque payment on ${invoices[2].invoiceNumber} (100%)`)

            // Traite on the second atelier invoice
            const traiteDate = day(45)
            await prisma.traite.create({
                data: {
                    number: 'TRT-001',
                    amount: Number(invoices[3].totalAmount),
                    dueDate: traiteDate,
                    purchaseInvoiceId: invoices[3].id,
                    notes: 'Paiement à 45 jours',
                },
            })
            console.log(`✅ Traite TRT-001 on ${invoices[3].invoiceNumber} (due ${traiteDate.toLocaleDateString()})`)
        }
    } else {
        console.log(`⏭️  ${existingPayments} supplier payments exist`)
    }

    // ─── 15. Lens Blank Adjustments ────────────────────────────────
    const existingAdjustments = await prisma.lensBlankAdjustment.count()
    if (existingAdjustments === 0) {
        // Purchased from invoice FAC-ET-001
        const invAtelier1 = await prisma.purchaseInvoice.findFirst({ where: { invoiceNumber: 'FAC-ET-001' } })
        if (invAtelier1 && lensBlanks.length >= 3) {
            await prisma.lensBlankAdjustment.create({
                data: { lensBlankId: lensBlanks[0].id, quantity: 20, reason: 'purchased', invoiceId: invAtelier1.id },
            })
            await prisma.lensBlank.update({ where: { id: lensBlanks[0].id }, data: { quantity: { increment: 20 } } })
            await prisma.lensBlankAdjustment.create({
                data: { lensBlankId: lensBlanks[1].id, quantity: 10, reason: 'purchased', invoiceId: invAtelier1.id },
            })
            await prisma.lensBlank.update({ where: { id: lensBlanks[1].id }, data: { quantity: { increment: 10 } } })
            console.log('✅ Purchased adjustments from FAC-ATELIER-001')
        }

        // Used in mounting from an internal order's work order
        const mountWO = await prisma.atelierWorkOrder.findFirst({
            where: { type: 'mounting', source: 'optician' },
            orderBy: { createdAt: 'asc' },
        })
        if (mountWO && lensBlanks.length >= 2) {
            await prisma.lensBlankAdjustment.create({
                data: { lensBlankId: lensBlanks[1].id, quantity: -1, reason: 'used_in_mounting', workOrderId: mountWO.id },
            })
            await prisma.lensBlank.update({ where: { id: lensBlanks[1].id }, data: { quantity: { increment: -1 } } })
            console.log('✅ Used-in-mounting adjustment')
        }

        // Broken during mounting
        const brokenWO = await prisma.atelierWorkOrder.findFirst({
            where: { type: 'mounting', source: 'optician', status: 'completed' },
        })
        if (brokenWO && lensBlanks.length >= 3) {
            await prisma.lensBlankAdjustment.create({
                data: { lensBlankId: lensBlanks[3].id, quantity: -1, reason: 'broken_during_mounting', workOrderId: brokenWO.id },
            })
            await prisma.lensBlank.update({ where: { id: lensBlanks[3].id }, data: { quantity: { increment: -1 } } })
            console.log('✅ Broken-during-mounting adjustment')
        }
    } else {
        console.log(`⏭️  ${existingAdjustments} lens blank adjustments exist`)
    }

    // ─── 16. Stock Adjustments ─────────────────────────────────────
    const adjustmentsInput = [
        { productIdx: 0, quantity: 5, reason: 'restock' as const },
        { productIdx: 6, quantity: -2, reason: 'damage' as const },
        { productIdx: 11, quantity: -3, reason: 'sale' as const },
        { productIdx: 17, quantity: 20, reason: 'restock' as const },
        { productIdx: 4, quantity: -1, reason: 'adjustment' as const },
    ]
    for (const adj of adjustmentsInput) {
        const productId = products[adj.productIdx]?.id
        if (!productId) continue
        const existingAdj = await prisma.stockAdjustment.findFirst({
            where: { productId, reason: adj.reason, quantity: adj.quantity },
        })
        if (!existingAdj) {
            await prisma.stockAdjustment.create({ data: { productId, quantity: adj.quantity, reason: adj.reason } })
            await prisma.product.update({ where: { id: productId }, data: { quantity: { increment: adj.quantity } } })
            console.log(`✅ Stock adjustment: ${adj.reason} ${adj.quantity > 0 ? '+' : ''}${adj.quantity} for product #${adj.productIdx + 1}`)
        }
    }

    // ─── 17. SMS Log Samples ───────────────────────────────────────
    const smsLogsInput = [
        { clientIdx: 1, message: 'Votre commande #1002 est prête. Merci de passer la récupérer. - Sofien Optic', status: 'sent' as const },
        { clientIdx: 0, message: 'Votre commande #1001 est prête. Merci de passer la récupérer. - Sofien Optic', status: 'sent' as const },
        { clientIdx: 4, message: 'Rappel: votre commande #1005 vous attend. - Sofien Optic', status: 'sent' as const },
    ]
    for (const sms of smsLogsInput) {
        const client = clients[sms.clientIdx]
        const existingSms = await prisma.smsLog.findFirst({ where: { message: sms.message } })
        if (!existingSms) {
            await prisma.smsLog.create({
                data: { clientId: client.id, phone: '55123456', message: sms.message, status: sms.status },
            })
        }
    }
    console.log(`✅ ${smsLogsInput.length} SMS log entries`)

    // ─── Summary ─────────────────────────────────────────────────────
    const counts = {
        users: await prisma.user.count(),
        clients: await prisma.client.count(),
        doctors: await prisma.doctor.count(),
        fournisseurs: await prisma.fournisseur.count(),
        opticianShops: await prisma.opticianShop.count(),
        products: await prisma.product.count(),
        lensBlanks: await prisma.lensBlank.count(),
        prescriptions: await prisma.prescription.count(),
        orders: await prisma.order.count(),
        payments: await prisma.payment.count(),
        cheques: await prisma.cheque.count(),
        traites: await prisma.traite.count(),
        workOrders: await prisma.atelierWorkOrder.count(),
        purchaseInvoices: await prisma.purchaseInvoice.count(),
        supplierPayments: await prisma.supplierPayment.count(),
        lensBlankAdjustments: await prisma.lensBlankAdjustment.count(),
        stockAdjustments: await prisma.stockAdjustment.count(),
        smsLogs: await prisma.smsLog.count(),
        repairServices: await prisma.repairService.count(),
        lensBrands: await prisma.lensBrand.count(),
    }

    console.log('\n📊 Database summary:')
    for (const [key, value] of Object.entries(counts)) {
        console.log(`   ${key}: ${value}`)
    }
    console.log('\n🎉 Seed complete!')
    console.log('   Admin:  sofien@optic.tn  / admin123')
    console.log('   Shop:   shop@sofien.tn    / 123456')
    console.log('   Atelier: atelier@sofien.tn / 123456')
}

seed()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
