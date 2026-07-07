# Sofien Optic — Technical Context

> Generated from codebase analysis. **Source of truth is the implementation.**

---

## Project Overview

**Purpose:** Browser-based POS, practice management, and atelier workshop management system for a single optical shop in Tunisia.

**Business domain:** Optical retail + lens processing workshop  
**Users:** Owner/admin, shop staff, atelier (workshop) staff — 3 roles  
**Currency:** TND (displayed as `{amount} dt`)  
**Languages:** French (primary) + English  

### Main workflows
1. **Standard eyewear order** — Client selects frame → prescription checked/entered → lenses mounted → pickup + payment
2. **Remounting** — Client brings own frame → new lenses fitted
3. **Direct sale** — Immediate sale of stock item (accessories, lenses)
4. **Repair / mounting service** — Tracked via atelier work orders
5. **Atelier work orders** — Internal (shop orders) or external (optician shop orders)
6. **Purchase invoices** — Shop buys frames/accessories; Atelier buys lens blanks
7. **Payment tracking** — Cash, cheque, traite, card, transfer; deposit/balance/full

---

## Architecture

### High-level

```
Client (SPA) → Next.js API Routes → Service Layer → Repositories → Prisma → SQLite
                                    ↕
                              Controllers
                                    ↕
                              Middleware (error handling)
```

