# Plan: Atelier / Shop Separation & Payment Methods

**Decided:**
- Single atelier (internal workshop for Sofien Optic)
- Merge `Repair` → `AtelierWorkOrder` with `type` field
- Retroactively split existing data
- Role-based views (shop staff vs atelier staff)
- In-app toast + bell for cheque/traite reminders — **notify every day** while within 7-day window
- Shop → atelier payment: printable bills per work order, tied to order payment status & method
- Separate `LensBlank` model (not in `Product` — atelier manages its own stock)
- Atelier services are **free only for the shop (Sofien Optic)** — optician shops pay for services + lens blanks
- Atelier KPIs: separate lens blank revenue vs repair fee revenue
- Keep responsive (mobile + PC + modal pages)
- fr + en translations throughout

---

## 0. Shop ←→ Atelier Payment Flow

### How it works

1. Shop creates an **Order** (standard or remounting type)
2. System auto-creates an **AtelierWorkOrder** (`type: mounting`)
3. Atelier selects lens blank(s) from atelier stock
4. Atelier completes mounting → marks work order `completed`
5. System generates a **printable bill** for the atelier → shop:
   - Line: lens blank × quantity × price = subtotal
   - Mounting service: **free** (€0)
   - Total = lens blank cost
6. Atelier bill payment is tied to the **order's payment status & method**:
   - Client pays shop fully → atelier bill marked paid (internal P&L transfer)
   - Client pays shop with cheque → atelier bill pending until cheque clears
   - Client pays deposit → atelier bill partially paid or held
7. User prints the bill for record-keeping (no real bank transfer needed)

### Revenue split
- **Shop revenue** = `clientTotal - lensBlankPrice` (frame markup + retail margin)
- **Atelier revenue** = `lensBlankPrice` (B2B sale of lens blank to shop)

---

## 1. Payment Methods Foundation

### 1.1 Extend `Payment` model

| Current | New |
|---------|-----|
| `type: deposit \| balance \| full` | Keep `type` for payment purpose |
| (none) | **Add** `method: cash \| cheque \| traite \| card \| transfer` |
| (none) | **Add** `chequeId?` (FK → Cheque) |
| (none) | **Add** `dueDate?` (for deferred payments) |

### 1.2 New `Cheque` model

```prisma
model Cheque {
  id          String        @id @default(cuid())
  number      String
  bankName    String
  amount      Decimal
  issueDate   DateTime
  dueDate     DateTime
  status      ChequeStatus  @default(pending)
  // pending → deposited → cashed | bounced
  entityType  String        // 'client_payment' | 'supplier_payment' | 'shop_to_atelier'
  entityId    String?       // FK to the payment record
  createdAt   DateTime
  updatedAt   DateTime
}
```

### 1.3 New `Traite` model

```prisma
model Traite {
  id                String        @id @default(cuid())
  number            String
  amount            Decimal
  issueDate         DateTime
  dueDate           DateTime
  status            TraiteStatus  @default(pending)
  // pending → paid | overdue | cancelled
  purchaseInvoiceId String        // FK → PurchaseInvoice
  notes             String?
  createdAt         DateTime
  updatedAt         DateTime
}
```

### 1.4 Cheque/Traite Reminders (in-app toast + bell)

- On every app load: scan `Cheque`/`Traite` where `dueDate` is within **next 7 days**
- Notify **every day** while within the 7-day window
- Bell badge with count → notification dropdown listing:
  - Cheque #123 — due in 3 days — from Client X (deposit by this date)
  - Traite #456 — due tomorrow — to Supplier Y (pay by this date)
- Dedicated "Pending Payments" page (dashboard widget + full list view)

---

## 2. Supplier Purchase Invoices (Facture Fournisseur)

### 2.1 New `PurchaseInvoice` model

