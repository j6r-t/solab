/**
 * Sofien Optic — test database seed
 *
 * Run:  npm run db:seed   (or: npx prisma db seed)
 *
 * ⚠️  DESTRUCTIVE: wipes ALL data, then inserts a deterministic, realistic
 * dataset covering every feature of the app. Safe to re-run anytime — you
 * always end up with the same clean state (relative to "today").
 *
 * Logins:
 *   owner@sofien.tn   / admin123   [admin]
 *   shop@sofien.tn    / shop123    [shop]
 *   atelier@sofien.tn / atelier123 [atelier]
 */
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers — all dates are relative to "now" so dashboards/reports always
// have fresh-looking data. day(-7) = one week ago, day(5) = in 5 days.
// ─────────────────────────────────────────────────────────────────────────────
const NOW = new Date()
function day(n, h = 10, m = 30) {
    const d = new Date(NOW)
    d.setDate(d.getDate() + n)
    d.setHours(h, m, 0, 0)
    return d
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. Wipe (children → parents)
// ─────────────────────────────────────────────────────────────────────────────
async function wipe() {
    console.log('🧹 Wiping existing data...')
    await prisma.auditLog.deleteMany()
    await prisma.smsLog.deleteMany()
    await prisma.opticianShopPayment.deleteMany()
    await prisma.opticianShopBillItem.deleteMany()
    await prisma.opticianShopBill.deleteMany()
    await prisma.opticianShopPrescription.deleteMany()
    await prisma.workOrderService.deleteMany()
    await prisma.lensBlankAdjustment.deleteMany()
    await prisma.atelierWorkOrder.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cheque.deleteMany()
    await prisma.supplierPayment.deleteMany()
    await prisma.purchaseInvoiceItem.deleteMany()
    await prisma.purchaseInvoice.deleteMany()
    await prisma.stockAdjustment.deleteMany()
    await prisma.qRCode.deleteMany()
    await prisma.lensBlank.deleteMany()
    await prisma.product.deleteMany()
    await prisma.prescription.deleteMany()
    await prisma.repairService.deleteMany()
    await prisma.lensBrand.deleteMany()
    await prisma.fournisseur.deleteMany()
    await prisma.opticianShop.deleteMany()
    await prisma.doctor.deleteMany()
    await prisma.client.deleteMany()
    await prisma.user.deleteMany()
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
    await wipe()

    // ─── 1. Users ──────────────────────────────────────────────────────────
    console.log('── Users')
    const users = {}
    for (const u of [
        { key: 'admin', email: 'owner@sofien.tn', name: 'Sofien', password: 'admin123', role: 'admin' },
        { key: 'shop', email: 'shop@sofien.tn', name: 'Kaouther', password: 'shop123', role: 'shop' },
        { key: 'atelier', email: 'atelier@sofien.tn', name: 'Mehdi', password: 'atelier123', role: 'atelier' },
    ]) {
        const hashed = await bcrypt.hash(u.password, 10)
        users[u.key] = await prisma.user.create({
            data: { email: u.email, name: u.name, password: hashed, role: u.role, createdAt: day(-200) },
        })
        console.log(`   ✅ ${u.email} / ${u.password} [${u.role}]`)
    }

    // ─── 2. Clients ────────────────────────────────────────────────────────
    console.log('── Clients')
    const clientsInput = [
        { name: 'Ahmed', familyName: 'Ben Ali', phone: '55123456', gender: 'male', birthDate: '1985-04-12', address: '12 Rue Habib Bourguiba, Tunis' },
        { name: 'Fatma', familyName: 'Trabelsi', phone: '52987654', gender: 'female', birthDate: '1962-09-03', address: '5 Av. Farhat Hached, Sfax', notes: 'Préfère les montures légères' },
        { name: 'Mohamed', familyName: 'Jendoubi', phone: '96345678', gender: 'male', birthDate: '1990-01-25', address: '8 Rue de la Liberté, Sousse' },
        { name: 'Amira', familyName: 'Bouazizi', phone: '22456789', gender: 'female', birthDate: '1978-11-17', address: '3 Place Pasteur, Monastir', organization: 'Clinique El Amen' },
        { name: 'Youssef', familyName: 'Hamdi', phone: '90345612', gender: 'male', birthDate: '1995-06-30', address: '15 Blvd. 9 Avril, Tunis' },
        { name: 'Rim', familyName: 'Kallel', phone: '53876543', gender: 'female', birthDate: '1988-02-08', address: '7 Rue Ibn Khaldoun, Nabeul' },
        { name: 'Karim', familyName: 'Mabrouk', phone: '20123456', gender: 'male', birthDate: '1970-12-01', address: '22 Rue Mongi Slim, La Marsa', notes: 'Verres progressifs depuis 2019' },
        { name: 'Salma', familyName: 'Ben Salah', phone: '22123478', gender: 'female', birthDate: '1993-07-22', address: '14 Av. Hédi Nouira, Bizerte' },
        { name: 'Nader', familyName: 'Gharbi', phone: '50223344', gender: 'male', birthDate: '1982-03-14', address: '9 Rue Tahar Haddad, Gabès' },
        { name: 'Monia', familyName: 'Laabidi', phone: '28556677', gender: 'female', birthDate: '1975-05-19', address: '6 Rue 2 Mars, Kairouan', organization: 'STB Kairouan' },
        { name: 'Hichem', familyName: 'Ben Abdallah', phone: '94456789', gender: 'male', birthDate: '1998-10-05', address: '11 Rue des Jasmins, Hammamet' },
        { name: 'Noura', familyName: 'Slimane', phone: '21112233', gender: 'female', birthDate: '1968-08-27', address: '18 Rue de la Paix, Gafsa', notes: 'Addition forte — contrôler verillage' },
        { name: 'Sonia', familyName: 'Dridi', phone: '55778899', gender: 'female', birthDate: '1991-01-09', address: '4 Av. de la Gare, Sousse' },
        { name: 'Walid', familyName: 'Cherif', phone: '25667788', gender: 'male', birthDate: '1986-06-11', address: '27 Rue Ibn Sina, Tunis' },
    ]
    const clients = []
    for (const [i, c] of clientsInput.entries()) {
        clients.push(await prisma.client.create({ data: { ...c, createdAt: day(-180 + i * 5) } }))
    }
    // A soft-deleted client to test list filtering / restore scenarios
    await prisma.client.create({
        data: { name: 'Ancien', familyName: 'Client', phone: '99000001', gender: 'male', deletedAt: day(-10) },
    })
    console.log(`   ✅ ${clients.length} clients (+1 soft-deleted)`)

    // ─── 3. Doctors ────────────────────────────────────────────────────────
    console.log('── Doctors')
    const doctorsInput = [
        { name: 'Dr. Mohamed Mansour', phone: '98123456', address: 'Polyclinique Taoufik, Tunis', specialization: 'Ophtalmologiste' },
        { name: 'Dr. Salma Ben Jannet', phone: '98234567', address: 'Centre Médical El Menzah, Tunis', specialization: 'Ophtalmologiste' },
        { name: 'Dr. Khaled Boukadida', phone: '98345678', address: 'Clinique les Oliviers, Sousse', specialization: 'Ophtalmologiste pédiatrique' },
        { name: 'Dr. Ines Mhiri', phone: '98456789', address: 'Cabinet Médical Lafayette, Tunis', specialization: 'Orthoptiste' },
        { name: 'Dr. Fathi Mezni', phone: '98567890', address: 'Hôpital Militaire, Tunis', specialization: 'Ophtalmologiste — Rétine' },
    ]
    const doctors = []
    for (const d of doctorsInput) doctors.push(await prisma.doctor.create({ data: d }))
    console.log(`   ✅ ${doctors.length} doctors`)

    // ─── 4. Fournisseurs ───────────────────────────────────────────────────
    console.log('── Fournisseurs')
    const fournisseursInput = [
        { name: 'Optique Distribution Tunis', phone: '71234567', address: 'Zone Industrielle Charguia I, Tunis', email: 'contact@odt.tn', taxId: '1234567/A/M/000', entity: 'shop' },
        { name: 'EuroLens Méditerranée', phone: '73345678', address: 'Route de la Plage, Sousse', email: 'ventes@eurolens.tn', taxId: '2345678/B/M/000', entity: 'shop' },
        { name: 'Essilor Tunisie', phone: '71987654', address: 'Immeuble Le Palace, Les Berges du Lac, Tunis', email: 'commandes@essilor.tn', taxId: '3456789/C/M/000', entity: 'atelier' },
        { name: 'Accessoires Optiques Sfax', phone: '74234567', address: 'Av. Habib Bourguiba, Sfax', email: 'accessoires.sfx@gmail.com', taxId: '4567890/D/M/000', entity: 'shop' },
        { name: 'Verres Haute Précision', phone: '75123456', address: 'Zone Industrielle Sidi Bouzid, Sfax', email: 'vhp@vhp.tn', taxId: '5678901/E/M/000', entity: 'atelier' },
        { name: 'Matériel Optique Bizerte', phone: '72456789', address: 'Rue 14 Janvier, Bizerte', email: 'mob@bizerte.tn', taxId: '6789012/F/M/000', entity: 'atelier' },
    ]
    const fournisseurs = []
    for (const f of fournisseursInput) fournisseurs.push(await prisma.fournisseur.create({ data: f }))
    console.log(`   ✅ ${fournisseurs.length} fournisseurs (3 shop / 3 atelier)`)

    // ─── 5. Optician shops ─────────────────────────────────────────────────
    console.log('── Optician shops')
    const shopsInput = [
        { name: 'Optique Moderne', phone: '71223344', address: '15 Av. Habib Bourguiba, Sfax' },
        { name: 'Vision Plus', phone: '71998877', address: '8 Rue de Paris, Tunis' },
        { name: 'Optique du Centre', phone: '76554433', address: '3 Rue Russia, Sousse' },
    ]
    const shops = []
    for (const s of shopsInput) shops.push(await prisma.opticianShop.create({ data: s }))
    console.log(`   ✅ ${shops.length} optician shops`)

    // ─── 6. Repair services + lens brands ──────────────────────────────────
    console.log('── Repair services / lens brands')
    const repairServices = []
    for (const rs of [
        { name: 'Remontage complet', defaultPrice: 60 },
        { name: 'Soudure de monture', defaultPrice: 35 },
        { name: 'Changement branches', defaultPrice: 25 },
        { name: 'Ajustement & serrage', defaultPrice: 15 },
        { name: 'Remplacement plaquettes', defaultPrice: 10 },
        { name: 'Nettoyage ultrason', defaultPrice: 8 },
    ]) {
        repairServices.push(await prisma.repairService.create({ data: rs }))
    }
    for (const name of ['Essilor', 'Zeiss', 'Hoya', 'Rodenstock', 'Nikon', 'Shamir']) {
        await prisma.lensBrand.create({ data: { name } })
    }
    console.log(`   ✅ ${repairServices.length} repair services, 6 lens brands`)

// ─── 7. Products (+ QR codes, stock adjustment history) ───────────────
//  `qty`        = final quantity in stock
//  `adjustments`= history rows; the product is created at (qty - Σ adj)
//                 then each adjustment is applied, so arithmetic stays true.
console.log('── Products')
    const productsInput = [
        { name: 'Ray-Ban Aviator', brand: 'Ray-Ban', model: 'RB3025', category: 'lunette', price: 280, costPrice: 160, qty: 8, f: 0, adjustments: [{ q: 5, reason: 'restock', d: -20 }] },
        { name: 'Ray-Ban Wayfarer', brand: 'Ray-Ban', model: 'RB2140', category: 'lunette', price: 260, costPrice: 145, qty: 5, f: 0 },
        { name: 'Oakley Holbrook', brand: 'Oakley', model: 'OO9102', category: 'lunette', price: 350, costPrice: 210, qty: 2, f: 0 },
        { name: 'Tom Ford FT5401', brand: 'Tom Ford', model: 'FT5401', category: 'lunette', price: 520, costPrice: 310, qty: 4, f: 0 },
        { name: 'Persol PO3092V', brand: 'Persol', model: 'PO3092V', category: 'lunette', price: 310, costPrice: 185, qty: 1, f: 0 },
        { name: 'Vogue VO2720', brand: 'Vogue', model: 'VO2720', category: 'lunette', price: 190, costPrice: 100, qty: 0, f: 0 },
        { name: 'Biofinity Monthly', brand: 'CooperVision', model: 'Biofinity', category: 'lentille', price: 85, costPrice: 45, qty: 26, f: 1, adjustments: [{ q: -4, reason: 'sale', d: -15 }] },
        { name: 'Dailies Total 1', brand: 'Alcon', model: 'Dailies Total1', category: 'lentille', price: 120, costPrice: 70, qty: 20, f: 1 },
        { name: 'Air Optix HydraGlyde', brand: 'Alcon', model: 'Air Optix', category: 'lentille', price: 95, costPrice: 55, qty: 25, f: 1 },
        { name: 'Acuvue Oasys', brand: 'Johnson & Johnson', model: 'Acuvue Oasys', category: 'lentille', price: 110, costPrice: 60, qty: 15, f: 1, lensType: 'singleVision', material: 'polycarbonate', coating: 'blueBlock' },
        { name: 'Varilux Comfort 2', brand: 'Essilor', model: 'Varilux Comfort', category: 'verre', price: 280, costPrice: 150, qty: 10, f: 2, thickness: '2.0', lensType: 'progressive', material: 'highIndex', coating: 'arScratch', sph: -2, cyl: -0.75, add: 2.5 },
        { name: 'Crizal Easy Pro', brand: 'Essilor', model: 'Crizal Pro', category: 'verre', price: 180, costPrice: 90, qty: 15, f: 2, thickness: '1.5', lensType: 'singleVision', material: 'cr39', coating: 'ar', sph: -1.5 },
        { name: 'Stellify FreeForm', brand: 'Essilor', model: 'Stellify', category: 'verre', price: 340, costPrice: 200, qty: 3, f: 2, thickness: '1.67', lensType: 'progressive', material: 'highIndex', coating: 'arBlueBlock', sph: -3, cyl: -1, add: 2.75 },
        { name: 'Hoyalux iD', brand: 'Hoya', model: 'Hoyalux iD MyStyle', category: 'verre', price: 310, costPrice: 175, qty: 7, f: 2, thickness: '1.6', lensType: 'progressive', material: 'highIndex', coating: 'arScratch', sph: -0.75, cyl: -0.5, add: 2.25 },
        { name: 'Zeiss PhotoFusion', brand: 'Zeiss', model: 'PhotoFusion X', category: 'verre', price: 260, costPrice: 140, qty: 6, f: 2, thickness: '1.5', lensType: 'photochromic', material: 'polycarbonate', coating: 'scratchResistant', sph: 0 },
        { name: 'Essilor Anti-Fatigue', brand: 'Essilor', model: 'Anti-Fatigue', category: 'verre', price: 220, costPrice: 120, qty: 8, f: 2, thickness: '1.5', lensType: 'office', material: 'cr39', coating: 'blueBlock', sph: 0.75, add: 0.85 },
        { name: 'Varilux X Series', brand: 'Essilor', model: 'Varilux X', category: 'verre', price: 420, costPrice: 260, qty: 4, f: 2, thickness: '1.74', lensType: 'progressive', material: 'highIndex', coating: 'arBlueBlock', sph: -5, cyl: -1.5, add: 3 },
        { name: 'Crizal Single Vision 1.5', brand: 'Essilor', model: 'Crizal SV', category: 'verre', price: 140, costPrice: 70, qty: 20, f: 2, thickness: '1.5', lensType: 'singleVision', material: 'cr39', coating: 'ar', sph: -4, cyl: -2 },
        { name: 'Hoya Nulux EP', brand: 'Hoya', model: 'Nulux EP', category: 'verre', price: 360, costPrice: 210, qty: 3, f: 2, thickness: '1.7', lensType: 'progressive', material: 'highIndex', coating: 'arScratch', sph: -6, cyl: -1.25, add: 2.5 },
        { name: 'Zeiss SmartLife', brand: 'Zeiss', model: 'SmartLife', category: 'verre', price: 380, costPrice: 230, qty: 4, f: 2, thickness: '1.6', lensType: 'bifocal', material: 'polycarbonate', coating: 'arBlueBlock', sph: 1.5, add: 2 },
        { name: 'Étui Cuir Luxe', brand: 'Local', model: 'CL-100', category: 'accessory', price: 35, costPrice: 12, qty: 25, f: 3 },
        { name: 'Chiffon Microfibre', brand: 'Local', model: 'CM-50', category: 'accessory', price: 12, costPrice: 4, qty: 50, f: 3 },
        { name: 'Chaîne Lunettes Argent', brand: 'Local', model: 'CH-200', category: 'accessory', price: 15, costPrice: 5, qty: 20, f: 3 },
        { name: 'Spray Nettoyant 50ml', brand: 'Local', model: 'SN-50', category: 'accessory', price: 8, costPrice: 2.5, qty: 40, f: 3 },
        { name: 'Nettoyant Lentilles 50ml', brand: 'Essilor', model: 'CL-50', category: 'nettoyant_lentilles', price: 12, costPrice: 4.5, qty: 30, f: 2, thickness: '50ml' },
        { name: 'Nettoyant Lentilles 100ml', brand: 'Essilor', model: 'CL-100', category: 'nettoyant_lentilles', price: 18, costPrice: 7, qty: 20, f: 2, thickness: '100ml' },
        { name: 'Solution Lentilles 360ml', brand: 'Alcon', model: 'SL-360', category: 'nettoyant_lentilles', price: 28, costPrice: 12, qty: 15, f: 1, thickness: '360ml' },
        { name: 'Solution Lentilles 400ml', brand: 'Alcon', model: 'SL-400', category: 'nettoyant_lentilles', price: 32, costPrice: 14, qty: 10, f: 1, thickness: '400ml' },
        { name: 'Nettoyant Monture 50ml', brand: 'Local', model: 'NM-50', category: 'nettoyant_monture', price: 10, costPrice: 3.5, qty: 25, f: 3, thickness: '50ml' },
        { name: 'Spray Monture Zeiss 50ml', brand: 'Zeiss', model: 'ZN-50', category: 'nettoyant_monture', price: 14, costPrice: 5, qty: 18, f: 2, thickness: '50ml' },
    ]
    const products = []
    for (const [i, p] of productsInput.entries()) {
        const { qty, adjustments = [], f, ...rest } = p
        const initial = qty - adjustments.reduce((s, a) => s + a.q, 0)
        const product = await prisma.product.create({
            data: {
                ...rest,
                // keep in sync with TAX_RATE (src/lib/constants/index.ts) and the migration backfill
                priceAfterTax: Math.round(rest.price * 1.19 * 1000) / 1000,
                quantity: initial,
                fournisseurId: fournisseurs[f].id,
                qrcode: { create: { code: `SO-P${String(i + 1).padStart(4, '0')}` } },
            },
        })
        for (const a of adjustments) {
            await prisma.stockAdjustment.create({
                data: { productId: product.id, quantity: a.q, reason: a.reason, createdAt: day(a.d) },
            })
            await prisma.product.update({ where: { id: product.id }, data: { quantity: { increment: a.q } } })
        }
        products.push({ ...product, quantity: qty })
    }
    const lowCount = products.filter((p) => p.quantity > 0 && p.quantity <= 3).length
    const outCount = products.filter((p) => p.quantity === 0).length
    console.log(`   ✅ ${products.length} products (${lowCount} low stock, ${outCount} out of stock) — QR codes SO-P0001…`)

// ─── 8. Prescriptions ──────────────────────────────────────────────────
console.log('── Prescriptions')
    const rxInput = [
        { c: 0, d: 0, date: -60, sphR: -2.25, cylR: -0.75, axR: 180, addR: 0, pdR: 32, sphL: -1.75, cylL: -0.5, axL: 175, addL: 0, pdL: 32 },
        { c: 1, d: 1, date: -120, sphR: 1.5, cylR: -1.25, axR: 90, addR: 2, pdR: 30, sphL: 1.75, cylL: -1, axL: 85, addL: 2, pdL: 30 },
        { c: 2, d: 0, date: -45, sphR: -3, cylR: -1.5, axR: 10, addR: 0, pdR: 33, sphL: -2.5, cylL: -1.25, axL: 5, addL: 0, pdL: 33 },
        { c: 1, d: 2, date: -15, sphR: 2, cylR: -0.5, axR: 80, addR: 2.25, pdR: 30, sphL: 2.25, cylL: -0.75, axL: 95, addL: 2.25, pdL: 30 },
        { c: 3, d: 1, date: -90, sphR: -4.5, cylR: -1, axR: 15, addR: 0, pdR: 31, sphL: -4, cylL: -0.75, axL: 170, addL: 0, pdL: 31 },
        { c: 4, d: 3, date: -200, sphR: -1, cylR: 0, axR: 0, addR: 1.5, pdR: 33, sphL: -1.25, cylL: 0, axL: 0, addL: 1.5, pdL: 33 },
        { c: 6, d: 0, date: -30, sphR: -0.75, cylR: -2.5, axR: 160, addR: 2.75, pdR: 31, sphL: -0.5, cylL: -2.25, axL: 20, addL: 2.75, pdL: 31 },
        { c: 7, d: 2, date: -180, sphR: -5.5, cylR: -0.25, axR: 45, addR: 0, pdR: 30, sphL: -6, cylL: -0.5, axL: 135, addL: 0, pdL: 30 },
        { c: 9, d: 4, date: -75, sphR: 0.5, cylR: -1.75, axR: 20, addR: 2.5, pdR: 32, sphL: 0.25, cylL: -2, axL: 160, addL: 2.5, pdL: 32 },
        { c: 11, d: 3, date: -10, sphR: -2, cylR: -1, axR: 5, addR: 0, pdR: 33, sphL: -2.25, cylL: -0.75, axL: 175, addL: 0, pdL: 33 },
        { c: 12, d: 1, date: -14, sphR: -1.25, cylR: -0.5, axR: 170, addR: 1.75, pdR: 31, sphL: -1, cylL: -0.5, axL: 10, addL: 1.75, pdL: 31 },
        { c: 0, d: 0, date: -3, sphR: -2.5, cylR: -0.75, axR: 180, addR: 0, pdR: 32, sphL: -2, cylL: -0.5, axL: 175, addL: 0, pdL: 32 },
    ]
    const rxs = []
    for (const r of rxInput) {
        rxs.push(await prisma.prescription.create({
            data: {
                clientId: clients[r.c].id,
                doctorId: doctors[r.d].id,
                sphRight: r.sphR, cylRight: r.cylR, axisRight: r.axR, addRight: r.addR, pdRight: r.pdR,
                sphLeft: r.sphL, cylLeft: r.cylL, axisLeft: r.axL, addLeft: r.addL, pdLeft: r.pdL,
                dateWritten: day(r.date),
                createdAt: day(r.date),
            },
        }))
    }
    console.log(`   ✅ ${rxs.length} prescriptions`)

    // ─── 9. Lens blanks ───────────────────────────────────────────────────
    // All stock movements (purchased / used_in_mounting / broken / used_in_repair)
    // live in ONE ledger applied after invoices & work orders exist, so final
    // quantities always reconcile:  final = initial + Σ ledger
    console.log('── Lens blanks')
    const blankAdjustments = [
        // purchased — tied to purchase invoices
        { kind: 'purchased', b: 0, q: 20, inv: 3 },
        { kind: 'purchased', b: 1, q: 10, inv: 3 },
        { kind: 'purchased', b: 3, q: 15, inv: 3 },
        { kind: 'purchased', b: 2, q: 5, inv: 4 },
        { kind: 'purchased', b: 5, q: 3, inv: 4 },
        { kind: 'purchased', b: 7, q: 10, inv: 4 },
        { kind: 'purchased', b: 4, q: 12, inv: 5 },
        { kind: 'purchased', b: 6, q: 8, inv: 5 },
        // consumed / broken — tied to work orders
        { kind: 'used_in_mounting', b: 0, q: -2, wo: 'wo2' },
        { kind: 'used_in_mounting', b: 3, q: -2, wo: 'wo3' },
        { kind: 'used_in_mounting', b: 4, q: -2, wo: 'wo4' },
        { kind: 'used_in_mounting', b: 5, q: -2, wo: 'wo5' },
        { kind: 'broken_during_mounting', b: 2, q: -1, wo: 'wo3' },
        { kind: 'broken_during_mounting', b: 5, q: -1, wo: 'wo5' },
        { kind: 'used_in_repair', b: 10, q: -1, wo: 'wo5' },
    ]
    const blanksInput = [
        { brand: 'Essilor', lensType: 'singleVision', material: 'cr39', coating: 'ar', thickness: '1.50', sph: -2, cyl: -0.75, cost: 18, sell: 45, qty: 28, f: 2 },
        { brand: 'Essilor', lensType: 'progressive', material: 'highIndex', coating: 'arScratch', thickness: '1.60', sph: -3.5, cyl: -1.5, cost: 55, sell: 120, qty: 14, f: 2 },
        { brand: 'Essilor', lensType: 'progressive', material: 'highIndex', coating: 'arBlueBlock', thickness: '1.67', sph: -4, cyl: -2, cost: 85, sell: 180, qty: 8, f: 2 },
        { brand: 'Zeiss', lensType: 'singleVision', material: 'polycarbonate', coating: 'scratchResistant', thickness: '1.59', sph: -1.5, cyl: -0.5, cost: 22, sell: 55, qty: 24, f: 2 },
        { brand: 'Zeiss', lensType: 'photochromic', material: 'polycarbonate', coating: 'blueBlock', thickness: '1.59', sph: -2.5, cyl: -1, cost: 40, sell: 95, qty: 12, f: 2 },
        { brand: 'Hoya', lensType: 'progressive', material: 'highIndex', coating: 'arScratch', thickness: '1.70', sph: -6, cyl: -2.5, cost: 95, sell: 200, qty: 2, f: 2 },
        { brand: 'Hoya', lensType: 'bifocal', material: 'cr39', coating: 'ar', thickness: '1.50', sph: -1, cyl: -0.75, cost: 20, sell: 50, qty: 18, f: 2 },
        { brand: 'Essilor', lensType: 'office', material: 'cr39', coating: 'blueBlock', thickness: '1.50', sph: -2, cyl: -1, cost: 28, sell: 65, qty: 20, f: 2 },
        { brand: 'Rodenstock', lensType: 'singleVision', material: 'trivex', coating: 'arScratch', thickness: '1.53', sph: -3, cyl: -1.25, cost: 35, sell: 80, qty: 10, f: 2 },
        { brand: 'Shamir', lensType: 'progressive', material: 'highIndex', coating: 'arBlueBlock', thickness: '1.60', sph: -5, cyl: -2, cost: 60, sell: 140, qty: 7, f: 2 },
        { brand: 'Nikon', lensType: 'singleVision', material: 'cr39', coating: 'ar', thickness: '1.50', sph: -1, cyl: -0.25, cost: 15, sell: 38, qty: 30, f: 5 },
        { brand: 'Nikon', lensType: 'progressive', material: 'highIndex', coating: 'arBlueBlock', thickness: '1.67', sph: -4.5, cyl: -1.75, cost: 75, sell: 160, qty: 2, f: 5 },
        { brand: 'Essilor', lensType: 'singleVision', material: 'cr39', coating: 'ar', thickness: '1.50', sph: 2, cyl: 0.5, cost: 18, sell: 45, qty: 22, f: 2 },
        { brand: 'Zeiss', lensType: 'office', material: 'polycarbonate', coating: 'blueBlock', thickness: '1.60', sph: 0.5, cyl: -0.5, cost: 32, sell: 75, qty: 9, f: 2 },
    ]
    const blanks = []
    for (const [bi, b] of blanksInput.entries()) {
        const moved = blankAdjustments.filter((a) => a.b === bi)
        const initial = b.qty - moved.reduce((s, a) => s + a.q, 0)
        const blank = await prisma.lensBlank.create({
            data: {
                brand: b.brand, lensType: b.lensType, material: b.material, coating: b.coating,
                thickness: b.thickness, sph: b.sph, cyl: b.cyl,
                costPrice: b.cost, sellingPrice: b.sell,
                // keep in sync with TAX_RATE (src/lib/constants/index.ts) and the migration backfill
                priceAfterTax: Math.round(b.sell * 1.19 * 1000) / 1000,
                quantity: initial,
                fournisseurId: fournisseurs[b.f].id,
            },
        })
        blanks.push(blank)
    }
    console.log(`   ✅ ${blanks.length} lens blanks (history applied after invoices)`)

    // ─── 10. Orders (client side) ─────────────────────────────────────────
    //  items reference product indexes; prices = product selling prices
    console.log('── Orders')
    const chequeDefs = {
        clientCashed: { number: 'CHQ-CL-001', type: 'standard', bankName: 'BIAT', status: 'cashed', entityType: 'client_payment' },
        clientPending: { number: 'CHQ-CL-002', type: 'standard', bankName: 'STB', status: 'pending', entityType: 'client_payment' },
        clientBounced: { number: 'CHQ-CL-003', type: 'standard', bankName: 'BIAT', status: 'bounced', entityType: 'client_payment' },
        supPaid: { number: 'CHQ-SUP-001', type: 'standard', bankName: 'Amen Bank', status: 'paid', entityType: 'supplier_payment' },
        supTraite: { number: 'TRT-SUP-001', type: 'traite', bankName: 'UIB', status: 'pending', entityType: 'supplier_payment' },
    }
    const cheques = {}
    for (const [k, c] of Object.entries(chequeDefs)) {
        cheques[k] = await prisma.cheque.create({ data: { ...c, amount: 0, dueDate: day(0) } })
    }

    const ordersDef = [
        // #1001 — old completed, deposit + balance, 2 items
        { n: 1001, c: 0, type: 'standard', status: 'completed', created: -135, t: 7, rx: 0,
            items: [{ p: 0, q: 1 }, { p: 11, q: 1 }],
            pays: [{ amt: 230, type: 'deposit', method: 'cash', d: -135 }, { amt: 230, type: 'balance', method: 'card', d: -128 }] },
        // #1002 — paid in full by cheque (cashed)
        { n: 1002, c: 1, type: 'standard', status: 'completed', created: -120, t: 5, rx: 1,
            items: [{ p: 3, q: 1 }],
            pays: [{ amt: 520, type: 'full', method: 'cheque', d: -120, cheque: 'clientCashed', due: -90 }] },
        // #1003 — recent pending, partial cash deposit
        { n: 1003, c: 2, type: 'standard', status: 'pending', created: -12, t: 10, rx: 2,
            items: [{ p: 2, q: 1 }, { p: 11, q: 1 }],
            pays: [{ amt: 200, type: 'deposit', method: 'cash', d: -12 }] },
        // #1004 — remounting with repairs (work order pending)
        { n: 1004, c: 3, type: 'remounting', status: 'pending', created: -7, t: 7, rx: 4,
            items: [{ p: 17, q: 1 }],
            pays: [{ amt: 100, type: 'deposit', method: 'cash', d: -7 }],
            repairs: [{ s: 0, price: 60 }, { s: 3, price: 15 }], woStatus: 'pending' },
        // #1005 — big completed basket paid by card
        { n: 1005, c: 4, type: 'standard', status: 'completed', created: -95, t: 14, rx: 5,
            items: [{ p: 1, q: 1 }, { p: 15, q: 1 }, { p: 20, q: 1 }, { p: 22, q: 1 }, { p: 21, q: 2 }],
            pays: [{ amt: 554, type: 'full', method: 'card', d: -81 }] },
        // #1006 — UNPAID pending order (no payments at all)
        { n: 1006, c: 5, type: 'standard', status: 'pending', created: -5, t: 10, rx: null,
            items: [{ p: 4, q: 1 }, { p: 6, q: 1 }], pays: [] },
        // #1007 — small direct sale, cash
        { n: 1007, c: 6, type: 'direct_sale', status: 'completed', created: -60, t: null, rx: null,
            items: [{ p: 20, q: 1 }, { p: 21, q: 1 }, { p: 22, q: 1 }],
            pays: [{ amt: 62, type: 'full', method: 'cash', d: -60 }] },
        // #1008 — ready for pickup (SMS reminder scenario)
        { n: 1008, c: 7, type: 'standard', status: 'ready', created: -3, t: 3, rx: 7,
            items: [{ p: 5, q: 1 }, { p: 14, q: 1 }],
            pays: [{ amt: 250, type: 'deposit', method: 'cash', d: -3 }] },
        // #1009 — cancelled with non-refunded deposit
        { n: 1009, c: 8, type: 'standard', status: 'cancelled', created: -45, t: null, rx: null,
            items: [{ p: 0, q: 1 }, { p: 11, q: 1 }],
            pays: [{ amt: 100, type: 'deposit', method: 'cash', d: -45 }] },
        // #1010 — remounting ready, balance by PENDING cheque (due in 5 days → notification)
        { n: 1010, c: 9, type: 'remounting', status: 'ready', created: -4, t: 5, rx: 8,
            items: [{ p: 13, q: 1 }],
            pays: [{ amt: 200, type: 'deposit', method: 'cheque', d: -4, cheque: 'clientPending', due: 5 }],
            repairs: [{ s: 0, price: 60 }, { s: 1, price: 35 }], woStatus: 'in_progress', woStarted: -3 },
        // #1011 — direct sale paid by card
        { n: 1011, c: 10, type: 'direct_sale', status: 'completed', created: -35, t: null, rx: null,
            items: [{ p: 6, q: 2 }, { p: 9, q: 1 }],
            pays: [{ amt: 240, type: 'full', method: 'card', d: -35 }] },
        // #1012 — pending, deposit paid
        { n: 1012, c: 11, type: 'standard', status: 'pending', created: -2, t: 10, rx: 9,
            items: [{ p: 3, q: 1 }, { p: 26, q: 1 }],
            pays: [{ amt: 150, type: 'deposit', method: 'cash', d: -2 }] },
        // #1013 — completed remounting whose cheque BOUNCED (balance still owed)
        { n: 1013, c: 12, type: 'remounting', status: 'completed', created: -21, t: 6, rx: 10,
            items: [{ p: 17, q: 1 }],
            pays: [{ amt: 100, type: 'full', method: 'cheque', d: -21, cheque: 'clientBounced', due: -7 }],
            repairs: [{ s: 2, price: 25 }], woStatus: 'completed', woStarted: -20, woCompleted: -15 },
        // #1014 — direct sale including a LENS BLANK line item
        { n: 1014, c: 13, type: 'direct_sale', status: 'completed', created: -1, t: null, rx: null,
            items: [{ blank: 0, q: 2, price: 45, name: 'Verre Essilor 1.50 SV -2.00/-0.75' }, { p: 23, q: 1 }],
            pays: [{ amt: 98, type: 'full', method: 'cash', d: -1 }] },
    ]

    const orders = []
    for (const o of ordersDef) {
        const totalItems = o.items.reduce((s, it) => {
            const price = it.price ?? Number(products[it.p].price)
            return s + price * it.q
        }, 0)
        const totalRepairs = (o.repairs || []).reduce((s, r) => s + r.price, 0)
        const total = totalItems + totalRepairs
        const created = day(o.created)

        // patch cheque amounts/due dates on first use
        for (const p of o.pays) {
            if (p.cheque) {
                await prisma.cheque.update({
                    where: { id: cheques[p.cheque].id },
                    data: { amount: p.amt, dueDate: day(p.due ?? 30), issueDate: created },
                })
            }
        }

        const order = await prisma.order.create({
            data: {
                orderNumber: o.n,
                clientId: clients[o.c].id,
                totalAmount: total,
                orderType: o.type,
                status: o.status,
                turnaroundDays: o.t,
                prescriptionId: o.rx !== null ? rxs[o.rx].id : null,
                createdAt: created,
                updatedAt: created,
                items: {
                    create: o.items.map((it) => ({
                        productId: it.p !== undefined ? products[it.p].id : null,
                        lensBlankId: it.blank !== undefined ? blanks[it.blank].id : null,
                        name: it.name ?? (it.p !== undefined ? products[it.p].name : null),
                        quantity: it.q,
                        unitPrice: it.price ?? products[it.p].price,
                    })),
                },
                payments: {
                    create: o.pays.map((p) => ({
                        amount: p.amt,
                        type: p.type,
                        method: p.method,
                        dueDate: p.due !== undefined ? day(p.due) : null,
                        chequeId: p.cheque ? cheques[p.cheque].id : null,
                        createdAt: day(p.d),
                    })),
                },
                workOrders: o.repairs ? {
                    create: {
                        source: 'internal',
                        status: o.woStatus,
                        servicePrice: totalRepairs,
                        paymentStatus: o.woStatus === 'completed' || o.woStatus === 'in_progress' ? 'paid' : 'pending',
                        amountPaid: o.woStatus === 'completed' || o.woStatus === 'in_progress' ? totalRepairs : 0,
                        startedAt: o.woStarted !== undefined ? day(o.woStarted) : null,
                        completedAt: o.woCompleted !== undefined ? day(o.woCompleted) : null,
                        dueDate: day(o.created + (o.t ?? 7)),
                        expectedCompletionDate: day(o.created + (o.t ?? 7)),
                        workOrderServices: {
                            create: o.repairs.map((r) => ({ repairServiceId: repairServices[r.s].id, price: r.price })),
                        },
                    },
                } : undefined,
            },
            include: { workOrders: true },
        })
        orders.push(order)
    }
    console.log(`   ✅ ${orders.length} orders #1001–#${ordersDef[ordersDef.length - 1].n} (pending/ready/completed/cancelled, all payment methods)`)

// ─── 11. Optician (direct) work orders + prescriptions + bills ────────
console.log('── Optician work orders & bills')
    const shopRx = async (wo, r, prefs) => prisma.opticianShopPrescription.create({
        data: {
            opticianShopId: wo.opticianShopId, workOrderId: wo.id,
            sphRight: r.sphR, cylRight: r.cylR, axisRight: r.axR, addRight: r.addR, pdRight: r.pdR,
            sphLeft: r.sphL, cylLeft: r.cylL, axisLeft: r.axL, addLeft: r.addL, pdLeft: r.pdL,
            ...prefs,
        },
    })

    // WO1 — pending, prescription only (no blanks yet)
    const wo1 = await prisma.atelierWorkOrder.create({
        data: {
            opticianShopId: shops[0].id, source: 'optician', status: 'pending',
            servicePrice: 80, dueDate: day(3), expectedCompletionDate: day(3),
            workOrderServices: { create: [{ repairServiceId: repairServices[0].id, price: 80 }] },
        },
    })
    await shopRx(wo1, { sphR: -2.5, cylR: -1, axR: 175, addR: 2, pdR: 32, sphL: -2.25, cylL: -0.75, axL: 180, addL: 2, pdL: 32 }, { lensType: 'progressive', material: 'highIndex', coating: 'arBlueBlock' })

    // WO2 — in progress, blanks assigned from our stock, UNPAID bill
    const wo2 = await prisma.atelierWorkOrder.create({
        data: {
            opticianShopId: shops[1].id, source: 'optician', status: 'in_progress',
            lensBlankLeftId: blanks[0].id, lensBlankRightId: blanks[0].id, lensBlankPrice: 90,
            servicePrice: 80, dueDate: day(5), expectedCompletionDate: day(5), startedAt: day(-1),
            paymentStatus: 'pending',
            workOrderServices: { create: [{ repairServiceId: repairServices[0].id, price: 80 }] },
        },
    })
    await shopRx(wo2, { sphR: -3, cylR: -1.25, axR: 10, addR: 0, pdR: 33, sphL: -2.75, cylL: -1, axL: 5, addL: 0, pdL: 33 }, { thickness: '1.50', lensType: 'singleVision', material: 'cr39', coating: 'ar' })
    const bill2 = await prisma.opticianShopBill.create({
        data: {
            billNumber: 'FAC-VP-001', opticianShopId: shops[1].id, workOrderId: wo2.id,
            totalAmount: 170, paidAmount: 0, status: 'unpaid',
            items: {
                create: [
                    { description: 'Remontage complet', quantity: 1, unitPrice: 80, itemType: 'service' },
                    { description: 'Verres Essilor 1.50 SV', quantity: 2, unitPrice: 45, itemType: 'lens_blank', lensBlankId: blanks[0].id },
                ],
            },
        },
    })

    // WO3 — completed, bill PARTIALLY paid (cash)
    const wo3 = await prisma.atelierWorkOrder.create({
        data: {
            opticianShopId: shops[0].id, source: 'optician', status: 'completed',
            lensBlankLeftId: blanks[3].id, lensBlankRightId: blanks[3].id, lensBlankPrice: 110,
            servicePrice: 35, dueDate: day(-2), expectedCompletionDate: day(-2), startedAt: day(-4), completedAt: day(-2),
            paymentStatus: 'partial', amountPaid: 100,
            workOrderServices: { create: [{ repairServiceId: repairServices[1].id, price: 35 }] },
        },
    })
    const bill3 = await prisma.opticianShopBill.create({
        data: {
            billNumber: 'FAC-OM-001', opticianShopId: shops[0].id, workOrderId: wo3.id,
            totalAmount: 145, paidAmount: 100, status: 'partiallyPaid',
            items: {
                create: [
                    { description: 'Soudure de monture', quantity: 1, unitPrice: 35, itemType: 'service' },
                    { description: 'Verres Zeiss 1.59 SV', quantity: 2, unitPrice: 55, itemType: 'lens_blank', lensBlankId: blanks[3].id },
                ],
            },
        },
    })
    await prisma.opticianShopPayment.create({
        data: { billId: bill3.id, amount: 100, method: 'cash', paidAt: day(-2) },
    })

    // WO4 — delivered, bill PAID in cash
    const wo4 = await prisma.atelierWorkOrder.create({
        data: {
            opticianShopId: shops[1].id, source: 'optician', status: 'delivered',
            lensBlankLeftId: blanks[4].id, lensBlankRightId: blanks[4].id, lensBlankPrice: 190,
            servicePrice: 80, dueDate: day(-10), expectedCompletionDate: day(-10), startedAt: day(-12), completedAt: day(-10),
            paymentStatus: 'paid', amountPaid: 270,
            workOrderServices: { create: [{ repairServiceId: repairServices[0].id, price: 80 }] },
        },
    })
    const bill4 = await prisma.opticianShopBill.create({
        data: {
            billNumber: 'FAC-VP-002', opticianShopId: shops[1].id, workOrderId: wo4.id,
            totalAmount: 270, paidAmount: 270, status: 'paid',
            items: {
                create: [
                    { description: 'Remontage complet', quantity: 1, unitPrice: 80, itemType: 'service' },
                    { description: 'Verres Zeiss PhotoFusion', quantity: 2, unitPrice: 95, itemType: 'lens_blank', lensBlankId: blanks[4].id },
                ],
            },
        },
    })
    await prisma.opticianShopPayment.create({
        data: { billId: bill4.id, amount: 270, method: 'cash', paidAt: day(-10) },
    })

    // WO5 — delivered with BROKEN right lens + replacement
    const wo5 = await prisma.atelierWorkOrder.create({
        data: {
            opticianShopId: shops[1].id, source: 'optician', status: 'delivered',
            lensBlankLeftId: blanks[5].id, lensBlankRightId: blanks[5].id, lensBlankPrice: 200,
            brokenLensBlank: 'right', replacementRightId: blanks[10].id,
            servicePrice: 80, dueDate: day(-15), expectedCompletionDate: day(-15), startedAt: day(-17), completedAt: day(-15),
            paymentStatus: 'paid', amountPaid: 80,
            workOrderServices: { create: [{ repairServiceId: repairServices[0].id, price: 80 }] },
        },
    })

    // WO6 — cancelled
    await prisma.atelierWorkOrder.create({
        data: {
            opticianShopId: shops[2].id, source: 'optician', status: 'cancelled',
            servicePrice: 35, dueDate: day(-5), expectedCompletionDate: day(-5),
            workOrderServices: { create: [{ repairServiceId: repairServices[1].id, price: 35 }] },
        },
    })
    console.log('   ✅ 6 direct work orders (pending/in_progress/completed/delivered×2/cancelled, 1 breakage), 3 bills (unpaid/partial/paid)')

// ─── 12. Purchase invoices + supplier payments ────────────────────────
console.log('── Purchase invoices & supplier payments')
    const invoices = []
    const invDef = [
        { num: 'FAC-ODT-001', f: 0, entity: 'shop', d: -85, items: [{ p: 0, q: 5, price: 150 }, { p: 3, q: 3, price: 290 }, { p: 21, q: 20, price: 3.5 }] },
        { num: 'FAC-ODT-002', f: 0, entity: 'shop', d: -20, items: [{ p: 1, q: 5, price: 145 }, { p: 4, q: 2, price: 185 }] },
        { num: 'FAC-ELM-001', f: 1, entity: 'shop', d: -50, items: [{ p: 6, q: 10, price: 40 }, { p: 8, q: 15, price: 48 }] },
        { num: 'FAC-ET-001', f: 2, entity: 'atelier', d: -60, items: [{ b: 0, q: 20, price: 16 }, { b: 1, q: 10, price: 50 }, { b: 3, q: 15, price: 20 }] },
        { num: 'FAC-ET-002', f: 2, entity: 'atelier', d: -30, items: [{ b: 2, q: 5, price: 80 }, { b: 5, q: 3, price: 88 }, { b: 7, q: 10, price: 25 }] },
        { num: 'FAC-VHP-001', f: 4, entity: 'atelier', d: -25, items: [{ b: 4, q: 12, price: 40 }, { b: 6, q: 8, price: 20 }] },
    ]
    for (const inv of invDef) {
        const total = inv.items.reduce((s, it) => s + it.price * it.q, 0)
        const created = await prisma.purchaseInvoice.create({
            data: {
                invoiceNumber: inv.num,
                fournisseurId: fournisseurs[inv.f].id,
                entity: inv.entity,
                date: day(inv.d),
                totalAmount: total,
                paidAmount: 0,
                createdAt: day(inv.d),
                items: {
                    create: inv.items.map((it) => ({
                        productId: it.p !== undefined ? products[it.p].id : null,
                        lensBlankId: it.b !== undefined ? blanks[it.b].id : null,
                        quantity: it.q,
                        unitPrice: it.price,
                    })),
                },
            },
        })
        invoices.push(created)
    }

    // Apply the single lens-blank movement ledger (invoices + work orders exist now)
    const woRefs = { wo2, wo3, wo4, wo5 }
    for (const a of blankAdjustments) {
        await prisma.lensBlankAdjustment.create({
            data: {
                lensBlankId: blanks[a.b].id,
                quantity: a.q,
                reason: a.kind,
                ...(a.inv !== undefined ? { invoiceId: invoices[a.inv].id, createdAt: invoices[a.inv].date } : {}),
                ...(a.wo ? { workOrderId: woRefs[a.wo].id } : {}),
            },
        })
        await prisma.lensBlank.update({ where: { id: blanks[a.b].id }, data: { quantity: { increment: a.q } } })
    }

    // Payments: partial / paid / traite / unpaid
    const payHalf = Math.round(Number(invoices[0].totalAmount) / 2)
    await prisma.supplierPayment.create({ data: { purchaseInvoiceId: invoices[0].id, amount: payHalf, method: 'cash', paidAt: day(-70) } })
    await prisma.purchaseInvoice.update({ where: { id: invoices[0].id }, data: { paidAmount: payHalf } })

    await prisma.supplierPayment.create({ data: { purchaseInvoiceId: invoices[2].id, amount: Number(invoices[2].totalAmount), method: 'cash', paidAt: day(-45) } })
    await prisma.purchaseInvoice.update({ where: { id: invoices[2].id }, data: { paidAmount: Number(invoices[2].totalAmount) } })

    await prisma.cheque.update({ where: { id: cheques.supPaid.id }, data: { amount: Number(invoices[3].totalAmount), dueDate: day(-45), issueDate: day(-60) } })
    await prisma.supplierPayment.create({ data: { purchaseInvoiceId: invoices[3].id, amount: Number(invoices[3].totalAmount), method: 'cheque', chequeId: cheques.supPaid.id, paidAt: day(-55) } })
    await prisma.purchaseInvoice.update({ where: { id: invoices[3].id }, data: { paidAmount: Number(invoices[3].totalAmount) } })

    await prisma.cheque.update({ where: { id: cheques.supTraite.id }, data: { amount: Number(invoices[4].totalAmount), dueDate: day(30), issueDate: day(-30) } })
    await prisma.supplierPayment.create({ data: { purchaseInvoiceId: invoices[4].id, amount: Number(invoices[4].totalAmount), method: 'cheque', chequeId: cheques.supTraite.id, paidAt: day(-30) } })
    await prisma.purchaseInvoice.update({ where: { id: invoices[4].id }, data: { paidAmount: Number(invoices[4].totalAmount) } })
    // invoices[1] and invoices[5] remain unpaid
    console.log(`   ✅ ${invoices.length} purchase invoices (2 unpaid, 1 partial, traite due in 30d)`)
// ─── 13. Stock adjustments (product history) ──────────────────────────
// already applied per-product during creation in section 7
console.log('── Stock adjustments (applied during product creation)')

    // ─── 14. SMS logs ─────────────────────────────────────────────────────
    console.log('── SMS logs')
    const smsDefs = [
        { c: 7, d: -1, status: 'sent', msg: 'Votre commande #1008 est prête. Merci de passer la récupérer. — Sofien Optic' },
        { c: 9, d: -1, status: 'sent', msg: 'Votre commande #1010 est prête. Merci de passer la récupérer. — Sofien Optic' },
        { c: 0, d: -128, status: 'sent', msg: 'Votre commande #1001 est prête. Merci de passer la récupérer. — Sofien Optic' },
        { c: 4, d: -80, status: 'sent', msg: 'Rappel: votre commande #1005 vous attend en magasin. — Sofien Optic' },
        { c: 12, d: -15, status: 'sent', msg: 'Votre commande #1013 est prête. Merci de passer la récupérer. — Sofien Optic' },
        { c: 11, d: 0, status: 'failed', msg: 'Votre commande #1012 est en cours de préparation. — Sofien Optic' },
    ]
    for (const s of smsDefs) {
        await prisma.smsLog.create({
            data: { clientId: clients[s.c].id, phone: clients[s.c].phone, message: s.msg, status: s.status, createdAt: day(s.d) },
        })
    }
    console.log(`   ✅ ${smsDefs.length} SMS logs (1 failed)`)
    // ─── 15. Audit logs ───────────────────────────────────────────────────
    console.log('── Audit logs')
    const audit = [
        { u: 'admin', a: 'ADMIN_SETUP', e: 'USER', id: users.admin.id, md: { email: 'owner@sofien.tn' }, d: -200 },
        { u: 'admin', a: 'USER_LOGIN', e: 'USER', id: users.admin.id, md: { email: 'owner@sofien.tn' }, d: -30 },
        { u: 'shop', a: 'USER_LOGIN', e: 'USER', id: users.shop.id, md: { email: 'shop@sofien.tn' }, d: -30 },
        { u: 'atelier', a: 'USER_LOGIN', e: 'USER', id: users.atelier.id, md: { email: 'atelier@sofien.tn' }, d: -29 },
        { u: 'admin', a: 'CLIENT_CREATED', e: 'CLIENT', id: clients[0].id, md: { name: 'Ahmed', familyName: 'Ben Ali' }, d: -135 },
        { u: 'shop', a: 'CLIENT_CREATED', e: 'CLIENT', id: clients[1].id, md: { name: 'Fatma', familyName: 'Trabelsi' }, d: -130 },
        { u: 'admin', a: 'ORDER_CREATED', e: 'ORDER', id: orders[0].id, md: { orderNumber: 1001, totalAmount: 460, itemsCount: 2, orderType: 'standard' }, d: -135 },
        { u: 'shop', a: 'PAYMENT_ADDED', e: 'ORDER', id: orders[0].id, md: { paymentsCount: 2 }, d: -128 },
        { u: 'atelier', a: 'ORDER_COMPLETED', e: 'ORDER', id: orders[0].id, md: null, d: -127 },
        { u: 'admin', a: 'ORDER_CREATED', e: 'ORDER', id: orders[1].id, md: { orderNumber: 1002, totalAmount: 520, itemsCount: 1, orderType: 'standard' }, d: -120 },
        { u: 'admin', a: 'PRODUCT_CREATED', e: 'PRODUCT', id: products[0].id, md: { name: 'Ray-Ban Aviator', quantity: 3 }, d: -90 },
        { u: 'admin', a: 'PRODUCT_CREATED', e: 'PRODUCT', id: products[12].id, md: { name: 'Stellify FreeForm', quantity: 3 }, d: -88 },
        { u: 'atelier', a: 'REPAIR_CREATED', e: 'REPAIR', id: orders[9].workOrders[0]?.id ?? null, md: { lensSource: 'stock' }, d: -4 },
        { u: 'atelier', a: 'REPAIR_CREATED', e: 'REPAIR', id: orders[3].workOrders[0]?.id ?? null, md: { lensSource: 'none' }, d: -7 },
        { u: 'atelier', a: 'REPAIR_COMPLETED', e: 'REPAIR', id: orders[12].workOrders[0]?.id ?? null, md: null, d: -15 },
        { u: 'shop', a: 'ORDER_CREATED', e: 'ORDER', id: orders[7].id, md: { orderNumber: 1008, totalAmount: 450, itemsCount: 2, orderType: 'standard' }, d: -3 },
        { u: 'shop', a: 'ORDER_CREATED', e: 'ORDER', id: orders[12].id, md: { orderNumber: 1013, totalAmount: 165, itemsCount: 1, orderType: 'remounting' }, d: -21 },
        { u: 'admin', a: 'CLIENT_UPDATED', e: 'CLIENT', id: clients[6].id, md: { notes: 'Verres progressifs depuis 2019' }, d: -25 },
        { u: 'admin', a: 'PRODUCT_UPDATED', e: 'PRODUCT', id: products[4].id, md: null, d: -20 },
        { u: 'admin', a: 'ORDER_CREATED', e: 'ORDER', id: orders[8].id, md: { orderNumber: 1009, totalAmount: 460, itemsCount: 2, orderType: 'standard' }, d: -45 },
        { u: 'admin', a: 'ORDER_CANCELLED', e: 'ORDER', id: orders[8].id, md: null, d: -40 },
        { u: 'shop', a: 'CLIENT_DELETED', e: 'CLIENT', id: null, md: { phone: '99000001' }, d: -10 },
        { u: 'atelier', a: 'USER_LOGOUT', e: 'USER', id: users.atelier.id, md: null, d: -1 },
        { u: 'admin', a: 'USER_LOGIN', e: 'USER', id: users.admin.id, md: { email: 'owner@sofien.tn' }, d: 0 },
    ]
    for (const a of audit) {
        await prisma.auditLog.create({
            data: {
                userId: a.u ? users[a.u].id : null,
                action: a.a,
                entityType: a.e,
                entityId: a.id,
                metadata: JSON.stringify(a.md || {}),
                createdAt: day(a.d, 9 + (a.d % 8), 15),
            },
        })
    }
    console.log(`   ✅ ${audit.length} audit log entries`)
    // ─── Summary ──────────────────────────────────────────────────────────
    const counts = {        users: await prisma.user.count(),
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
        workOrders: await prisma.atelierWorkOrder.count(),
        opticianBills: await prisma.opticianShopBill.count(),
        purchaseInvoices: await prisma.purchaseInvoice.count(),
        supplierPayments: await prisma.supplierPayment.count(),
        lensBlankAdjustments: await prisma.lensBlankAdjustment.count(),
        stockAdjustments: await prisma.stockAdjustment.count(),
        smsLogs: await prisma.smsLog.count(),
        auditLogs: await prisma.auditLog.count(),
    }
    console.log('\n📊 Database summary:')
    for (const [k, v] of Object.entries(counts)) {
        console.log(`   ${k.padEnd(22)} ${v}`)
    }
    console.log(`
🎉 Seed complete — fresh test data ready!

🔑 Logins:
   Admin:   owner@sofien.tn   / admin123
   Shop:    shop@sofien.tn    / shop123
   Atelier: atelier@sofien.tn / atelier123

🧪 Test scenarios baked in:
   • Orders #1001–#1014: every status × type, deposits/balances/full, cash/card
   • Cheques: cashed (1002), PENDING due in 5 days → triggers notification (1010),
     BOUNCED with balance owed (1013)
   • Unpaid order #1006 · cancelled #1009 with deposit
   • Repairs: internal work orders pending (1004) / in_progress (1010) / completed (1013)
   • Optician work orders: all statuses + breakage with replacement + 3 bills
     (FAC-VP-001 unpaid, FAC-OM-001 partial, FAC-VP-002 paid)
   • Purchase invoices: unpaid (FAC-ODT-002, FAC-VHP-001), partial (FAC-ODT-001),
     paid cash/cheque, supplier traite TRT-SUP-001 due in 30 days
   • Stock: low-stock products (Oakley, Persol, Stellify, Hoya Nulux…),
     out-of-stock (Vogue), low-stock lens blanks (Hoya prog ×2, Nikon prog ×2)
   • Reports: orders spread over ~4.5 months so charts/trends have data`)
}

seed()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())