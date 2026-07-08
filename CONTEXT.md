# Sofien Optic — Technical Context

> **Last updated:** 2026-07-07  
> **Source of truth:** Codebase analysis (not the PRD document)  
> **Status:** Living document — updated on every architecture-relevant change

---

## 1. Project Overview

**Sofien Optic** is a single-user, browser-based Point-of-Sale and ERP system for a small optical shop in Tunisia. It replaces paper-based workflows with a purpose-built digital solution covering client management, prescriptions, inventory, orders, atelier (workshop) work orders, supplier invoicing, billing, and reporting.

**Key facts:**
- Owner-operated single store (Sofien)
- French-language primary UI, English supported via i18n
- Currency: Tunisian Dinar (TND), 3 decimal places
- Self-hosted on localhost LAN — not public internet
- SQLite database file stored on the machine running the server
- SPA-style navigation via Zustand (no URL routing for feature views)
- Three user roles: `admin`, `shop`, `atelier` (but currently single-user)

---

## 2. Architecture

### 2.1 High-Level Architecture

```
Browser (Next.js Client)
  ├── SPA View Router (Zustand useViewStore)
  ├── Feature Pages (18 views)
  ├── UI Component Library (shadcn/ui + Radix)
  └── API Client (fetch wrappers)

Next.js API Routes (/api/*)
  ├── Controllers (request parsing, response formatting)
  ├── Services (business logic, validation)
  ├── Repositories (thin Prisma wrappers)
  └── Mappers (DB → API response transformation)

Database (SQLite via Prisma ORM)
```

### 2.2 Folder Structure

```
solab/
├── prisma/
│   ├── schema.prisma          # 22 models, 13+ enums
│   ├── seed.ts                # Seed script
│   ├── db/                    # SQLite database file
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── api/               # 20 API route groups (35 routes)
│   │   ├── layout.tsx         # Root layout (Geist fonts, Sonner)
│   │   ├── page.tsx           # SPA entry point (view router)
│   │   ├── globals.css        # Tailwind v4 + CSS variables
│   │   └── login/             # Login page
│   ├── components/
│   │   ├── ui/                # 13 shadcn/ui components
│   │   └── layouts/           # AppShell, Header, Sidebar, MobileNav
│   ├── features/              # 21 feature modules
│   │   ├── auth/
│   │   ├── atelier-work-orders/
│   │   ├── billing/
│   │   ├── clients/
│   │   ├── dashboard/
│   │   ├── doctors/
│   │   ├── fournisseurs/
│   │   ├── import/
│   │   ├── lens-blanks/
│   │   ├── lens-brands/
│   │   ├── notifications/
│   │   ├── optician-shops/
│   │   ├── orders/
│   │   ├── prescriptions/
│   │   ├── purchase-invoices/
│   │   ├── qrcode/
│   │   ├── repair-services/
│   │   ├── repairs/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── stock/
│   ├── dtos/                  # 15 DTO directories (plain TS interfaces)
│   ├── mappers/               # 16 mapper files (DB → API response)
│   ├── errors/                # Custom error hierarchy
│   ├── middlewares/            # Error handler
│   ├── modules/               # Cross-cutting modules (audit)
│   ├── stores/                # 3 Zustand stores
│   ├── hooks/                 # useTranslation, useDebounce
│   ├── i18n/                  # eng.json, fr.json
│   ├── lib/
│   │   ├── api/               # auth.ts, client.ts, parse.ts, response.ts
│   │   ├── constants/         # Business constants
│   │   ├── database/          # db.ts, repositories/
│   │   ├── hooks/             # useTranslation, useDebounce
│   │   ├── services/          # sms.ts
│   │   └── utils/             # cn.ts, currency.ts
│   └── types/                 # Re-exported Prisma types
├── public/                    # Static assets (logo.png)
├── .env                       # DATABASE_URL, GROQ_API_KEY, GROQ_MODEL
├── package.json
├── tsconfig.json
└── next.config.ts
```