### Folder structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API route handlers (thin re-exports)
│   ├── globals.css
│   ├── layout.tsx          # Root layout (fonts, Toaster)
│   └── page.tsx            # SPA shell — view router
├── components/
│   ├── layouts/            # AppShell, Sidebar, Header, MobileNav
│   └── ui/                 # shadcn primitives (button, card, dialog, sheet, etc.)
├── features/               # One folder per domain module
│   ├── auth/
│   ├── billing/
│   ├── clients/
│   ├── dashboard/
│   ├── doctors/
│   ├── fournisseurs/
│   ├── import/
│   ├── lens-blanks/
│   ├── lens-brands/
│   ├── notifications/
│   ├── optician-shops/
│   ├── orders/
│   ├── prescriptions/
│   ├── purchase-invoices/
│   ├── qrcode/
│   ├── repairs/            # AtelierWorkOrder
│   ├── repair-services/
│   ├── reports/
│   ├── settings/
│   └── stock/
├── errors/                 # AppError hierarchy
├── lib/
│   ├── api/                # client.ts (fetch wrapper), auth.ts, parse.ts, response.ts
│   ├── constants/
│   ├── database/
│   │   ├── db.ts           # Prisma singleton
│   │   └── repositories/   # One file per entity
│   ├── hooks/              # useDebounce, useTranslation
│   ├── services/           # sms.ts
│   └── utils/              # cn.ts, currency.ts
├── mappers/                # Transform Prisma models → DTOs
├── middlewares/             # errorHandler.ts
├── modules/                # Cross-cutting concerns
│   └── audit/              # audit.service.ts
├── stores/                 # Zustand stores (auth, view, locale)
└── types/
```

### Layer responsibilities

| Layer | Responsibility |
|-------|---------------|
| **API route** (`app/api/.../route.ts`) | Re-exports from controller — no logic |
| **Controller** (`features/*/*.controller.ts`) | Parses request, calls service, maps response, catches errors |
| **Service** (`features/*/*.service.ts`) | Business logic, validation, audit logging |
| **Repository** (`lib/database/repositories/`) | Thin Prisma query wrappers |
| **Mapper** (`mappers/`) | Domain → DTO transformation |
| **DTO** (`dtos/`) | TypeScript interfaces for API boundaries |
| **Error** (`errors/`) | `AppError` + subtypes (400/401/403/404/409) |
| **Middleware** (`middlewares/`) | `handleError()` — catches AppError, returns structured JSON |

### Dependency rules

- **Controllers** depend on: services, mappers, lib/api (parse/response), middlewares
- **Services** depend on: repositories, lib/database, errors, audit module
- **Repositories** depend on: `db` singleton only
- **Mappers** depend on: DTOs only
- **Features can import from other features' service/api files** (e.g., billing imports orders)
- **Apps (pages)** import feature components directly

---

## Technologies

| Category | Choice | Notes |
|----------|--------|-------|
| Framework | Next.js 16.2.9 (App Router) | SPA on a single route `/` |
| Language | TypeScript (strict) | |
| Styling | Tailwind CSS v4 + `@tailwindcss/postcss` | CSS-first config |
| UI Library | shadcn/ui v4 (radix-nova style) | Local components in `components/ui/` |
| Icons | lucide-react | |
| Animations | framer-motion | Page transitions |
| Toasts | sonner | |
| State (global) | Zustand v5 | auth-store, view-store, locale-store |
| State (server) | useState/useEffect | No React Query or SWR |
| Forms | Native HTML | No react-hook-form or Formik |
| Validation | zod | Schemas on API + client |
| Database | SQLite via Prisma ORM | File-based, no server |
| Auth | jose (JWT) + bcryptjs | Token in localStorage + httpOnly cookie |
| SMS | lib/services/sms.ts | Currently disabled (logs only) |
| QR code | `qrcode` npm (server gen) + `html5-qrcode` (browser scan) | |
| CSV | Custom parser/exporter | |
| i18n | Custom `useTranslation` hook | JSON files in `src/i18n/` |
| OCR | Groq API (LLaMA vision model) | Extract prescription from image |

---

## Modules

### Auth

```
features/auth/
├── auth.api.ts          # login(), changePassword() client calls
├── auth.controller.ts   # loginPOST, logoutPOST, setupPOST, changePasswordPOST
├── auth.service.ts      # authenticateUser, setupAdmin, changePassword, createToken, verifyToken, hash/compare password
└── LoginPage.tsx        # Login UI
```

- JWT with HS256, 7-day expiry
- Token stored in `localStorage` (client) AND httpOnly cookie (server-set on login)
- `lib/api/auth.ts`: `getAuthenticatedUser()` and `getAuthenticatedUserWithRole()` for API route guards
- `requireRole()` factory for role-based access
- Setup endpoint creates initial admin (`owner@sofien.tn` / `admin123`)
- Password change requires current password

### Dashboard

```
features/dashboard/
├── dashboard.api.ts     # fetchDashboard(), fetchReadyOrders()
├── dashboardPage.tsx    # KPI cards, ready-orders section, quick action buttons
└── OrderViewDialog.tsx  # Order detail dialog
```

- 6 KPI cards: Total Revenue, Total Clients, Today Sales, Low Stock, Pending Repairs, Total Products
- "Ready for Pickup" section with direct SMS + view buttons
- Quick action buttons: Repairs, Optician Shops, New Order

### Clients

```
features/clients/
├── client.api.ts
├── client.controller.ts  # GET, GET_ID, POST, PATCH, DELETE
├── client.schema.ts      # Zod: name, familyName, phone required
├── client.service.ts     # CRUD + duplicate phone check
├── ClientDetailPage.tsx  # Client detail with linked orders
├── ClientForm.tsx        # Create/edit form
├── ClientsPage.tsx       # List with search
└── ClientWizardDialog.tsx # Wizard: client info → optional prescription
```

- Phone is unique (enforced at DB + service level with ConflictError)
- Search by name, familyName, phone

### Stock / Products

```
features/stock/
├── stock.api.ts
├── stock.controller.ts   # GET, POST, PATCH, DELETE
├── stock.schema.ts       # Zod: name, price, quantity + lens params
├── stock.service.ts      # listProducts (with 14+ filter params), create/update/delete
├── ProductForm.tsx       # Create/edit form
├── StockFilters.tsx      # Multi-filter panel
├── StockPage.tsx         # List with search, filters, export
├── StockQrDialog.tsx     # QR code display + print button
└── StockTable.tsx        # Tabular display with status badges
```

- Categories: `lunette`, `lentille`, `verre`, `accessory`, `nettoyant_lentilles`, `nettoyant_monture`
- Lens-specific: lensType, material, coating, sph, cyl, add, thickness
- Auto-generates QR code on creation (`SOPT-{timestamp}-{random}`)
- Stock status: outOfStock (0), lowStock (≤3), inStock (>3)
- Filters: search, category, stockStatus, brand, fournisseurId, lens params, sph/cyl/add ranges

### Orders

```
features/orders/
├── order.controller.ts   # GET, POST, GET_ID, PATCH, DELETE
├── order.service.ts      # createOrder, listOrders, getOrderById, updateOrderStatus, addOrderPayments, deleteOrder
├── order.schema.ts       # (Zod for order)
├── OrderDetailDialog.tsx # Full order detail with payments, items, status actions
├── OrderForm.tsx         # Complex form (all 3 scenarios + repairs + payments)
├── OrdersPage.tsx        # List with status/type filters
└── orders.api.ts
```

**Order creation business rules:**
- Generates sequential order numbers via `$transaction`
- `direct_sale` → auto-status `completed`, auto-payment `full`
- Stock deducted on creation (`StockAdjustment` with reason `sale`)
- Work orders (repairs) created alongside order
- `totalAmount` = items sum + repairs sum

**Status transitions:**
- `pending` → `ready` | `cancelled`
- `ready` → `completed`
- `cancelled` → stock restored
- `completed` → payment auto-check: if totalPaid ≥ total, already completed

**Payment rules:**
- `addOrderPayments()` checks if totalPaid >= totalAmount → auto-completes order
- `deleteOrder()` restores stock

### Billing

```
features/billing/
├── billing.api.ts
├── billing.controller.ts   # GET only (list with filters)
├── billing.service.ts      # listBilling — filtered orders with full includes
├── billing.types.ts        # BillingRecord interface
├── billing.print.ts        # printInvoice(), printReport() — window.open HTML
├── BillingInvoiceDialog.tsx
├── BillingPage.tsx         # List + period selector + quick sale button
└── BillingReportDialog.tsx # Period summary with print
```

- Read-only view of completed/pending orders with payment status
- Print invoice opens new window with formatted HTML
- Period filtering: today, week, month, year, all

### Prescriptions

```
features/prescriptions/
├── prescription.controller.ts
├── prescription.schema.ts   # Zod: all optical fields
├── prescription.service.ts
├── PrescriptionCards.tsx      # 2-column card grid display
├── PrescriptionForm.tsx      # Form with OCR upload
├── PrescriptionsPage.tsx     # List with search
└── prescriptions.api.ts
```

- Optical fields: sphRight, cylRight, axisRight, addRight, pdRight, sphLeft, cylLeft, axisLeft, addLeft, pdLeft
- Linked to Client and optionally Doctor
- OCR upload via Groq API (`/api/ocr-prescription`) — sends base64 image, extracts JSON

### Repairs / AtelierWorkOrder

```
features/repairs/
├── repair.controller.ts      # GET, POST, PATCH (status, assign-lens-blanks, declare-breakage), DELETE
├── repair.service.ts         # listRepairs, getRepair, createRepair, updateRepairStatus, assignLensBlanks, declareBreakage, deleteRepair
├── RepairsPage.tsx           # Tabbed view: Pending / In Progress / Completed / Delivered
├── RepairCreateDialog.tsx    # Create work order for optician shops
└── repairs.api.ts
```

- Source: `internal` (linked to shop Order) or `optician` (linked to OpticianShop)
- Type: `mounting` or `repair`
- Status: `pending` → `in_progress` → `completed` → `delivered` | `cancelled`
- Lens blank assignment per eye (left/right) with optional replacement on breakage
- On `completed` status: triggers `sendRepairReadySms()`

### Reports

```
features/reports/
├── report.controller.ts    # GET (period, entity)
├── report.service.ts       # getReports(period, entity) — shop or atelier
├── ReportsPage.tsx         # KPI cards, revenue by type, orders by status, top products, monthly chart
└── reports.api.ts
```

- Periods: today, week, month, year, all
- Entities: `shop` (default) or `atelier`
- Shop KPIs: totalClients, totalProducts, lowStockCount, totalOrders, pendingRepairs, totalRevenue, newClients, avgOrderValue, totalProfit, totalCost, outstandingBalance
- Revenue breakdown by order type + orders by status
- Top 5 products per category (by qty sold)
- 12-month monthly revenue chart
- Atelier KPIs: totalLensBlanks, lowStockLensBlanks, totalWorkOrders, pending/completed counts, workOrdersByShop, monthlyWorkOrders

### Doctors

```
features/doctors/
├── doctor.controller.ts
├── doctor.service.ts
├── DoctorFormDialog.tsx
├── DoctorPatientsDialog.tsx  # Shows linked prescriptions
├── DoctorsPage.tsx
└── doctors.api.ts
```

- Simple CRUD, searchable by name/phone/specialization
- Linked to prescriptions

### Fournisseurs (Suppliers)

```
features/fournisseurs/
├── fournisseur.controller.ts
├── fournisseur.service.ts
├── FournisseurFormDialog.tsx
├── FournisseurProductsDialog.tsx  # Shows supplier's products with sold status
├── FournisseursPage.tsx
└── fournisseurs.api.ts
```

- `entity` field: `'shop'` or `'atelier'` — which side owns the supplier
- Products count shown in list

### Optician Shops

```
features/optician-shops/
├── optician-shop.controller.ts
├── optician-shop.service.ts
├── OpticianShopsPage.tsx
└── optician-shops.api.ts
```

- External shops that send work to the atelier
- Linked to AtelierWorkOrder

### Lens Blanks

```
features/lens-blanks/
├── lens-blank.controller.ts
├── lens-blank.service.ts    # CRUD + adjustLensBlankStock()
├── LensBlankForm.tsx
├── LensBlanksPage.tsx
└── lens-blank.service.ts
```

- Separate from `Product` — atelier-only inventory
- Fields: brand, lensType, material, coating, thickness, sphMin/Max, cylMin/Max, costPrice, sellingPrice, quantity
- Stock adjustments with reasons: purchased, used_in_mounting, used_in_repair, broken_during_mounting
- Adjustments link to work orders and purchase invoices

### Purchase Invoices (Factures Fournisseur)

```
features/purchase-invoices/
├── purchase-invoice.controller.ts
├── purchase-invoice.service.ts  # CRUD + addPaymentToInvoice + getNextInvoiceNumber
├── purchase-invoice.print.ts
├── PurchaseInvoiceForm.tsx
├── PurchaseInvoicePreviewDialog.tsx
├── PurchaseInvoicesPage.tsx
```

- Entity-aware: `shop` or `atelier`
- Line items can reference Product (shop) or LensBlank (atelier)
- Supports cheque/traite payment creation inline
- Payment status: unpaid / partiallyPaid / fullyPaid (computed in mapper)

### QR Code

```
features/qrcode/
├── qrcode.controller.ts  # GET ?code=<code>
├── qrcode.service.ts     # lookupProductByCode
├── QRCodePage.tsx        # Manual lookup UI
└── qrcode.api.ts
```

- Lookup product by QR code string (manual input, not scanner)

### Notifications

```
features/notifications/
├── notification.controller.ts
├── notification.service.ts  # getNotifications() — aggregates alerts
└── NotificationBell.tsx     # Bell icon with dropdown
```

Alert types:
- `low_stock` — products with qty ≤ 3
- `pending_repair` — work orders with status `pending`
- `ready_order` — orders with status `ready`
- `pending_payment` — cheques/traites due within 7 days

### Import (CSV)

```
features/import/
└── ImportPage.tsx
```

- Supports clients and fournisseurs
- French column name auto-detection (nom, prénom, téléphone, etc.)
- Preview with duplicate detection (by phone), manual mapping
- Batch import with per-row error reporting

### Settings

```
features/settings/
├── SettingsPage.tsx
└── settings.api.ts
```

- Language toggle (fr/eng)
- Profile (password change)
- Repair services CRUD
- Lens brands CRUD
- SMS info display
- Role-aware: shop sees shop settings, atelier sees atelier settings

### Lens Brands

```
features/lens-brands/
├── lens-brand.controller.ts
├── lens-brand.service.ts
```

- Simple name-only entity for product form dropdowns

### Repair Services

```
features/repair-services/
├── repair-service.controller.ts
├── repair-service.service.ts
```

- name + defaultPrice
- Used in work orders and order forms

### Atelier Work Orders page

```
features/atelier-work-orders/
├── AtelierWorkOrdersPage.tsx   # Tabbed view with summary cards
├── WorkOrderDetailDialog.tsx   # Full detail with status transitions, lens assignment, breakage, print bill
```

- Summary cards: Pending, In Progress, Completed, Delivered, Cancelled
- Tabbed table filtered by status
- Detail dialog with: status actions, lens blank assignment (left/right), breakage declaration, print bill

---

## Database

### Entities (18 models, 10 enums)

| Model | Key fields | Relationships |
|-------|-----------|---------------|
| User | email, name, password, role (admin\|shop\|atelier) | — |
| Client | name, familyName, phone (unique), address, gender, birthDate, notes, organization | → Prescription, Order, SmsLog |
| Doctor | name, phone, address, specialization | → Prescription |
| Fournisseur | name, phone, address, email, taxId, entity (shop\|atelier) | → Product, PurchaseInvoice, LensBlank |
| OpticianShop | name, phone, address, notes | → AtelierWorkOrder |
| Prescription | sphRight/Left, cylRight/Left, axisRight/Left, addRight/Left, pdRight/Left, dateWritten | → Client, Doctor, Order |
| Product | name, brand, model, category, price, costPrice, quantity, thickness, lensType, material, coating, sph, cyl, add | → Fournisseur, QRCode, OrderItem, StockAdjustment, PurchaseInvoiceItem |
| QRCode | code (unique) | → Product (1:1) |
| Order | orderNumber (unique, auto-increment), totalAmount, orderType, status | → Client, Payment, OrderItem, AtelierWorkOrder, Prescription |
| OrderItem | quantity, unitPrice | → Order, Product |
| Payment | amount, type (deposit\|balance\|full), method (cash\|cheque\|traite\|card\|transfer), dueDate | → Order, Cheque |
| Cheque | number, bankName, amount, issueDate, dueDate, status, entityType, entityId | → Payment, SupplierPayment |
| Traite | number, amount, issueDate, dueDate, status, notes | → PurchaseInvoice, SupplierPayment |
| PurchaseInvoice | invoiceNumber, entity (shop\|atelier), date, totalAmount, paidAmount, notes | → Fournisseur, PurchaseInvoiceItem, SupplierPayment, Traite, LensBlankAdjustment |
| PurchaseInvoiceItem | category, quantity, unitPrice | → PurchaseInvoice, Product, LensBlank |
| SupplierPayment | amount, method, paidAt | → PurchaseInvoice, Cheque, Traite |
| LensBlank | brand, lensType, material, coating, thickness, sphMin/Max, cylMin/Max, costPrice, sellingPrice, quantity | → Fournisseur, LensBlankAdjustment, PurchaseInvoiceItem, AtelierWorkOrder (left/right/replacement) |
| LensBlankAdjustment | quantity, reason | → LensBlank, AtelierWorkOrder, PurchaseInvoice |
| AtelierWorkOrder | source (internal\|optician), type (mounting\|repair), status, lensBlankPrice, servicePrice, frameFrom, startedAt, completedAt, dueDate, expectedCompletionDate, brokenLensBlank | → Order, OpticianShop, LensBlank (left/right/replacement), RepairService |
| RepairService | name, defaultPrice | → AtelierWorkOrder |
| LensBrand | name (unique) | — |
| StockAdjustment | quantity, reason (restock\|damage\|adjustment\|sale) | → Product |
| SmsLog | phone, message, status | → Client |
| AuditLog | userId, action, entityType, entityId, metadata (JSON string) | — |

### Key constraints
- `Client.phone` is unique
- `Order.orderNumber` is unique (auto-incrementing in transaction)
- `QRCode.code` is unique
- `LensBrand.name` is unique
- `Prescription` onDelete: Restrict (keeps prescription when client deleted)
- `Order` onDelete: Restrict (keeps client when order deleted)
- `OrderItem` onDelete: Cascade
- `QRCode` onDelete: Cascade
- `StockAdjustment` onDelete: Cascade
- `SupplierPayment`, `Traite`: cascade from PurchaseInvoice

---

## API

All endpoints at `/api/{entity}`. Pattern: `GET` (list), `POST` (create), `PATCH` (update), `DELETE`.

### Auth
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | Login → JWT token |
| `/api/auth/logout` | POST | Clear auth cookie |
| `/api/auth/setup` | POST | Create initial admin (one-time) |
| `/api/auth/change-password` | POST | Change password (requires auth) |

### CRUD endpoints
| Entity | List/Create | Detail | Notes |
|--------|-------------|--------|-------|
| clients | `GET, POST` | `GET, PATCH, DELETE` | |
| orders | `GET, POST` | `GET, PATCH, DELETE` | PATCH supports `status`, `payments` |
| stock | `GET, POST` | `PATCH, DELETE` | Stock GET has 14+ filter params |
| prescriptions | `GET, POST` | `PATCH, DELETE` | |
| repairs | `GET, POST` | `PATCH, DELETE` | PATCH with `?action=assign-lens-blanks`, `?action=declare-breakage` |
| doctors | `GET, POST` | `PATCH, DELETE` | |
| fournisseurs | `GET, POST` | `PATCH, DELETE` | |
| optician-shops | `GET, POST` | `PATCH, DELETE` | |
| lens-blanks | `GET, POST` | `PATCH, DELETE` | PATCH with `?action=adjust-stock` |
| lens-brands | `GET, POST` | `PATCH, DELETE` | |
| repair-services | `GET, POST` | `PATCH, DELETE` | |
| purchase-invoices | `GET, POST` | `PATCH, DELETE` | PATCH with `?action=add-payment` |

### Read-only endpoints
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/billing` | GET | Filtered order list for billing |
| `/api/reports` | GET | KPIs by period + entity (shop/atelier) |
| `/api/qrcode?code=X` | GET | Product lookup by QR code |
| `/api/notifications` | GET | Aggregated alert list |
| `/api/export/{entity}` | GET | CSV download (clients, fournisseurs, products, orders) |