```prisma
model PurchaseInvoice {
  id              String    @id @default(cuid())
  invoiceNumber   String
  fournisseurId   String    // FK → Fournisseur
  entity          String    // 'shop' | 'atelier'
  date            DateTime
  totalAmount     Decimal
  paidAmount      Decimal   @default(0)
  notes           String?
  items           PurchaseInvoiceItem[]
  payments        SupplierPayment[]
  createdAt       DateTime
  updatedAt       DateTime
}

model PurchaseInvoiceItem {
  id          String  @id @default(cuid())
  invoiceId   String  // FK → PurchaseInvoice
  productId   String? // FK → Product (shop items: frames, accessories)
  lensBlankId String? // FK → LensBlank (atelier items)
  quantity    Int
  unitPrice   Decimal
}

model SupplierPayment {
  id                String   @id @default(cuid())
  purchaseInvoiceId String   // FK → PurchaseInvoice
  amount            Decimal
  method            String   // 'cash' | 'cheque' | 'traite' | 'transfer'
  chequeId          String?  // FK → Cheque
  traiteId          String?  // FK → Traite
  paidAt            DateTime @default(now())
}
```

### 2.2 Payment Status

| Condition | Status |
|-----------|--------|
| `paidAmount = 0` | `unpaid` |
| `0 < paidAmount < totalAmount` | `partiallyPaid` |
| `paidAmount >= totalAmount` | `fullyPaid` |

### 2.3 UI Pages

- **List**: filter by entity (shop/atelier), supplier, date range, payment status
- **Create**: select supplier → add items (products for shop, lens blanks for atelier) → enter prices → add payment(s)
- **Detail**: invoice info + items table + payments timeline
- **Add Payment**: choose method, capture cheque/traite details

---

## 3. Atelier / Workshop Separation

### 3.1 Domain Model

| | Shop (Sofien Optic retail) | Atelier (internal workshop) |
|---|---|---|
| **Sells to** | End clients (`Client`) | Shop (Sofien Optic) + optician shops (`OpticianShop`) |
| **Stock** | Frames, accessories, cleaners (`Product`) | Lens blanks (new `LensBlank` model) |
| **Purchases from** | Suppliers (`Fournisseur`) — frames, accessories | Suppliers (`Fournisseur`) — lens blanks |
| **Revenue** | Client orders (frame markup, lens markup, direct sales) | Lens blank sales **+** service fees (from optician shops) |
| **Services** | — | **Free for shop.** Optician shops pay for both lens blanks and services. |
| **Dashboard** | Current dashboard (minus repair services revenue) | New atelier dashboard |

### 3.2 Merge Repair into `AtelierWorkOrder`

Current `Repair` model → renamed to `AtelierWorkOrder`:

```prisma
model AtelierWorkOrder {
  id              String    @id @default(cuid())
  orderId         String?   // FK → Order (shop order needing mounting)
  opticianShopId  String?   // FK → OpticianShop (external client)
  source          String    // 'internal' | 'optician'
  type            String    // 'mounting' | 'repair'

  status          AtelierWorkOrderStatus @default(pending)
  // pending → in_progress → completed → delivered | cancelled

  // Lens details
  lensBlankLeftId  String?  // FK → LensBlank (left eye)
  lensBlankRightId String?  // FK → LensBlank (right eye)
  frameFrom        String?  // 'shop' | 'optician' | 'client'

  // Pricing
  lensBlankPrice   Decimal? // total cost of lens blanks
  servicePrice     Decimal  // mounting/repair fee (0 for shop, charged for optician shops)

  // Timing
  startedAt        DateTime?
  completedAt      DateTime?
  dueDate          DateTime
  expectedCompletionDate DateTime?

  // Breakage
  brokenLensBlank  String?  // 'none' | 'left' | 'right' | 'both'
  replacementLeftId  String? // FK → LensBlank (replacement if left broke)
  replacementRightId String? // FK → LensBlank (replacement if right broke)

  // Relations
  order           Order?        @relation(fields: [orderId], references: [id])
  opticianShop    OpticianShop? @relation(fields: [opticianShopId], references: [id])
  createdAt       DateTime
  updatedAt       DateTime
}
```

**Migration from Repair:**
- All existing `Repair` records → `type: 'repair'`, `source` from `opticianShopId` presence
- `Repair.status` → `AtelierWorkOrder.status`
- `Repair.price` → `servicePrice`
- `Repair.repairServiceId` → drop or store as ref

### 3.3 Shop → Atelier Workflow (mounting)

1. Shop creates **Order** (standard or remounting)
2. System auto-creates **AtelierWorkOrder** (`type: mounting`, `source: internal`, `servicePrice: 0`)
3. Atelier selects lens blank from stock for each eye
4. Atelier completes mounting → marks `completed`
5. **Printable bill** auto-generated:
   - Lens Blank L — {brand, type, price}
   - Lens Blank R — {brand, type, price}
   - Service: FREE
   - Total: lens blank cost
   - Payment status: follows order payment

