/**
 * seed-import.mjs — NON-destructive import of the real client & supplier CSVs
 * (clients_2026-09-10.csv / fournisseurs_2026-09-10.csv at the repo root)
 * into the dev database (prisma/db/dev.db).
 *
 * Run:  node prisma/seed-import.mjs
 *
 * Unlike prisma/seed.mjs (which WIPES the database first), this script only
 * UPSERTS: existing rows are merged/updated in place, nothing is deleted.
 * Safe to run repeatedly — same input produces no duplicates.
 *
 * Matching keys:
 *   - Client      → phone (unique in the schema)
 *   - Fournisseur → name  (phone is NOT unique in the schema)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLIENTS_CSV = path.join(ROOT, 'clients_2026-09-10.csv')
const FOURNISSEURS_CSV = path.join(ROOT, 'fournisseurs_2026-09-10.csv')

// ─────────────────────────────────────────────────────────────────────────────
// CSV parsing — RFC-4180 style: comma-separated, double-quoted fields, escaped
// quotes (""). Strips a UTF-8 BOM if present. Files here are UTF-8, no BOM.
// ─────────────────────────────────────────────────────────────────────────────
function parseCsv(text) {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
    const rows = []
    let row = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { cur += '"'; i++ }
                else inQuotes = false
            } else {
                cur += ch
            }
        } else if (ch === '"') {
            inQuotes = true
        } else if (ch === ',') {
            row.push(cur); cur = ''
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++
            row.push(cur); cur = ''
            if (row.length > 1 || row[0] !== '') rows.push(row)
            row = []
        } else {
            cur += ch
        }
    }
    if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row) }
    if (rows.length === 0) return []
    const header = rows[0].map((h) => h.trim())
    return rows.slice(1).map((r) => {
        const obj = {}
        header.forEach((h, i) => { obj[h] = (r[i] ?? '').trim() })
        return obj
    })
}

const readCsv = (file) => parseCsv(fs.readFileSync(file, 'utf8'))

// The real CSVs contain personal data and are GITIGNORED — they only exist on
// machines where they were placed manually. Fail with a clear message.
function requireCsv(file) {
    if (!fs.existsSync(file)) {
        console.error(`Missing ${path.basename(file)} at the repo root.`)
        console.error('These CSVs are gitignored (personal data) — copy them to the repo root to import, or use `node prisma/seed.mjs` for demo data.')
        process.exit(1)
    }
    return readCsv(file)
}

// ─────────────────────────────────────────────────────────────────────────────
// Field helpers
// ─────────────────────────────────────────────────────────────────────────────
const clean = (v) => {
    const s = (v ?? '').trim()
    return s === '' ? null : s
}

/** Phone digits only — Tunisian numbers are 8 digits, tolerate spaces/dashes. */
const cleanPhone = (v) => {
    const s = clean(v)
    if (!s) return { phone: null, error: 'missing phone' }
    const digits = s.replace(/[\s.\-()]/g, '')
    if (!/^\+?\d{8,15}$/.test(digits)) return { phone: null, error: `invalid phone "${s}"` }
    return { phone: digits, error: null }
}

const cleanGender = (v) => {
    const s = (clean(v) || '').toLowerCase()
    if (s === '') return { gender: null, error: null }
    if (s === 'male' || s === 'homme' || s === 'm') return { gender: 'male', error: null }
    if (s === 'female' || s === 'femme' || s === 'f') return { gender: 'female', error: null }
    return { gender: null, error: `unknown gender "${s}"` }
}

// ─────────────────────────────────────────────────────────────────────────────
// Import
// ─────────────────────────────────────────────────────────────────────────────
const summary = {
    clients: { inserted: 0, updated: 0, skipped: [] },
    fournisseurs: { inserted: 0, updated: 0, skipped: [] },
}

const skip = (group, line, row, reason) => {
    summary[group].skipped.push({ line, reason, row: `${row.name ?? ''} ${row.familyName ?? ''}`.trim() })
}

