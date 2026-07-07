# Sofien Optic — Full Project Testing Guide

**App:** Optical Shop & Atelier Management System
**Roles:** `admin`, `shop`, `atelier`
**Seed accounts:**
- `sofien@optic.tn` / `admin123` — Admin (full access)
- `shop@sofien.tn` / `123456` — Shop (sales, clients, orders)
- `atelier@sofien.tn` / `123456` — Atelier (lens blanks, work orders, optician shops)

---

## Table of Contents

1. [Auth & Role-Based Access](#1-auth--role-based-access)
2. [Dashboard](#2-dashboard)
3. [Clients](#3-clients)
4. [Stock / Products](#4-stock--products)
5. [Prescriptions](#5-prescriptions)
6. [Orders](#6-orders)
7. [Billing](#7-billing)
8. [Reports](#8-reports)
9. [Doctors](#9-doctors)
10. [Fournisseurs (Suppliers)](#10-fournisseurs-suppliers)
11. [Optician Shops](#11-optician-shops)
12. [Lens Blanks](#12-lens-blanks)
13. [Atelier Work Orders](#13-atelier-work-orders)
14. [Purchase Invoices](#14-purchase-invoices)
15. [Repair Services & Lens Brands (Settings)](#15-repair-services--lens-brands-settings)
16. [Notifications](#16-notifications)
17. [QR Code](#17-qr-code)
18. [Import (CSV)](#18-import-csv)
19. [Export](#19-export)
20. [Edge Cases & Security](#20-edge-cases--security)
21. [Integration Flows](#21-integration-flows)

---

## 1. Auth & Role-Based Access

### Login
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.1 | Successful admin login | Navigate to `/login`, enter `sofien@optic.tn` / `admin123`, submit | Redirect to dashboard, auth cookie set, user name shown in header |
| 1.2 | Successful shop login | Login as `shop@sofien.tn` / `123456` | Dashboard visible, sidebar only shows role-appropriate nav items |
| 1.3 | Successful atelier login | Login as `atelier@sofien.tn` / `123456` | Dashboard visible, sidebar shows atelier-specific nav items |
| 1.4 | Invalid credentials | Enter wrong password | Error toast: "Email ou mot de passe incorrect" |
| 1.5 | Empty email or password | Submit empty form | Client-side validation prevents submission |
| 1.6 | Non-existent user | Enter unknown email | Error toast, stay on login page |
| 1.7 | Logout | Click logout in settings or header | Cookie cleared, redirected to login |

### Role-Based Navigation
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.8 | Admin sees all nav items | Login as admin | All sidebar items visible |
| 1.9 | Shop cannot see atelier items | Login as shop | "Lens Blanks", "Atelier Work Orders", "Optician Shops" NOT in sidebar or mobile nav |
| 1.10 | Atelier cannot see shop items | Login as atelier | "Orders", "Clients", "Billing", "Doctors" NOT in sidebar |
| 1.11 | Direct URL access blocked | As shop user, navigate to `/api/lens-blanks` directly | Should return 401/403 |
| 1.12 | Mobile nav respects roles | Login as each role on mobile viewport | Bottom nav + "More" sheet filtered per role |

### Password Change
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.13 | Successful password change | Settings → Profile → enter current + new password | 204 No Content, success message |
| 1.14 | Wrong current password | Enter incorrect current password | Error toast |
| 1.15 | New password too short | Enter < 6 characters | Client-side validation |
| 1.16 | Re-login with new password | After change, logout and login with new password | Login succeeds |

---

## 2. Dashboard

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.1 | KPIs load | Login as any role | 6 KPI cards displayed with correct values |
| 2.2 | Ready orders section | Create an order, mark as ready | Order appears in "Ready for Pickup" section |
| 2.3 | View ready order detail | Click "View" on a ready order | OrderDetailDialog opens with all details |
| 2.4 | Quick nav buttons work | Click "New Order", "Repairs", "Optician Shops" | Navigates to respective view |
| 2.5 | Dashboard data updates | After creating/deleting an order | KPIs refresh (may need page reload) |

---

## 3. Clients

### CRUD
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.1 | Create client (wizard) | Clients → "New Client" → fill name*, familyName*, phone* → Next → optionally create prescription → Save | Client created, success toast |
| 3.2 | Create client (basic only) | Click "Skip Prescription" in wizard | Client created without prescription |
| 3.3 | View client detail | Click a client card → "View Orders" | Navigate to client detail showing orders |
| 3.4 | Edit client | Click edit icon on a client → modify name/phone/address | Updates persisted |
| 3.5 | Delete client | Click delete → confirm | Client removed, success toast |
| 3.6 | Search clients | Type in search box | Filtered results after 300ms debounce |
| 3.7 | Export clients | Click Export button | CSV file downloaded |

### Validation
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.8 | Duplicate phone | Create client with existing phone | 409 error: "Un client avec ce numéro existe déjà" |
| 3.9 | Missing required fields | Submit form with empty name | Field highlighted, form not submitted |
| 3.10 | Edit phone to existing number | Change phone to another client's number | Duplicate error |

---

## 4. Stock / Products

### CRUD
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.1 | Create a frame product | Stock → "New Product" → Category: Lunette → fill name, brand, model, price, quantity, cost price, supplier | Product created with QR code |
| 4.2 | Create a lens product | New Product → Category: Verre → fill lens parameters (type, material, coating, SPH, CYL, ADD) | Product created |
| 4.3 | Create a contact lens | New Product → Category: Lentille → select brand from lens brands, fill parameters | Product created |
| 4.4 | Create an accessory | New Product → Category: Accessory → fill name, price, quantity | Product created |
| 4.5 | Edit product | Click edit → modify any field | Updates persisted |
| 4.6 | Delete product | Click delete → confirm | Product removed |
| 4.7 | View QR code | Click QR icon on a product | QR label dialog with printable tag |

### Filtering
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.8 | Search by name/brand | Type in search box | Products filtered |
| 4.9 | Filter by category | Select category from dropdown | Only that category shown |
| 4.10 | Filter by stock status | Select "Low Stock" | Products with qty ≤ 3 shown |
| 4.11 | Filter by lens parameters | Select Verre category, set lens type, coating, SPH range | Products matching all criteria shown |
| 4.12 | Filter by supplier | Select a supplier | Only that supplier's products shown |

### Stock Status
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.13 | Product qty = 0 | Create/update product with qty 0 | Badge shows "Out of Stock" (red) |
| 4.14 | Product qty ≤ 3 | Set qty to 2 | Badge shows "Low Stock" (yellow/warning) |
| 4.15 | Product qty > 3 | Set qty to 10 | Badge shows "In Stock" (green) |

---

## 5. Prescriptions

### CRUD
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.1 | Create prescription | Prescriptions → "New Prescription" → select client, doctor, fill all eye measurements, date | Created, shown in card grid |
| 5.2 | Edit prescription | Click edit on a card → modify values | Updated |
| 5.3 | Delete prescription | Click delete → confirm | Removed |
| 5.4 | Search by client | Type client name | Filtered cards |
| 5.5 | View prescription cards | Navigate to prescriptions | 2-column grid with OD/OG tables |

### OCR Upload
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.6 | Upload valid prescription image | Click "Upload" in prescription form, select a clear prescription photo | Fields auto-filled from OCR |
| 5.7 | Upload invalid image | Upload non-prescription image | Error message returned from API |
| 5.8 | No API key configured | Attempt OCR with `GROQ_API_KEY` missing | Error handled gracefully |

### Validation
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.9 | Missing required fields | Submit with empty client or missing eye values | Validation prevents submission |
| 5.10 | Invalid axis values | Enter axis > 180 or < 0 | Should clamp or reject (check schema) |

---

## 6. Orders

### Create Order
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6.1 | Standard order (prescription + frame + repairs) | Orders → "New Order" → select Standard → client → prescription → items (frame) → repairs → payment → Save | Order created, stock deducted, work orders created for repairs |
| 6.2 | Remounting order (client's frame) | New Order → Remounting → client → prescription → repairs → payment | Order created, no items, work orders created |
| 6.3 | Direct sale (accessory) | New Order → Direct Sale → client → items (accessory) → full payment auto-set | Order completed immediately, stock deducted |
| 6.4 | Add items via QR scan | In order form, click QR scan icon, scan product QR | Product added to items list |
| 6.5 | Add repair services | Select repair services from checkboxes, set individual completion dates | Work orders linked to order |
| 6.6 | Payment with cheque | Select payment method "Cheque", fill cheque number, bank, due date | Cheque record created, linked to payment |
| 6.7 | Payment with traite | Select "Traite", fill traite number, due date | Traite record created |

### Order Lifecycle
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6.8 | Mark as ready | In OrderDetailDialog → "Mark as Ready" | Status → `ready` |
| 6.9 | Mark as completed (picked up) | Ready order → "Mark as Picked Up" | Status → `completed` |
| 6.10 | Cancel an order | Click "Cancel" in detail dialog | Status → `cancelled`, stock restored |
| 6.11 | View order detail | Click any order row | Full detail dialog with items, payments, history |

### Payment
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6.12 | Add payment to existing order | Open order detail → "Add Payment" → enter amount, method | Payment added, balance updated |
| 6.13 | Full payment auto-completes | Add payment where total paid ≥ total amount | Order status → `completed` |
| 6.14 | Partial payment | Enter amount less than total | Status stays `pending` or `ready`, balance shown |
| 6.15 | Multiple payments on one order | Add multiple payment records | All shown in payment history, cumulative total |

### Search
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6.16 | Search by client name | Type in search box | Orders for that client only |
| 6.17 | Search by order ID | Enter order number | Direct match returned |

### Edge Cases
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6.18 | Order with insufficient stock | Try to create order with qty > available stock | Error: stock insufficient |
| 6.19 | Create order with no client | Submit without selecting client | Validation prevents submission |
| 6.20 | Cancel and re-check stock | Cancel an order, verify product quantities restored | Stock incremented by original item qty |

---

## 7. Billing

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 7.1 | View billing list | Navigate to Billing | List of orders with payment status |
| 7.2 | Filter by status | Select "Completed" or "Pending" | Filtered results |
| 7.3 | Search billing records | Type client name | Filtered |
| 7.4 | View invoice detail | Click a billing record | BillingInvoiceDialog with full invoice |
| 7.5 | Print invoice | Click "Print" in invoice dialog | Browser print dialog with formatted invoice |
| 7.6 | Quick sale | Click "Quick Sale" | OrderForm opens with `direct_sale` forced |
| 7.7 | Run period report | Click "Reports" → select period (Today/Week/Month) | Summary cards + detail table |
| 7.8 | Print period report | Click "Print" in report dialog | Print dialog |

---

## 8. Reports

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 8.1 | Load reports | Navigate to Reports | Default period (Month) data loaded |
| 8.2 | Change period | Select "Today" | KPIs update for today's data |
| 8.3 | All KPIs visible | Verify all 10 KPI cards displayed | Revenue, Profit, Avg Order, New Clients, Outstanding Balance, etc. |
| 8.4 | Monthly revenue chart | Check chart section | 12-month horizontal bar chart |
| 8.5 | Revenue by type | Check breakdown | Standard / Remounting / Direct Sale |
| 8.6 | Orders by status | Check status distribution | Pending / Completed / Cancelled counts |
| 8.7 | Top products by category | Scroll to bottom | Table per category with product, qty, revenue, profit |

---

## 9. Doctors

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 9.1 | Create doctor | Doctors → "Add Doctor" → fill name*, phone*, specialization | Created |
| 9.2 | Edit doctor | Click edit → modify | Updated |
| 9.3 | Delete doctor | Click delete → confirm | Removed |
| 9.4 | Search doctors | Type name or specialization | Filtered |
| 9.5 | View doctor's patients | Click a doctor card | Dialog showing linked patients with prescription dates |

---

## 10. Fournisseurs (Suppliers)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 10.1 | Create supplier | Fournisseurs → "Add Supplier" → fill name*, phone* | Created |
| 10.2 | Edit supplier | Click edit → modify | Updated |
| 10.3 | Delete supplier with no products | Delete a supplier with no linked products | Removed |
| 10.4 | Delete supplier with products | Try to delete a supplier that has products | Should fail (constraint) |
| 10.5 | View supplier products | Click a supplier card | Dialog with products table + sold status filter |
| 10.6 | Search suppliers | Type name or phone | Filtered |
| 10.7 | Export suppliers | Click Export | CSV downloaded |

---

## 11. Optician Shops

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.1 | Create optician shop | Optician Shops → "Add Shop" → fill name*, phone* | Created |
| 11.2 | Edit shop | Click edit → modify | Updated |
| 11.3 | Delete shop with no linked work orders | Delete a shop with no work orders | Removed |
| 11.4 | Delete shop with linked work orders | Try to delete a shop that has work orders | Should fail (constraint) |
| 11.5 | Search shops | Type name or phone | Filtered |

---

## 12. Lens Blanks

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 12.1 | Create lens blank | Lens Blanks → "New Lens Blank" → fill brand, type, material, coating, thickness, SPH/CYL ranges, prices, quantity, supplier | Created |
| 12.2 | Edit lens blank | Click edit → modify fields | Updated |
| 12.3 | Delete lens blank | Click delete → confirm | Removed |
| 12.4 | Adjust stock (add) | Click adjust → enter +5 qty, reason: "purchased" | Stock increased, adjustment record created |
| 12.5 | Adjust stock (remove) | Click adjust → enter -2 qty, reason: "used_in_mounting" | Stock decreased |
| 12.6 | Adjust stock insufficient | Try to adjust -100 when only 10 in stock | Error: insufficient stock |
| 12.7 | Filter lens blanks | Search by brand, filter by type/material/coating | Filtered results |
| 12.8 | Low stock filter | Enable "Low Stock" filter | Only qty ≤ 3 shown |

---

## 13. Atelier Work Orders

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 13.1 | View work orders | Navigate to Atelier Work Orders | Summary cards + tabbed table |
| 13.2 | Filter by status tabs | Click Pending / In Progress / Completed / Delivered tabs | Filtered table |
| 13.3 | Filter by source | Select Internal or Optician | Filtered |
| 13.4 | Filter by type | Select Mounting or Repair | Filtered |
| 13.5 | View work order detail | Click any row | WorkOrderDetailDialog with all details |

### Status Transitions
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 13.6 | Start work (pending → in_progress) | In detail dialog → click "Start" | Status updated, `startedAt` set |
| 13.7 | Complete work (in_progress → completed) | Click "Complete" | Status updated, `completedAt` set |
| 13.8 | Deliver (completed → delivered) | Click "Delivered" | Status updated |
| 13.9 | Cancel work order (pending → cancelled) | Click "Cancel" | Status → cancelled |
| 13.10 | Try invalid transition (pending → delivered) | Button should be disabled | Transition not allowed |

### Lens Blank Assignment
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 13.11 | Assign lens blanks to mounting order | Open a Mounting work order → select left/right blanks → frame source → price → "Assign & Save" | Blanks assigned, stock adjusted (used_in_mounting) |
| 13.12 | Assign without sufficient stock | Try to assign a blank with qty 0 | Error |

### Breakage
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 13.13 | Declare left lens breakage | Click "Declare Breakage" → select "Left" → choose replacement blank | Breakage recorded, replacement blank deducted |
| 13.14 | Declare both lenses broken | Select "Both" → choose replacements | Both recorded |
| 13.15 | No breakage | Declare "None" | Breakage field stays 'none' |

### Print Bill
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 13.16 | Print bill for work order | In detail dialog → "Print Bill" | Formatted bill opens in print dialog |

---

## 14. Purchase Invoices

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 14.1 | Create shop purchase invoice | Purchase Invoices → "New Invoice" → entity: Shop → select supplier → add product line items (qty, unit price) → Save | Invoice created, stock adjusted |
| 14.2 | Create atelier purchase invoice | Entity: Atelier → add lens blank line items | Invoice created, lens blank stock adjusted |
| 14.3 | Create with initial payment | Add payment (cash/cheque/traite) during creation | Payment recorded, paidAmount updated |
| 14.4 | Create with cheque payment | Method: Cheque → fill cheque details | Cheque record created |
| 14.5 | Add payment to existing invoice | Click invoice → "Add Payment" → enter amount, method | SupplierPayment created, paidAmount incremented |
| 14.6 | Add cheque payment to existing invoice | Add payment → method: Cheque | Cheque record linked |
| 14.7 | Filter by entity | Select "Shop" or "Atelier" | Filtered invoices |
| 14.8 | Filter by payment status | Select "Unpaid" / "Partially Paid" / "Fully Paid" | Filtered correctly |
| 14.9 | View invoice detail | Click invoice row | Details with items, payments |

---

## 15. Repair Services & Lens Brands (Settings)

### Repair Services
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 15.1 | Create repair service | Settings → Repair Services → "Add" → name + default price | Created |
| 15.2 | Edit repair service | Click edit → modify name/price | Updated |
| 15.3 | Delete repair service with no links | Delete a service with no linked work orders | Removed |
| 15.4 | Delete repair service with linked work orders | Try to delete a service that has linked work orders | Error 409 (conflict) |
| 15.5 | Repair service appears in order form | Create order → repairs section | New service available as checkbox |

### Lens Brands
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 15.6 | Create lens brand | Settings → Lens Brands → "Add" → name | Created |
| 15.7 | Edit lens brand | Click edit → modify name | Updated |
| 15.8 | Delete lens brand | Click delete → confirm | Removed |
| 15.9 | Brand available in stock form | Create lens/contact lens product | Brand in search-select dropdown |

### Role Access
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 15.10 | Shop cannot see atelier settings | Login as shop | Repair Services, Lens Brands sections hidden |
| 15.11 | Atelier can see atelier settings | Login as atelier | Atelier settings visible |

---

## 16. Notifications

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 16.1 | Bell icon shows count | Login | Unread count badge on bell icon |
| 16.2 | View notification dropdown | Click bell icon | Dropdown with alert categories |
| 16.3 | Low stock alert | Set a product qty ≤ 3 | Notification appears in "Low Stock" category |
| 16.4 | Pending repair alert | Create work order with status pending | Alert in "Pending Repairs" |
| 16.5 | Ready order alert | Mark order as ready | Alert in "Ready Orders" |
| 16.6 | Pending payment alert | Create a cheque/traite due within 7 days | Alert in "Pending Payments" |
| 16.7 | Navigate from notification | Click an alert category | Navigates to relevant view |
| 16.8 | Notifications update | Resolve the underlying issue, wait 15s | Notification count decreases |

---

## 17. QR Code

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 17.1 | Lookup product by QR code | Navigate to QR Code → enter a QR code string → Search | Product card displayed with details |
| 17.2 | Invalid QR code | Enter a non-existent code | "No product found" empty state |
| 17.3 | Empty search | Click Search without entering code | Validation or no-op |

---

## 18. Import (CSV)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 18.1 | Upload clients CSV | Import → Clients → upload CSV with proper columns | Step 2 shows column mapping |
| 18.2 | Auto-detect French column names | CSV with "nom", "prénom", "téléphone" | Mappings auto-detected |
| 18.3 | Map columns manually | Change mapping dropdown for a column | Mapping updates |
| 18.4 | Preview import | After mapping → "Preview" | Up to 50 rows shown, duplicates highlighted in red |
| 18.5 | Confirm import | Click "Import" | Records created, summary shown |
| 18.6 | Import duplicate phones | CSV contains phone that already exists | Row flagged as duplicate in preview, skipped during import |
| 18.7 | Import with missing required fields | Required column not mapped | Cannot proceed past mapping step |
| 18.8 | Upload suppliers CSV | Repeat import with entity "Suppliers" | Suppliers created |

---

## 19. Export

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 19.1 | Export clients | Clients page → Export | CSV file downloads |
| 19.2 | Export suppliers | Fournisseurs page → Export | CSV file downloads |
| 19.3 | Export products | Stock page → Export | CSV file downloads |
| 19.4 | Export orders | Orders page → Export | CSV file downloads |
| 19.5 | Verify export content | Open CSV in Excel/editor | Headers + all data rows |
| 19.6 | Export with filters | Apply search filter, then export | Only filtered results exported |

---

## 20. Edge Cases & Security

### API Validation
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 20.1 | Malformed JSON body | Send `POST /api/clients` with invalid JSON | 400 Bad Request |
| 20.2 | Missing required fields | Send POST without required field | 400 with validation errors |
| 20.3 | Invalid email format | Login with malformed email | Appropriate error |
| 20.4 | XSS in text fields | Enter `<script>alert(1)</script>` in client name | Stored safely, rendered as text |
| 20.5 | SQL injection attempt | Enter `' OR 1=1--` in search field | No injection, treated as literal string |

### Concurrency / State
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 20.6 | Rapid double-click create | Click "Save" twice quickly on client form | Only one client created |
| 20.7 | Delete referenced entity | Delete a fournisseur who has products | Constraint error (restrict) |
| 20.8 | Large dataset | Import 1000 clients | Handles gracefully |
| 20.9 | Negative stock adjustment | Try to adjust stock below 0 | Error: insufficient stock |

### Auth Security
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 20.10 | Access API without cookie | Send request without `auth-token` | 401 Unauthorized |
| 20.11 | Tampered JWT | Modify the auth cookie value | 401, redirected to login |
| 20.12 | Expired JWT | Wait 7 days (or manipulate token expiry) | Auth fails, redirect to login |
| 20.13 | Role escalation | Shop user tries to access admin-only endpoint | 403 Forbidden |

---

## 21. Integration Flows

### Full Standard Order Flow
1. **Create client** → 2. **Create prescription** (or use OCR) → 3. **Create order** (standard type, select client, prescription, add frame item, add repair service, add payment) → 4. **Order created**, stock deducted → 5. **Atelier** sees work order → 6. **Assign lens blanks** → 7. **Start work** (in_progress) → 8. **Complete work** → 9. **Shop marks order ready** → 10. **Client picks up**, order completed

### Full Optician Repair Flow
1. **Create optician shop** → 2. **From dashboard → Repairs → New Optician Repair** → 3. **Select shop, repair service, price, due date** → 4. **Work order appears in Atelier Work Orders** as external source → 5. **Assign lens blanks** (if mounting) → 6. **Complete work** → 7. **SMS sent to optician** → 8. **Deliver**

### Purchase & Stock Flow
1. **Create fournisseur** → 2. **Create purchase invoice** (shop entity, add items, optionally pay) → 3. **Stock adjusted** (products increased) → 4. **Add more payments** to fully pay invoice → 5. **Create atelier purchase invoice** for lens blanks → 6. **Lens blank stock adjusted** (purchased adjustments)

### Billing & Payment Flow
1. **Create orders with various payment methods** → 2. **View in Billing** with payment status → 3. **Add additional payments** to partially-paid orders → 4. **Run period report** for revenue summary → 5. **Print invoice** for client

### Lens Blank Lifecycle
1. **Create lens blank** (via purchase invoice or directly) → 2. **Assign to work order** (used_in_mounting) → 3. **Stock decreases** → 4. **If broken during mounting**, declare breakage → 5. **Replacement blank assigned** → 6. **Purchase more** via atelier purchase invoice → 7. **View all adjustments** on the lens blank detail

---

## Checklist by Role

### Admin — Full Regression
- [ ] Auth (login/logout/password change)
- [ ] All CRUD operations on every entity
- [ ] All status transitions
- [ ] Reports data accuracy
- [ ] Notifications
- [ ] Import/Export
- [ ] Settings (lens brands, repair services)
- [ ] QR code lookup
- [ ] All edge cases

### Shop — Sales Focus
- [ ] Clients CRUD
- [ ] Prescriptions CRUD + OCR
- [ ] Orders CRUD (all types)
- [ ] Payments (cash, cheque, traite, card, transfer)
- [ ] Billing (view, print invoices, quick sale)
- [ ] Stock (view, filter)
- [ ] Dashboard KPIs
- [ ] Import clients/suppliers
- [ ] Cannot access: lens blanks, atelier work orders, optician shops
- [ ] Reports (read-only)

### Atelier — Workshop Focus
- [ ] Lens blanks (CRUD, stock adjustments)
- [ ] Atelier work orders (view, status transitions, lens blank assignment, breakage)
- [ ] Optician shops (CRUD)
- [ ] Purchase invoices (atelier entity)
- [ ] Stock (view products)
- [ ] Dashboard KPIs
- [ ] Settings (repair services, lens brands)
- [ ] Notifications
- [ ] Cannot access: clients, orders, billing, doctors, import