### 3.4 Optician Shop → Atelier Workflow

1. User creates **AtelierWorkOrder** with `opticianShopId`, `source: optician`
2. Type: `mounting` or `repair`
3. If mounting:
   - Select lens blank(s) → `lensBlankPrice` = cost
   - `servicePrice` = mounting fee
4. If repair:
   - `lensBlankPrice` = 0 (no lens blank)
   - `servicePrice` = repair fee
5. Atelier completes → marks `completed`
6. Atelier invoices optician shop (per-order or periodic)
7. Optician shop pays: cash / cheque / traite / transfer

### 3.5 Atelier Dashboard

New view for atelier-role users:

**KPIs (this month):**
- **Total revenue** = lens blank revenue + repair fees
- **Lens blank revenue** (separate card): from shop (internal) vs from optician shops
- **Service fee revenue** (separate card): from optician shops only
- Revenue breakdown chart (shop vs optician shops)
- Pending work orders count (by type)
- **Lens blanks stock**: total references, total qty, low stock alerts
- Top optician shops by revenue
- **Breakage rate**: `(broken / total used) × 100`
- Consumption chart (by brand, by thickness)

**Quick actions:**
- New work order
- View pending work orders
- Record lens blank usage
- Declare breakage
- Purchase lens blank from supplier (if out of stock)
- View optician shop balances

### 3.6 Shop Dashboard (modified)

Current shop dashboard stays, but:
- Remove repair service revenue from KPIs (goes to atelier)
- "Pending Repairs" → "Pending Work Orders" (read-only reference)
- Work order status visible in order detail

---

## 4. Atelier Stock — New `LensBlank` Model

Completely separate from `Product`. Managed exclusively by atelier.

### 4.1 LensBlank Model

```prisma
model LensBlank {
  id            String    @id @default(cuid())
  brand         String    // e.g., Essilor, Zeiss, Hoya
  lensType      LensType  // singleVision, progressive, bifocal, office, photochromic
  material      LensMaterial  // cr39, polycarbonate, highIndex, trivex
  coating       LensCoating   // none, ar, scratchResistant, blueBlock, etc.
  thickness     String    // e.g., "1.50", "1.67", "1.74"
  sphMin        Decimal   // minimum sphere value this blank covers
  sphMax        Decimal   // maximum sphere value
  cylMin        Decimal   // minimum cylinder value
  cylMax        Decimal   // maximum cylinder value
  costPrice     Decimal   // purchase cost from supplier
  sellingPrice  Decimal   // price charged to shop or optician shops
  quantity      Int       @default(0)
  fournisseurId String?   // FK → Fournisseur (preferred supplier)
  createdAt     DateTime
  updatedAt     DateTime
}
```

### 4.2 Stock Adjustments

```prisma
model LensBlankAdjustment {
  id            String    @id @default(cuid())
  lensBlankId   String    // FK → LensBlank
  quantity      Int       // negative for usage/loss, positive for restock
  reason        LensBlankAdjustmentReason
  // 'purchased' | 'used_in_mounting' | 'used_in_repair' | 'broken_during_mounting'
  workOrderId   String?   // FK → AtelierWorkOrder
  invoiceId     String?   // FK → PurchaseInvoice (if purchased from supplier)
  createdAt     DateTime
}
```

### 4.3 Lens Blank Selection During Work Order

1. System prompts "Select lens blank for LEFT eye"
2. User searches by: brand, lens type, material, coating, thickness, or sph range
3. System shows matching stock with available quantity + selling price
4. User selects → decrements stock → records as `used_in_mounting`
5. Repeat for RIGHT eye
6. If out of stock → offer to **purchase from supplier** (see section 6)

### 4.4 Statistics

- Stock level per brand / thickness / sph range
- Fastest-moving blanks (by qty used per month)
- Profit margin per blank: `sellingPrice - costPrice`
- Consumption trends (for reorder planning)

---

## 5. Pricing Rules

### 5.1 For Shop (Sofien Optic)
- **Lens blanks**: charged at `sellingPrice` (cost + markup)
- **Service fee**: €0 (free)