async function importClients() {
    const rows = requireCsv(CLIENTS_CSV)
    console.log(`── Clients: ${rows.length} rows in ${path.basename(CLIENTS_CSV)}`)

    // Guard against duplicate phone numbers inside the CSV itself.
    const seenPhones = new Map()
    for (const [i, row] of rows.entries()) {
        const line = i + 2 // 1-based, +1 for header
        const name = clean(row.name)
        const familyName = clean(row.familyName)
        if (!name || !familyName) { skip('clients', line, row, `missing ${!name ? 'name' : 'familyName'}`); continue }
        const { phone, error } = cleanPhone(row.phone)
        if (error) { skip('clients', line, row, error); continue }
        if (seenPhones.has(phone)) {
            skip('clients', line, row, `duplicate phone ${phone} (also on line ${seenPhones.get(phone)})`)
            continue
        }
        seenPhones.set(phone, line)

        const { gender, error: genderError } = cleanGender(row.gender)
        if (genderError) console.warn(`   ⚠ line ${line} ${name} ${familyName}: ${genderError} — stored as null`)

        const data = {
            name,
            familyName,
            phone,
            address: clean(row.address),
            gender,
            birthDate: clean(row.birthDate), // schema stores birthDate as String
            notes: clean(row.notes),
            organization: clean(row.organization),
        }

        const existing = await prisma.client.findUnique({ where: { phone } })
        if (existing) {
            await prisma.client.update({ where: { phone }, data })
            summary.clients.updated++
        } else {
            await prisma.client.create({ data })
            summary.clients.inserted++
        }
    }
}

// The CSV carries no entity column — assign shop/atelier by name, same
// mapping as prisma/seed.mjs. Unknown names default to 'shop' with a warning.
const FOURNISSEUR_ENTITIES = {
    'Accessoires Optiques Sfax': 'shop',
    'Essilor Tunisie': 'atelier',
    'EuroLens Méditerranée': 'shop',
    'Matériel Optique Bizerte': 'atelier',
    'Optique Distribution Tunis': 'shop',
    'Verres Haute Précision': 'atelier',
}

async function importFournisseurs() {
    const rows = requireCsv(FOURNISSEURS_CSV)
    console.log(`── Fournisseurs: ${rows.length} rows in ${path.basename(FOURNISSEURS_CSV)}`)

    const seenNames = new Map()
    for (const [i, row] of rows.entries()) {
        const line = i + 2
        const name = clean(row.name)
        if (!name) { skip('fournisseurs', line, row, 'missing name'); continue }
        const { phone, error } = cleanPhone(row.phone)
        if (error) { skip('fournisseurs', line, row, error); continue }

        const key = name.toLowerCase()
        if (seenNames.has(key)) {
            skip('fournisseurs', line, row, `duplicate name "${name}" (also on line ${seenNames.get(key)})`)
            continue
        }
        seenNames.set(key, line)

        const entity = FOURNISSEUR_ENTITIES[name] ?? 'shop'
        if (!FOURNISSEUR_ENTITIES[name]) {
            console.warn(`   ⚠ line ${line} "${name}": no entity mapping — defaulting to "shop"`)
        }

        const data = {
            name,
            phone,
            address: clean(row.address),
            email: clean(row.email),
            taxId: clean(row.taxId),
            entity,
        }

        // phone is not unique on Fournisseur — match on (case-insensitive) name
        const existing = await prisma.fournisseur.findFirst({ where: { name } })
        if (existing) {
            await prisma.fournisseur.update({ where: { id: existing.id }, data })
            summary.fournisseurs.updated++
        } else {
            await prisma.fournisseur.create({ data })
            summary.fournisseurs.inserted++
        }
    }
}

function printSummary() {
    console.log('\n════════ Import summary ════════')
    for (const [group, s] of Object.entries(summary)) {
        console.log(`${group}: ${s.inserted} inserted, ${s.updated} updated, ${s.skipped.length} skipped`)
        for (const sk of s.skipped) {
            console.log(`   ⚠ line ${sk.line} "${sk.row}": ${sk.reason}`)
        }
    }
}

async function main() {
    await importClients()
    await importFournisseurs()
    printSummary()
}

main()
    .catch((e) => {
        console.error('Import failed:', e)
        process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