### 2.3 Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|---------------|
| **Route** | `src/app/api/*/route.ts` | Thin re-exports to controllers. HTTP concerns only. |
| **Controller** | `src/features/*/*.controller.ts` | Request parsing, body validation, response formatting via mappers. try/catch with `handleError()`. |
| **Service** | `src/features/*/*.service.ts` | Business logic, validation, orchestration, audit logging. |
| **Repository** | `src/lib/database/repositories/*.ts` | Thin Prisma pass-through wrappers. No query logic. |
| **Mapper** | `src/mappers/*.ts` | DB entity → API response DTO transformation. |
| **DTO** | `src/dtos/*/*.ts` | Plain TypeScript interfaces for API contracts. No runtime validation. |

### 2.4 Dependency Rules

- Routes → Controllers → Services → Repositories → Prisma Client (`db`)
- Services may bypass repositories and call `db` directly for transactions, aggregates, or cross-entity operations
- Mappers are called at the controller level, not in services
- DTOs are pure type definitions — no runtime code
- UI features call API client functions (`src/features/*/*.api.ts`) or raw `fetch()`

---

## 3. Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.9 |
| Language | TypeScript (strict mode) | 5.x |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) | 4.x |
| Component Library | shadcn/ui (Radix Nova style) | 4.12 |
| Icons | Lucide React | 1.21 |
| Animations | Framer Motion | 12.42 |
| Toasts | Sonner | 2.0 |
| State (global) | Zustand | 5.0 |
| Database | SQLite via Prisma ORM | 6.19 |
| Auth | jose (JWT HS256) + bcryptjs | 6.2 / 3.0 |
| QR Codes | qrcode (generation), html5-qrcode (scanning) | 1.5 / 2.3 |
| CSV | Custom parser (`src/lib/csv.ts`) | — |
| OCR | Groq API (Llama 4 Scout model) | External |
| Build | ESLint 9 (flat config) | 9.x |

---

## 4. Modules

### 4.1 Auth

- **Files:** `src/features/auth/auth.service.ts`, `auth.controller.ts`, `auth.api.ts`
- **Purpose:** User authentication, JWT lifecycle, admin setup, password management
- **Key methods:** `authenticateUser`, `setupAdmin`, `changePassword`, `createToken`, `verifyToken`
- **Token:** JWT HS256, 7-day expiry, signed with `JWT_SECRET` env (fallback: hardcoded string)
- **Storage:** HTTP-only cookie (`auth-token`) + localStorage (dual delivery, but Bearer header is primary)
- **Default admin:** `owner@sofien.tn` / `admin123` (created via `POST /api/auth/setup`)

### 4.2 Clients

- **Files:** `src/features/clients/client.service.ts`, `client.controller.ts`, `client.api.ts`, `client.schema.ts`
- **Purpose:** End-customer management
- **Key business rules:** Phone number uniqueness enforced at service level
- **Filters:** Search (name, familyName, phone), gender
- **Includes:** Related orders, prescriptions, smsLogs

### 4.3 Stock (Products)

- **Files:** `src/features/stock/stock.service.ts`, `stock.controller.ts`, `stock.api.ts`
- **Purpose:** Product inventory (frames, lenses, accessories, cleaning products)
- **Key business rules:**
  - Auto-generates QR codes on product creation (`SOPT-{timestamp}-{random}`)
  - Categories: `lunette`, `lentille`, `verre`, `accessory`, `nettoyant_lentilles`, `nettoyant_monture`
  - Low stock threshold: ≤3 units
  - Extensive optical parameter filtering (SPH, CYL, ADD ranges, lensType, material, coating, thickness)
- **Filters:** 14+ parameters (search, category, stockStatus, brand, lensType, material, coating, thickness, sphFrom/To, cylFrom/To, addFrom/To, fournisseurId)

### 4.4 Orders