### 5.2 For Optician Shops
- **Lens blanks**: charged at `sellingPrice` (cost + markup)
- **Mounting service fee**: atelier sets the price
- **Repair service fee**: atelier sets the price
- Payment: cash, cheque, traite, or transfer

---

## 6. On-the-Fly Lens Blank Purchase

### 6.1 Out-of-Stock Purchase Flow

1. During work order: lens blank not found in stock
2. User clicks "Purchase from supplier"
3. Dialog: select supplier, enter quantity, unit price, supplier invoice reference
4. System:
   - Creates a **PurchaseInvoice** (entity: `atelier`)
   - Creates **LensBlankAdjustment** with reason `purchased`
   - Increments stock
   - Auto-selects the purchased blank for the work order
5. Continue with mounting

### 6.2 Breakage → Replacement Flow

1. On work order: "Declare Breakage" button
2. Select side: left / right / both
3. **For the broken blank**:
   - Creates `LensBlankAdjustment` with reason `broken_during_mounting`, qty = -1
   - Updates `AtelierWorkOrder.brokenLensBlank`
4. **For the replacement**:
   - If in stock: select → decrement → `used_in_mounting`
   - If not in stock: same purchase flow as 6.1 → auto-select
5. Updates `AtelierWorkOrder.replacementLeftId` / `replacementRightId`

### 6.3 Breakage Stats

- `breakageRate = (broken / totalUsed) × 100`
- Most common breakage scenarios (by brand, thickness)
- Cost of breakage: `costPrice × brokenQty`

---

## 7. Atelier Billing & Invoicing

### 7.1 Per-Work-Order Bill (printable)

For optician shop work orders (and shop internal bills):
- Work order number, date
- Client (optician shop name or "Sofien Optic")
- Lens blank: brand, type, sph/cyl, quantity, price
- Service fee: description + price
- Total
- Payment status + method

### 7.2 Periodic Invoice (for optician shops)

- Weekly / monthly / yearly per optician shop
- List of all work orders in period
- Running totals (lens blanks + services)
- Outstanding balance

### 7.3 Monthly Settlement (shop ↔ atelier)

- All lens blanks used by shop in the month
- Total amount due from shop to atelier
- Internal report for accounting (no real payment needed unless they choose to transfer)

---

## 8. Role-Based Separation

### 8.1 Roles Enum

```prisma
enum UserRole {
  admin    // sees everything
  shop     // retail operations
  atelier  // workshop operations
}
```

Add `role` field to `User` model (`admin` default for existing users).

### 8.2 View Permissions

| View | admin | shop | atelier |
|------|-------|------|---------|
| Dashboard (shop KPIs) | ✅ | ✅ | ❌ |
| Dashboard (atelier KPIs) | ✅ | ❌ | ✅ |
| Clients | ✅ | ✅ | ❌ |
| Orders | ✅ | ✅ | read-only (linked work orders) |
| Shop Stock (`Product`) | ✅ | ✅ | ❌ |
| Lens Blanks (`LensBlank`) | ✅ | ❌ | ✅ |
| Atelier Work Orders | ✅ | read-only (linked) | ✅ (CRUD) |
| Optician Shops | ✅ | ❌ | ✅ |
| Supplier Invoices | ✅ | own (shop) | own (atelier) |
| Prescriptions | ✅ | ✅ | ❌ |
| Settings | ✅ | ✅ (shop section) | ✅ (atelier section) |
| Fournisseurs | ✅ | ✅ | ✅ |
| Cheques / Traites | ✅ | own | own |

### 8.3 Navigation

- **Shop role**: dashboard, clients, orders, shop stock, prescriptions, billing, reports, settings
- **Atelier role**: dashboard, work orders, lens blanks stock, optician shops, supplier invoices (atelier), settings
- **Admin**: tabbed nav with both sections

---

## 9. Settings

### 9.1 Settings Page Restructure

**Shop settings** (existing):
- Language, Profile, Password
- Lens brands
- Repair services (shared, read-only for shop)
- SMS notifications

**Atelier settings** (new):
- Language, Profile, Password (shared)
- Lens blank brands (separate from lens brands)
- Repair service types with pricing (what atelier charges optician shops)
- Default markup rules (e.g., auto-calculate sellingPrice from costPrice + X%)
- Supplier management (filtered, shared with shop)