### Other
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/import` | POST (preview), PUT (confirm) | CSV import |
| `/api/ocr-prescription` | POST | Groq OCR for prescription image |

---

## Security

### Authentication
- JWT stored in `localStorage` (client reads for API calls) AND `httpOnly` cookie (server-set)
- `Authorization: Bearer <token>` header on every API request (set by `lib/api/client.ts`)
- Token expiry: 7 days (configurable via `AUTH_COOKIE_MAX_AGE`)

### Authorization (roles)
- 3 roles: `admin`, `shop`, `atelier`
- API gates: `requireRole([...])` in `lib/api/auth.ts`
- Nav items filtered by role in `Sidebar.tsx` and `MobileNav.tsx`
- Admin sees everything; Shop sees sales/operations; Atelier sees workshop

### Validation
- Zod schemas on API input (`parseBody(request, schema)`)
- `BadRequestError(400)` with field-level errors from `schema.safeParse()`
- Client-side validation in native HTML forms (required attributes)
- Phone uniqueness enforced at DB (unique constraint) + service level (ConflictError)

---

## Error Handling

### Error hierarchy
```
AppError (base)
├── BadRequestError (400)
├── NotFoundError (404)
├── UnauthorizedError (401)
├── ForbiddenError (403)
└── ConflictError (409)
```

### Error response format
```json
{ "success": false, "statusCode": 400, "message": "...", "errorCode": "BAD_REQUEST", "fields": {...}, "stack": "..." }
```

- `handleError()` in `middlewares/errorHandler.ts` catches all errors
- Operational errors (AppError) → structured response
- Unknown errors → 500 with generic message in production
- Stack traces only in development

---

## Logging & Audit

### Logger (`lib/logger.ts`)
- JSON-formatted console output: `{ timestamp, level, message, context }`
- Levels: `info`, `warn`, `error`, `debug` (debug only in dev)

### Audit trail (`modules/audit/`)
- `AuditLog` model in DB: userId, action, entityType, entityId, metadata (JSON string)
- Logged in every service for key actions: ORDER_CREATED, ORDER_COMPLETED, ORDER_CANCELLED, ORDER_DELETED, CLIENT_CREATED, PRODUCT_CREATED, USER_LOGIN, ADMIN_SETUP, PASSWORD_CHANGED, PAYMENT_ADDED, REPAIR_COMPLETED, REPAIR_CREATED
- Audit failure is non-blocking (caught + logged to console)

---

## DTOs & Mapping

### Pattern
```
Prisma model → mapper function → DTO interface → JSON response
```

- Mappers in `src/mappers/` transform Prisma's Decimal objects to strings
- DTOs in `src/dtos/` define the API contract as TypeScript interfaces
- Mappers handle: Decimal→string, partial payment computation, optional relations

### Notable mapper logic
- `toOrderListItem`, `toOrderDetail`: compute `paymentStatus` from payments vs total
- `toBillingResponse`: compute `balance` (total - paid)
- `toPurchaseInvoiceResponse`: compute `paymentStatus` from paidAmount vs totalAmount
- `toRepairResponse`: derive `source` from opticianShopId presence

---

## Transactions

- `generateOrderNumber()` uses `db.$transaction` to ensure unique sequential numbers
- Individual Prisma operations are not wrapped in explicit transactions (rely on Prisma's per-operation atomicity)
- Multiple operations in order creation (create order + deduct stock + create adjustments) run sequentially but not in a single transaction — **potential partial failure risk**

---

## Coding Conventions

- `'use client'` on all interactive components (SPA model)
- Feature modules follow: `{entity}.controller.ts`, `{entity}.service.ts`, `{entity}.api.ts`
- API routes are single-line re-exports
- Controllers always wrap in try/catch → `handleError(error)`
- Mappers accept `any` for Prisma results
- `cn()` utility (clsx + tailwind-merge) for class merging
- `formatCurrency()` appends ` dt` suffix
- i18n keys use dot notation, stored in `useTranslation()` hook
- Zod schemas defined as `{entity}.schema.ts` within feature folder
- Repositories are plain object exports (not classes)
- Environment variables read via `process.env`, types imported from `@prisma/client`

---

## Current Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SPA (single route) | All view switching via Zustand | No URL routing for app views; single `/` page |
| Feature-based folders | Each domain in its own folder | Co-locates service, controller, API client, components |
| Thin API routes | Routes re-export from controllers | Keeps routes as zero-logic wiring |
| Repositories as objects | Plain objects, not classes | Simpler, no DI needed for single-user app |
| Mappers accept `any` | Prisma return types are complex | Pragmatic for single-developer project |
| SQLite | File-based DB | Zero-config, single-user, local-only |
| Prisma singleton | Global cached client | Prevents connection pool issues |
| Audit non-blocking | try/catch swallow failures | Audit failure should not break operations |
| Cash + cheques + traites | Multiple payment methods | Supports Tunisian market practices |

---

## Known Technical Debt

| Issue | Location | Impact |
|-------|----------|--------|
| No explicit DB transactions for order creation | `order.service.ts:createOrder()` | Risk: stock deducted but order fails (partial state) |
| `any` types in mappers | `mappers/*.ts` | Loses type safety |
| `_count` in DTOs | `dtos/*.dto.ts` | Mixes Prisma metadata into API contract |
| No input debouncing | Clients, Stock | API call on every keystroke |
| No testing framework | — | No Jest/Vitest/Playwright installed |
| Repositories add little value | `repositories/*.ts` | Thin wrappers around Prisma — could use Prisma directly |
| SPA navigation lost on refresh | `page.tsx` | Current view state not persisted to URL |
| `Repair` ≠ `AtelierWorkOrder` naming | DB model is `AtelierWorkOrder`, feature folder is `repairs/` | Inconsistent naming |
| No pagination | All list pages | Will degrade with large datasets |
| Empty states not handled | All list pages | No "No data" messages |
| Race conditions on rapid nav | `useEffect` fetch without AbortController | Stale data possible |
| SMS provider disabled | `sms.ts` | Only logs, never actually sends |
| Hardcoded fallback JWT secret | `constants/index.ts` | Security concern in production |
| `order.service.ts` returns `as any` from `listOrders` | `order.service.ts:37` | Type safety bypassed |

---

## Future Improvements (from codebase gaps)

- PWA / offline support (no service worker)
- Keyboard shortcuts (no implementation)
- Audit log viewer (model exists, no UI)
- Appointment scheduling (not in schema)
- Supplier/purchase order management (basic exists, could expand)
- Loyalty/discount system (not implemented)
- Cloud sync/backup (SQLite is local only)
- Advanced analytics/charts (no chart library)
- Dark mode toggle (CSS variables exist, no UI toggle)
- Real SMS provider integration (abstraction ready, not connected)