- **Files:** `src/features/orders/order.service.ts`, `order.controller.ts`, `orders.api.ts`
- **Purpose:** Customer order lifecycle — the most complex module
- **Order types:** `standard` (full eyewear), `remounting` (client's frame + new lenses), `direct_sale` (quick sale)
- **Status flow:** `pending` → `ready` → `completed` | `cancelled` (at any stage)
- **Key business rules:**
  - Atomic order number generation via Prisma `$transaction`
  - Stock validation on creation (throws if insufficient)
  - Stock decrement on order creation, restoration on cancellation/deletion
  - `direct_sale` orders auto-complete and auto-pay in full (cash)
  - Payment tracking: deposit/balance/full types
  - Auto-complete when total paid ≥ total amount
  - Creates `StockAdjustment` records with reason `'sale'`
  - **Lens blank picker:** When a prescription is selected (standard/remounting), a filtered listing of matching lens blanks is shown with filters for thickness, lens type, material, coating. Blanks are matched by SPH/CYL range against both eyes (OR logic). Clicking "Add" adds the blank as an order item.

### 4.5 Repairs / Atelier Work Orders

- **Files:** `src/features/repairs/repair.service.ts`, `repair.controller.ts`
- **Purpose:** Workshop jobs (repairs from internal orders or external optician shops)
- **Status flow:** `pending` → `in_progress` → `completed` → `delivered` | `cancelled`
- **Key business rules:**
  - Dual source: `internal` (from orders) or `optician` (from partner shops)
  - Lens blank assignment (left/right eye)
  - Breakage tracking with replacement blank assignment
  - SMS notification on completion (currently disabled, logs to DB only)
  - Timestamps: `startedAt`, `completedAt`

### 4.6 Lens Blanks

- **Files:** `src/features/lens-blanks/lens-blank.service.ts`, `lens-blank.controller.ts`
- **Purpose:** Semi-finished lens blanks used by the atelier
- **Key business rules:**
  - Low stock threshold: ≤3 units
  - Stock adjustments with reasons (`purchased`, `used_in_mounting`, `used_in_repair`, `broken_during_mounting`)
  - Adjustment audit trail via `LensBlankAdjustment` records
  - **Prescription matching:** API supports `sphRight`, `cylRight`, `sphLeft`, `cylLeft` query params to filter blanks whose SPH/CYL ranges fit the prescription (OR logic — matches either eye)

### 4.7 Purchase Invoices

- **Files:** `src/features/purchase-invoices/purchase-invoice.service.ts`, `purchase-invoice.controller.ts`
- **Purpose:** Supplier invoices and payment tracking
- **Key business rules:**
  - Auto-generated invoice numbers: `FAC-{supplierAbbreviation}-{sequence}`
  - Payment methods: cash, cheque (creates `Cheque` record), traite/bill of exchange (creates `Traite` record), transfer
  - Entity-aware: `shop` vs `atelier` invoices
  - Payment status computed from `paidAmount` vs `totalAmount`

### 4.8 Billing

- **Files:** `src/features/billing/billing.service.ts`, `billing.controller.ts`, `billing.print.ts`
- **Purpose:** Customer-facing invoice/billing view (read-only projection of orders)
- **Key business rules:**
  - Payment status derived: `unpaid` / `partiallyPaid` / `fullyPaid`
  - Invoice printing via HTML template in new window
  - Period-based filtering (today, week, month, year, all)

### 4.9 Reports

- **Files:** `src/features/reports/report.service.ts`, `report.controller.ts`
- **Purpose:** Dashboard analytics and reporting
- **Shop reports:** Revenue, profit, cost, avg order value, new clients, outstanding balance, revenue by type, orders by status, top products by category, monthly revenue (12 months)
- **Atelier reports:** Lens blanks, work orders by status/shop, monthly work orders (12 months)

### 4.10 Dashboard

- **Files:** `src/features/dashboard/dashboardPage.tsx`
- **Purpose:** KPI overview + quick actions + ready orders
- **KPIs:** 6 cards with computed metrics
- **Quick actions:** New repairs, optician shops, orders

### 4.11 Prescriptions

- **Files:** `src/features/prescriptions/prescription.service.ts`, `PrescriptionForm.tsx`, `PrescriptionCards.tsx`
- **Purpose:** Optical prescription storage (SPH, CYL, AXIS, ADD, PD for both eyes)
- **Key business rules:**
  - Linked to a client and optionally a doctor
  - `dateWritten` parsed from YYYY-MM-DD string
  - Client-side filtering only (no server-side search)

### 4.12 Doctors

- **Files:** `src/features/doctors/doctor.service.ts`, `DoctorsPage.tsx`
- **Purpose:** Optometrist/ophthalmologist catalog
- **Key features:** Search by name/phone/specialization, patient count per doctor

### 4.13 Fournisseurs (Suppliers)

- **Files:** `src/features/fournisseurs/fournisseur.service.ts`, `FournisseursPage.tsx`
- **Purpose:** Product suppliers
- **Key features:** Entity-aware (shop/atelier), product count per supplier, linked products view

### 4.14 Optician Shops

- **Files:** `src/features/optician-shops/optician-shop.service.ts`, `OpticianShopsPage.tsx`
- **Purpose:** Partner optician shops (B2B customers for the atelier)

### 4.15 Lens Brands

- **Files:** `src/features/lens-brands/lens-brand.service.ts`
- **Purpose:** Lens manufacturer brand catalog (simple reference data)

### 4.16 Repair Services

- **Files:** `src/features/repair-services/repair-service.service.ts`
- **Purpose:** Catalog of repair service types with default pricing
- **Key business rules:** Cannot delete a service if any repair references it

### 4.17 QR Codes

- **Files:** `src/features/qrcode/qrcode.service.ts`, `QRCodePage.tsx`
- **Purpose:** QR code product lookup
- **Key features:** Lookup by code string, returns associated product with fournisseur

### 4.18 Notifications

- **Files:** `src/features/notifications/notification.service.ts`, `NotificationBell.tsx`
- **Purpose:** Aggregated alert feed
- **Alert types:** low_stock, pending_repair, ready_order, pending_payment (cheque), pending_payment (traite)

### 4.19 Import

- **Files:** `src/features/import/ImportPage.tsx`, `src/app/api/import/route.ts`
- **Purpose:** CSV import for clients and fournisseurs
- **Key features:** 4-step wizard (entity select → column mapping → preview with duplicate detection → import summary), auto-detect mapping with French/English column name aliases

### 4.20 Export

- **Files:** `src/app/api/export/[entity]/route.ts`, `src/components/ui/export-button.tsx`
- **Purpose:** CSV data export for clients, fournisseurs, products, orders
- **Key features:** Download as CSV file with Content-Disposition header

### 4.21 OCR Prescription

- **Files:** `src/app/api/ocr-prescription/route.ts`
- **Purpose:** Extract prescription data from images using Groq API (Llama 4 Scout)
- **Input:** Base64-encoded image
- **Output:** `{ od_sph, od_cyl, od_axis, os_sph, os_cyl, os_axis, add, pd }`

---

## 5. Business Rules

### Order Lifecycle
1. Order created → status `pending`, stock decremented
2. Work completes → status `ready`
3. Client picks up → status `completed`, payment finalized
4. Cancellation at any stage → stock restored

### Payment Rules
- Three payment types: `deposit`, `balance`, `full`
- Five payment methods: `cash`, `cheque`, `traite`, `card`, `transfer`
- Auto-complete when total paid ≥ total amount
- Cheque payments create a `Cheque` record with status tracking
- Traite (bill of exchange) payments create a `Traite` record

### Stock Rules
- Stock decremented on order creation
- Stock restored on order cancellation or deletion
- Low stock threshold: ≤3 units
- `StockAdjustment` records created for every stock change (audit trail)

### Atelier Work Orders
- Two sources: `internal` (from shop orders) or `optician` (from partner shops)
- Lens blank assignment (left/right eye)
- Breakage tracking: `none`, `left`, `right`, `both`
- Replacement blank assignment on breakage

### Supplier Invoices
- Invoice numbers: `FAC-{supplierAbbreviation}-{sequence}`
- Entity-aware: shop vs atelier
- Payment status: `unpaid` (paid=0), `partiallyPaid` (0 < paid < total), `fullyPaid` (paid ≥ total)

### Phone Number Uniqueness
- Client phone numbers must be unique (enforced at service level)
- Fournisseur phone numbers are not unique

---

## 6. Database

### 6.1 Entities (22 models)

| Model | Purpose |
|-------|---------|
| `User` | Auth accounts (email, password, role) |
| `Client` | End customers |
| `Doctor` | Optometrists/ophthalmologists |
| `Fournisseur` | Product suppliers |
| `OpticianShop` | Partner optician shops |
| `Prescription` | Optical prescriptions |
| `Product` | Inventory items |
| `QRCode` | Product QR codes |
| `Order` | Sales orders |
| `OrderItem` | Order line items |
| `Payment` | Client payments |
| `Cheque` | Cheque payment records |
| `Traite` | Bills of exchange |
| `PurchaseInvoice` | Supplier invoices |
| `PurchaseInvoiceItem` | Invoice line items |
| `SupplierPayment` | Payments to suppliers |
| `LensBlank` | Raw lens blanks for atelier |
| `LensBlankAdjustment` | Lens blank stock changes |
| `AtelierWorkOrder` | Workshop jobs |
| `RepairService` | Repair service catalog |
| `LensBrand` | Lens manufacturer brands |
| `StockAdjustment` | Product stock changes |
| `SmsLog` | SMS notification log |
| `AuditLog` | Activity audit trail |

### 6.2 Key Relationships

```
User ──has many──> Order, AtelierWorkOrder, StockAdjustment, SmsLog
Client ──has many──> Prescription, Order, SmsLog
Doctor ──has many──> Prescription
Fournisseur ──has many──> Product, PurchaseInvoice, LensBlank
OpticianShop ──has many──> AtelierWorkOrder
Prescription ──belongs to──> Client, Doctor
Product ──has one──> QRCode
Product ──has many──> OrderItem, StockAdjustment
Order ──has many──> OrderItem, Payment, AtelierWorkOrder
Order ──belongs to──> Client, User
Order ──optional──> Prescription
AtelierWorkOrder ──belongs to──> Order, OpticianShop, RepairService
AtelierWorkOrder ──optional──> LensBlank (left, right, replacement left, replacement right)
PurchaseInvoice ──belongs to──> Fournisseur
PurchaseInvoice ──has many──> PurchaseInvoiceItem, SupplierPayment, Traite, LensBlankAdjustment
Cheque ──has many──> Payment, SupplierPayment
Traite ──has many──> SupplierPayment
```

### 6.3 Enums (13+)

| Enum | Values |
|------|--------|
| `UserRole` | `admin`, `shop`, `atelier` |
| `Gender` | `female`, `male` |
| `OrderType` | `standard`, `remounting`, `direct_sale` |
| `OrderStatus` | `pending`, `ready`, `completed`, `cancelled` |
| `PaymentType` | `deposit`, `balance`, `full` |
| `PaymentMethod` | `cash`, `cheque`, `traite`, `card`, `transfer` |
| `ChequeStatus` | `pending`, `deposited`, `cashed`, `bounced` |
| `TraiteStatus` | `pending`, `paid`, `overdue`, `cancelled` |
| `ProductCategory` | `lunette`, `lentille`, `verre`, `accessory`, `nettoyant_lentilles`, `nettoyant_monture` |
| `LensType` | `singleVision`, `progressive`, `bifocal`, `office`, `photochromic` |
| `LensMaterial` | `cr39`, `polycarbonate`, `highIndex`, `trivex` |
| `LensCoating` | `none`, `ar`, `scratchResistant`, `blueBlock`, `arScratch`, `arBlueBlock` |
| `AtelierWorkOrderStatus` | `pending`, `in_progress`, `completed`, `delivered`, `cancelled` |
| `StockAdjustmentReason` | `restock`, `damage`, `adjustment`, `sale` |
| `LensBlankAdjustmentReason` | `purchased`, `used_in_mounting`, `used_in_repair`, `broken_during_mounting` |
| `SmsStatus` | `sent`, `failed` |

---

## 7. API

### 7.1 Complete Endpoint Map

| # | Endpoint | Methods | Purpose |
|---|----------|---------|---------|
| 1 | `/api/auth/login` | POST | Authenticate user, return JWT |
| 2 | `/api/auth/logout` | POST | Clear auth cookie |
| 3 | `/api/auth/setup` | POST | Create initial admin user |
| 4 | `/api/auth/change-password` | POST | Change password (requires auth) |
| 5 | `/api/clients` | GET, POST | List/create clients |
| 6 | `/api/clients/[id]` | GET, PATCH, DELETE | Read/update/delete client |
| 7 | `/api/orders` | GET, POST | List/create orders |
| 8 | `/api/orders/[id]` | GET, PATCH, DELETE | Read/update/delete order |
| 9 | `/api/prescriptions` | GET, POST | List/create prescriptions |
| 10 | `/api/prescriptions/[id]` | PATCH, DELETE | Update/delete prescription |
| 11 | `/api/stock` | GET, POST | List/create products |
| 12 | `/api/stock/[id]` | PATCH, DELETE | Update/delete product |
| 13 | `/api/billing` | GET | List billing records (orders with payments) |
| 14 | `/api/repairs` | GET, POST | List/create work orders |
| 15 | `/api/repairs/[id]` | GET, PATCH, DELETE | Read/update/delete work order |
| 16 | `/api/repair-services` | GET, POST | List/create repair services |
| 17 | `/api/repair-services/[id]` | PATCH, DELETE | Update/delete repair service |
| 18 | `/api/doctors` | GET, POST | List/create doctors |
| 19 | `/api/doctors/[id]` | PATCH, DELETE | Update/delete doctor |
| 20 | `/api/lens-brands` | GET, POST | List/create lens brands |
| 21 | `/api/lens-brands/[id]` | PATCH, DELETE | Update/delete lens brand |
| 22 | `/api/lens-blanks` | GET, POST | List/create lens blanks |
| 23 | `/api/lens-blanks/[id]` | PATCH, DELETE | Update/delete lens blank |
| 24 | `/api/fournisseurs` | GET, POST | List/create suppliers |
| 25 | `/api/fournisseurs/[id]` | PATCH, DELETE | Update/delete supplier |
| 26 | `/api/optician-shops` | GET, POST | List/create optician shops |
| 27 | `/api/optician-shops/[id]` | PATCH, DELETE | Update/delete optician shop |
| 28 | `/api/notifications` | GET | Get aggregated notifications |
| 29 | `/api/reports` | GET | Get analytics reports |
| 30 | `/api/qrcode` | GET | Lookup product by QR code |
| 31 | `/api/purchase-invoices` | GET, POST | List/create supplier invoices |
| 32 | `/api/purchase-invoices/[id]` | PATCH, DELETE | Update/delete supplier invoice |
| 33 | `/api/export/[entity]` | GET | Export CSV (clients/fournisseurs/products/orders) |
| 34 | `/api/import` | POST, PUT | Preview/confirm CSV import |
| 35 | `/api/ocr-prescription` | POST | Extract prescription from image |

**Total:** 35 route files, 58 HTTP method handlers

### 7.2 Action-Based PATCH Endpoints

Three resources use query params or body inspection to branch PATCH behavior:

- **Orders:** `{ status }` → status update, `{ payments }` → add payments
- **Repairs:** `?action=assign-lens-blanks`, `?action=declare-breakage`, default → status update
- **Lens blanks:** `?action=adjust-stock` → stock adjustment, default → update fields
- **Purchase invoices:** `?action=add-payment` → add payment

---

## 8. Security

### 8.1 Authentication

- JWT HS256 via `jose` library
- 7-day expiry, no refresh token
- Dual delivery: HTTP-only cookie + localStorage Bearer header
- Bearer header is the primary auth mechanism for API calls
- Passwords hashed with bcryptjs (10 rounds)

### 8.2 Authorization

- Three roles: `admin`, `shop`, `atelier`
- Role-based nav filtering in Sidebar and MobileNav
- `requireRole()` guard exists but is **not used** by most API routes
- `getAuthenticatedUser()` exists but only used in `changePassword` endpoint
- **Most API endpoints are unprotected** — no route-level auth middleware

### 8.3 Security Concerns

| Issue | Severity | Location |
|-------|----------|----------|
| Hardcoded JWT secret fallback | High | `src/lib/constants/index.ts` |
| Hardcoded admin password `admin123` | Medium | `src/features/auth/auth.service.ts` |
| No server-side token revocation | Medium | Auth system (JWT is stateless) |
| Most API routes unprotected | High | No auth middleware on routes |
| No rate limiting on login | Medium | `POST /api/auth/login` |
| No Next.js middleware.ts | Medium | No global request interception |

---

## 9. Logging & Audit

### 9.1 Logger

- `src/lib/logger.ts` — JSON-formatted log entries
- Levels: `info`, `warn`, `error`, `debug`
- Debug only in non-production
- Output: `{ timestamp, level, message, context }`

### 9.2 Audit Trail

- `src/modules/audit/audit.service.ts` — fire-and-forget audit logging
- Writes to `AuditLog` table: `userId`, `action`, `entityType`, `entityId`, `metadata` (JSON)
- Logged actions: USER_LOGIN, USER_LOGOUT, ADMIN_SETUP, PASSWORD_CHANGED, CRUD operations on clients, stock, orders, repairs
- Audit failures are caught and logged — they never crash the application

### 9.3 SMS Logging

- `src/lib/services/sms.ts` — currently disabled (`enabled: false`)
- Creates `SmsLog` records in DB but does not send real SMS
- `sendRepairReadySms()` called on work order completion

---

## 10. DTOs & Mapping

### 10.1 DTO Pattern

- Plain TypeScript interfaces (no Zod, no runtime validation)
- Separate `Create*Input`, `Update*Input`, `*Response` interfaces per domain
- Validation is done at the service level (manual checks or Zod schemas for clients, stock, prescriptions)

### 10.2 Mapper Pattern

- Unidirectional: DB entity → API response (no reverse mapping)
- Key transformations:
  - **Decimal → String** for monetary values (`.toFixed(3)` for TND)
  - **Decimal → Number** for stock prices, repair service prices
  - **Computed fields:** `paymentStatus`, `balance`, `source` (derived from `opticianShopId`)
  - **Relation renaming:** `workOrders` → `repairs`
  - **Password stripping:** Auth mapper removes password from response
  - **Count defaults:** `_count.prescriptions ?? 0`

### 10.3 Currency

- All monetary values serialized as strings with 3 decimal places
- `formatCurrency()` utility: `"X dt"` format (Tunisian dinar)

---

## 11. Transactions

| Location | Transaction | Why |
|----------|------------|-----|
| `order.service.ts` — `createOrder` | `db.$transaction` | Atomic order number generation + stock decrement |
| `order.service.ts` — `deleteOrder` | Sequential operations | Stock restoration before deletion |
| `purchase-invoice.service.ts` — `createPurchaseInvoice` | Nested creates | Invoice + items + payments + cheques/traites in one operation |

**Note:** Most operations are NOT wrapped in transactions. Single-entity CRUD operations rely on Prisma's default behavior.

---

## 12. Coding Conventions

### 12.1 Architectural Rules

1. **Feature-based organization** — each domain is a self-contained directory under `src/features/`
2. **Controller → Service → Repository** layering — never call Prisma directly from controllers
3. **Mappers at the controller boundary** — transform DB entities before sending responses
4. **DTOs are types only** — no runtime code in `src/dtos/`
5. **Services throw typed errors** — use `BadRequestError`, `NotFoundError`, etc. from `@/errors`
6. **Audit logging for mutations** — all CRUD operations should log to `auditService`
7. **SPA navigation via Zustand** — no URL routing for feature views

### 12.2 Code Style

- `'use client'` directive on all feature page components
- `useTranslation()` for all user-facing text
- `sonner` toast for success/error feedback
- `useDebounce()` (300ms) for search inputs
- Loading spinners with `Loader2` icon
- Three-state empty UI: loading → empty → no-results
- `cn()` utility for conditional class merging
- Consistent Card/Badge/Button patterns from shadcn/ui

### 12.3 Naming Conventions

- Files: `kebab-case` (e.g., `order.service.ts`, `client.mapper.ts`)
- Components: `PascalCase` (e.g., `OrdersPage.tsx`, `OrderForm.tsx`)
- Services: `*.service.ts` (singleton objects with methods)
- Controllers: `*.controller.ts` (exported HTTP method functions)
- DTOs: `*.dto.ts` (interfaces)
- Mappers: `*.mapper.ts` (pure functions)
- Repositories: `*.repository.ts` (thin Prisma wrappers)
- i18n keys: dot notation (`orders.type_standard`, `common.save`)

---

## 13. Current Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **SQLite** | Simple deployment, single-user, no external DB server needed |
| **Zustand for SPA nav** | Avoids URL routing complexity, keeps all views on single page |
| **shadcn/ui** | Customizable, Radix-based, Tailwind-native, no runtime dependency |
| **Repository pattern (thin)** | Abstraction seam for potential future DB replacement, but currently adds indirection without value |
| **Mapper layer** | Clean API boundary, handles Decimal→String conversion, computed fields |
| **Dual token delivery** | Cookie set for potential SSR use, Bearer header used by client |
| **Fire-and-forget audit** | Audit failures don't block user operations |
| **No React Query/SWR** | Simpler mental model, but loses caching, deduplication, optimistic updates |
| **Custom i18n** | No framework dependency, simple key-value lookup, but limited features |

---

## 14. Known Technical Debt

| Issue | Impact | Location |
|-------|--------|----------|
| **No route-level auth** | Security risk — most endpoints unprotected | All API routes |
| **Hardcoded JWT secret** | Security risk if env var not set | `src/lib/constants/index.ts` |
| **Thin repositories add no value** | Extra indirection without query encapsulation | `src/lib/database/repositories/` |
| **No data caching** | Every page re-fetches on mount, no stale-while-revalidate | All feature pages |
| **No pagination** | All lists load all records — degrades with data growth | All list pages |
| **No form library** | Raw controlled inputs, no validation framework | All forms |
| **Mixed API patterns** | Some pages use API modules, others use raw `fetch()` | Various features |
| **SMS is a no-op stub** | No real SMS integration | `src/lib/services/sms.ts` |
| **`requireRole` is dead code** | Defined but never used | `src/lib/api/auth.ts` |
| **No optimistic updates** | Mutations block until server responds | All mutations |
| **No keyboard shortcuts** | All interactions require mouse | Entire app |
| **Client-side filtering for prescriptions** | Loads all records, filters in browser | `PrescriptionsPage.tsx` |
| **7-day JWT with no refresh** | Users stay logged in a week, no early invalidation | Auth system |
| **Cookie set but not read** | Bearer header is primary; cookie serves no purpose | Auth controller |

---

## 15. Future Improvements

| Area | Description |
|------|-------------|
| **Auth hardening** | Add Next.js middleware for global auth, implement token revocation, remove hardcoded secrets |
| **Role-based API protection** | Wire `requireRole` into API routes, enforce atelier-only and shop-only access |
| **Data caching** | Add React Query or SWR for server state management |
| **Pagination** | Add cursor or offset pagination to all list endpoints |
| **Form validation** | Adopt Zod schemas at the API boundary (some already exist for clients/stock/prescriptions) |
| **Offline PWA** | Add service worker for offline support (self-hosted LAN use case) |
| **Keyboard shortcuts** | Speed up data entry for power users |
| **Real SMS integration** | Connect to a Tunisian SMS provider |
| **Dark mode toggle** | CSS variables exist, no toggle UI |
| **Audit log viewer** | Expose audit trail in the UI |
| **Multi-user support** | The schema already has roles — wire up proper RBAC |
| **Advanced reporting** | Add chart library for visual analytics |
| **Mobile responsive polish** | Ensure all screens work at tablet sizes |

---

*This document is the project's living technical knowledge base. Update it whenever architecture, business rules, APIs, database, security, or modules change.*