---

## 10. Responsive Design

- All new pages use existing responsive patterns (Tailwind breakpoints)
- Tables: horizontal scroll on mobile, card layout fallback
- Modals: `max-h-[85vh] overflow-y-auto` (pattern already established)
- Work order forms: slide-over on mobile, dialog on desktop
- Dashboard: stacked cards on mobile, grid on desktop

---

## 11. Translations (fr + en)

All new UI strings in both languages. Key additions:

| Key | English | French |
|-----|---------|--------|
| `atelier.dashboard` | Atelier Dashboard | Tableau de bord Atelier |
| `atelier.workOrders` | Work Orders | Ordres de travail |
| `atelier.lensBlanks` | Lens Blanks | Verres bruts |
| `atelier.lensBlankStock` | Lens Blank Stock | Stock de verres bruts |
| `atelier.mounting` | Mounting | Montage |
| `atelier.declareBreakage` | Declare Breakage | Déclarer une casse |
| `atelier.purchaseBlank` | Purchase Lens Blank | Acheter un verre |
| `atelier.revenueLensBlanks` | Lens Blank Revenue | Revenu des verres |
| `atelier.revenueServices` | Service Fee Revenue | Revenu des prestations |
| `atelier.breakageRate` | Breakage Rate | Taux de casse |
| `atelier.freeService` | Free (internal) | Gratuit (interne) |
| `atelier.bill` | Work Order Bill | Facture d'ordre de travail |
| `atelier.printBill` | Print Bill | Imprimer la facture |
| `payment.cheque` | Cheque | Chèque |
| `payment.traite` | Draft (Traite) | Traite |
| `payment.dueDate` | Due Date | Date d'échéance |
| `payment.pendingPayments` | Pending Payments | Paiements en attente |
| `payment.depositCheque` | Deposit Cheque | Déposer le chèque |
| `purchaseInvoice.title` | Supplier Invoices | Factures fournisseur |
| `purchaseInvoice.paymentStatus` | Payment Status | Statut du paiement |
| `role.shop` | Shop | Magasin |
| `role.atelier` | Atelier | Atelier |
| `lensBlank.brand` | Brand | Marque |
| `lensBlank.thickness` | Thickness | Épaisseur |
| `lensBlank.purchaseOnTheFly` | Purchase Replacement | Acheter un remplacement |
| `lensBlank.sphRange` | SPH Range | Plage SPH |
| `lensBlank.cylRange` | CYL Range | Plage CYL |

---

## Implementation Order

### Phase 1 — Data models & schema
1. Add `User.role` field
2. Create `Cheque`, `Traite` models
3. Create `PurchaseInvoice`, `PurchaseInvoiceItem`, `SupplierPayment` models
4. Create `LensBlank`, `LensBlankAdjustment` models
5. Rename `Repair` → `AtelierWorkOrder` with new fields
6. Extend `Payment` with `method`, `chequeId`, `dueDate`
7. Run migrations + retroactive data split (existing repairs → AtelierWorkOrder)

### Phase 2 — Payment methods
8. Payment method UI on order form
9. Cheque/Traite CRUD pages
10. Cheque deposit / Traite payment actions
11. Reminder notification engine (daily scan on app load)

### Phase 3 — Supplier invoices
12. Purchase invoice CRUD (entity-aware: shop vs atelier)
13. Supplier payment capture (with cheque/traite linking)
14. Invoice detail with payment timeline

### Phase 4 — Lens blank stock
15. Lens blank management (CRUD + stock adjustments)
16. Low stock alerts on atelier dashboard
17. On-the-fly purchase from supplier (out-of-stock + breakage flows)

### Phase 5 — Atelier workflow
18. AtelierWorkOrder list/detail page
19. Auto-create work order from shop orders (mounting type)
20. Lens blank selection during mounting
21. Breakage declaration + replacement purchase
22. Printable bill generation per work order
23. Atelier dashboard

### Phase 6 — Role separation
24. Auth: role in JWT/session
25. Navigation: role-based rendering
26. API: role-based guards

### Phase 7 — Settings & polish
27. Settings page split (shop vs atelier sections)
28. All fr/en translations verified
29. Responsive audit of all new pages
30. Retroactive data split for existing orders (separate shop vs atelier revenue in reports)
