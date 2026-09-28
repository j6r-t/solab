# Sofien Optic Lab — Complete User Workflow Catalog

Every user workflow in the application, derived from the code: `nav-config.ts` (VIEW_ROLES), `page.tsx` (view registry), the module pages/dialogs, and the services they call (order, repair, optician-shop-bill, cheque, purchase-invoice, stock, auth, audit, import, notifications).

## Contents

| # | Workflow | Roles |
|---|---|---|
| W1 | Login / session | all |
| W2 | First-run admin setup | public |
| W3 | Logout | all |
| W4 | Profile & password | all |
| W5 | Client management | admin, shop |
| W6 | Doctor management | admin, shop |
| W7 | Order creation (full flow) | admin, shop |
| W8 | Order status & payment actions | admin, shop |
| W9 | Quick sale (direct sale) | admin, shop |
| W10 | Billing & printing | admin, shop |
| W11 | Cheque / traite lifecycle | admin, shop (atelier: scoped) |
| W12 | Optician shop management | admin, atelier |
| W13 | Optician work order creation | admin, atelier |
| W14 | Work order processing | admin, atelier |
| W15 | Lens blank assignment | admin, atelier |
| W16 | Breakage declaration | admin, atelier |
| W17 | Lens blanks inventory | admin, atelier (read: +shop) |
| W18 | Optician billing & grouping | admin, atelier |
| W19 | Supplier (fournisseur) management | all (entity-scoped) |
| W20 | Purchase invoices & supplier grouping | admin, shop (+atelier via Invoices) |
| W21 | Retail stock & QR codes | admin, shop |
| W22 | CSV import wizard | admin, shop |
| W23 | Reports & audit logs | all / admin |
| W24 | Notifications & alerts | all (type-filtered) |

---

## 0. Role access matrix

| View | admin | shop | atelier |
|---|---|---|---|
| Dashboard, Reports, Settings | ✓ | ✓ | ✓ |
| Fournisseurs | ✓ | ✓ | ✓ |
| Clients, Doctors | ✓ | ✓ | — |
| Stock, Orders, Billing, Cheques | ✓ | ✓ | — |
| Purchase invoices, Import, QR lookup | ✓ | ✓ | — |
| Lens blanks | ✓ | — | ✓ |
| Atelier work orders | ✓ | — | ✓ |
| Optician shops | ✓ | — | ✓ |
| Invoices (optician + supplier bills) | ✓ | — | ✓ |
| Audit logs | ✓ | — | — |

Role behavior: shop sees **cost prices** for lens blanks, **free** repair-service lines, and the stock page hides the `verre` category; item prices are read-only for shop. Dashboard/Reports auto-split by entity (`shop` vs `atelier`). Repair-services and lens-brands catalogs: readable by all, writable by admin + atelier. The atelier role is **hard-scoped server-side** on cheque endpoints to optician-bill/supplier instruments only.

---

## W1 — Login / session

```mermaid
flowchart TD
    A(["Open /"]) --> B{"Authenticated?<br/>localStorage token"}
    B -- "yes" --> H["Dashboard — nav filtered by role"]
    B -- "no" --> L["Login page — email + password<br/>default locale FR"]
    L --> API["POST /api/auth/login<br/>bcrypt check · JWT 7d · httpOnly cookie"]
    API -- "wrong credentials" --> L
    API -- "ok" --> S["setAuth → localStorage<br/>auth-token + auth-user<br/>view-store reset · audit USER_LOGIN"]
    S --> H
    H -. "401 on any API call" .-> T["error toast —<br/>no auto-logout (fetch client throws)"]
```

## W2 — First-run admin setup

```mermaid
flowchart TD
    A["POST /api/auth/setup — public, once"] --> B{"Any user exists?"}
    B -- "yes" --> C["400 — Admin user already exists"]
    B -- "no" --> D["Create owner admin<br/>owner@sofien.tn · random 16-char password"]
    D --> E["Response includes defaultPassword<br/>audit ADMIN_SETUP"]
```

## W3 — Logout

```mermaid
flowchart TD
    A["Logout — sidebar / header"] --> B["queryClient.cancelQueries"]
    B --> C["logout(): reset view-store<br/>remove auth-token + auth-user"]
    C --> D["queryClient.clear"]
    D --> E["router.push /"]
    E -. "fire-and-forget" .-> F["POST /api/auth/logout<br/>cookie deleted · audit USER_LOGOUT"]
```

## W4 — Profile & password (Settings, all roles)

```mermaid
flowchart TD
    subgraph SET["Settings page"]
        P["Edit name / email"] --> PP["PATCH /api/auth/profile<br/>email uniqueness check"]
        PP --> T["Response: fresh JWT<br/>setAuth overwrites token+user<br/>audit PROFILE_UPDATED"]
        PW["Change password"] --> G["Client guards:<br/>mismatch toast · min 6 chars"]
        G --> CP["POST /api/auth/change-password<br/>current password verified<br/>audit PASSWORD_CHANGED"]
        LANG["Language: English / Français"] --> LS["locale store · key sofien_optique_locale"]
        THEME["Theme: Light / Dark / System"] --> TS["theme store · key sofien_optic_theme<br/>dark class on html"]
    end
```

Admin/atelier also get catalog CRUD cards here: **Lens brands** and **Repair services** (name + defaultPrice) — list / create / rename / delete.

---

## W5 — Client management (admin, shop)

```mermaid
flowchart TD
    A["Clients page — debounced search<br/>name · familyName · phone"] --> B{"Action"}
    B -- "New Client" --> W["2-step wizard"]
    W --> W1["Step 1 — Client form:<br/>name* familyName* phone*<br/>gender · birthDate · address · organization · notes"]
    W1 --> W2["POST /api/clients<br/>duplicate phone → conflict<br/>audit CLIENT_CREATED"]
    W2 --> W3["Step 2 — Prescription form<br/>POST /api/prescriptions"]
    B -- "Edit" --> E["PATCH /api/clients/:id<br/>audit CLIENT_UPDATED"]
    B -- "Delete" --> D["Confirm → soft delete<br/>audit CLIENT_DELETED"]
    B -- "Open" --> V["Client detail"]
    V --> V1["Prescriptions:<br/>new · edit · hard delete"]
    V --> V2["Order history cards<br/>status + payment badges<br/>New Order shortcut"]
    B -- "Export" --> X["GET /api/export/clients — CSV"]
```

## W6 — Doctor management (admin, shop)

```mermaid
flowchart TD
    A["Doctors page — search name/phone/specialization<br/>prescription-count badges"] --> B{"Action"}
    B -- "Add Doctor" --> C["name* · phone · specialization · address<br/>POST /api/doctors"]
    B -- "Edit" --> E["PATCH /api/doctors/:id"]
    B -- "Delete" --> F["Confirm → soft delete"]
    B -- "Open card" --> G["Patients dialog — read-only list of<br/>prescriptions incl. client + date"]
```

## W7 — Order creation (admin, shop)

```mermaid
flowchart TD
    S["New Order — from Orders page,<br/>client detail, or dashboard"] --> T["1 · Type — standard / remounting / direct_sale"]
    T --> C["2 · Client — search select*"]
    C --> R{"standard or remounting?"}
    R -- "yes" --> RX["3 · Prescription — client's list,<br/>first auto-selected · or create new<br/>(doctor, date, OD/OG values)"]
    RX --> LB["4 · Lens blank picker — admin only<br/>auto-filtered by Rx SPH/CYL<br/>+ thickness / type / material / coating<br/>Add disabled at zero stock"]
    LB --> EXP["5 · Expected completion date<br/>→ turnaroundDays"]
    R -- "no" --> IT
    EXP --> IT["6 · Items — products with qty > 0<br/>QR camera scan adds a product<br/>unit price editable except for shop"]
    IT --> RP{"Repair services configured?"}
    RP -- "yes" --> RP1["Checkbox per service + date<br/>shop: Free (price 0) · admin: defaultPrice"]
    RP -- "no" --> RP2["Free-text repair rows (type/price/date)"]
    RP1 --> PAY
    RP2 --> PAY
    PAY{"7 · direct_sale?"}
    PAY -- "yes" --> AUTO["Auto full cash payment of total"]
    PAY -- "no" --> ROWS["Full / Deposit toggle<br/>payment rows: cash · card · cheque · traite<br/>cheque/traite: number + bank + due date"]
    ROWS --> SUB["Submit — POST /api/orders"]
    AUTO --> SUB
    SUB --> FX["Server transaction:<br/>product qty -1 + adjustment 'sale'<br/>lens blank qty -1<br/>cheques created as pending<br/>repairs → internal work orders pending"]
    FX --> ST{"Initial status"}
    ST -- "direct_sale or full cash/card" --> D1["completed"]
    ST -- "otherwise" --> D2["pending"]
    D1 --> PR["Print facture prompt"]
    D2 --> PR
```

## W8 — Order status & payment actions (dashboard + order detail)

```mermaid
stateDiagram-v2
    direction LR
    [*] --> pending: created without full cash/card payment
    [*] --> completed: direct_sale / paid in full
    pending --> ready: Mark Ready
    pending --> cancelled: restocks items · ORDER_CANCELLED
    ready --> completed: Mark Picked Up — linked WOs → delivered · ORDER_COMPLETED
    ready --> cancelled: restocks items
    completed --> [*]
    cancelled --> [*]
```

```mermaid
flowchart TD
    O["Order with balance > 0<br/>and status ≠ cancelled"] --> PM["Record Payment — cash / card only<br/>(cheques handled on Cheques page)"]
    PM --> CH{"effective paid ≥ total?"}
    CH -- "yes" --> AC["Order auto-completed<br/>linked work orders → delivered<br/>audit PAYMENT_ADDED"]
    CH -- "no" --> PR["payment recorded · overpay blocked"]
```

Note: a delete-order API exists (restock + soft delete + `ORDER_DELETED`) but **no UI button is wired** — dead-end listed in §Dead-ends.

## W9 — Quick sale

```mermaid
flowchart TD
    B["Billing page — Quick Sale"] --> F["OrderForm forced to direct_sale"]
    F --> C["Client + items only<br/>(no prescription / repairs)"]
    C --> A["Auto full cash payment<br/>→ order completed immediately"]
    A --> P["Print facture"]
```

## W10 — Billing & printing (admin, shop)

```mermaid
flowchart TD
    B["Billing page — read-only view over orders<br/>search + status filter (cancelled excluded by default)"]
    B --> R["Reports dialog — today / week / month<br/>KPIs: revenue · paid · count<br/>Print report"]
    B --> ROW["Row click → invoice dialog<br/>facture preview: prescription grid,<br/>total / deposit / balance / promise date"]
    ROW --> P1["Print facture"]
    ROW --> P2["Print receipt<br/>(bounced cheques excluded from paid)"]
```

## W11 — Cheque / traite lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> pending: created by order / bill / invoice payment
    pending --> cashed: client cheque marked ✓
    pending --> paid: supplier cheque marked ✓
    pending --> bounced: marked ✗ (confirm + traite warning)
    cashed --> [*]
    paid --> [*]
    bounced --> [*]
```

```mermaid
flowchart TD
    A["Cheques page — totals: pending / collected / bounced<br/>filters: status × entity type"] --> B{"Action on pending cheque"}
    B -- "✓ cashed (client) / paid (supplier)" --> C["PATCH /api/cheques/:id<br/>audit CHEQUE_STATUS_UPDATED"]
    B -- "✗ bounced" --> C
    C --> D["Re-sync linked documents:<br/>order paid status (computed on read)<br/>optician bill / consolidated invoice<br/>purchase invoice / supplier consolidated"]
    ALERT["DueChequesAlert — all roles<br/>pending cheques due ≤ 3 days<br/>shown once per day (localStorage)"] --> OPEN["Open Cheques / Later"]
```

Atelier users are server-scoped to optician-bill and supplier cheques only; the cheques *view* is admin/shop.

---

## W12 — Optician shop management (admin, atelier)

```mermaid
flowchart TD
    O["Optician shops — search name/phone"] --> A["Add / Edit: name* · phone* · address · notes"]
    O --> D["Delete → soft delete<br/>(work orders keep source column)"]
```

## W13 — Optician work order creation (admin, atelier)

```mermaid
flowchart TD
    N["New Work Order — 4-step dialog"] --> S1["1 · Optician shop*"]
    S1 --> S2["2 · Services — multi-select<br/>price = defaultPrice each"]
    S2 --> S3["3 · Expected date — today or later"]
    S3 --> RX["Prescription — OD/OG SPH/CYL/AXIS/ADD/PD<br/>thickness · lensType · material · coating · notes"]
    RX --> OCR["Optional: photo import →<br/>OCR autofills Rx fields"]
    RX --> S4{"4 · Lens source?"}
    S4 -- "optician — default" --> NOB["No blanks — shop supplies lenses"]
    S4 -- "our stock" --> SB["Rx-filtered blank search<br/>left + right selects, qty > 0<br/>'None' allowed with warning"]
    NOB --> SUB["Submit — POST /api/repairs"]
    SB --> SUB
    SUB --> FX["Single transaction creates:<br/>work order (optician · pending)<br/>prescription + service lines<br/>bill FAC-ABBR-NNN status unpaid<br/>stock blanks -1 used_in_mounting<br/>audit REPAIR_CREATED"]
```

## W14 — Work order processing (admin, atelier)

Queue sorted by expected completion date; filters: status tabs, source (`internal` / `optician` — persisted column, safe when a shop was deleted), search by client or shop; due-date badges (overdue / today / days left).

```mermaid
stateDiagram-v2
    direction LR
    [*] --> pending: created
    pending --> in_progress: start — sets startedAt
    in_progress --> completed: complete — sets completedAt · REPAIR_COMPLETED
    completed --> delivered: deliver
    pending --> cancelled
    in_progress --> cancelled
    delivered --> [*]
    cancelled --> [*]

    note right of completed
        Order-linked: when every non-cancelled
        sibling work order is completed/delivered and
        the order is pending → order flips to 'ready'
        automatically (ORDER_AUTO_READY)
    end note
```

Payment block in the detail dialog: with a bill → bill badge + payments via bill; without (internal) → work-order ledger (servicePrice + lensBlankPrice, status pending/partial/paid) → cash payment (`WO_PAYMENT_RECORDED`), delegated to the bill when one exists.

## W15 — Lens blank assignment (admin, atelier)

```mermaid
flowchart TD
    A["Work order detail — Assign blanks"] --> B["Left / Right select (qty > 0)<br/>+ blank price input"]
    B --> C["Assign and Save<br/>PATCH action=assign-lens-blanks"]
    C --> N["Updates the 3 fields only —<br/>no stock movement, no bill change"]
```

## W16 — Breakage declaration (admin, atelier)

```mermaid
flowchart TD
    A["Declare breakage — visible when a blank<br/>is assigned and none declared yet"] --> B["Which eye: left / right / both"]
    B --> C{"Stock-sourced blank<br/>+ replacement chosen?"}
    C -- "yes" --> D["Replacement qty -1<br/>adjustment broken_during_mounting"]
    C -- "no" --> E["Recorded only — no stock movement"]
    D --> F["Bill unchanged — atelier absorbs cost<br/>audit BREAKAGE_DECLARED"]
    E --> F
```

## W17 — Lens blanks inventory (admin, atelier; shop has read-only API access)

```mermaid
flowchart TD
    L["Lens blanks page<br/>stats: references · total qty · low stock ≤ 3 · stock value"] --> F["Filters: search · brand · lensType · low-stock toggle"]
    L --> C["Create / Edit — brand* · thickness* (1.50–1.74)<br/>lensType / material / coating · SPH / CYL<br/>costPrice · sellingPrice* · qty · fournisseur"]
    L --> D["Delete — confirm"]
    L -. "consumed by" .-> W["Work orders:<br/>used_in_mounting · broken_during_mounting"]
```

Note: an `adjust-stock` API exists (reasoned adjustments + ledger) but **no UI calls it** — see §Dead-ends.

## W18 — Optician billing & grouping (admin, atelier)

```mermaid
flowchart TD
    B["Bill FAC-ABBR-NNN — auto-created with work order<br/>status: unpaid"] --> P["Record payment — cash / card / cheque / traite<br/>cheque/traite → Cheque (client_payment) + payment row<br/>audit BILL_PAYMENT_RECORDED"]
    P --> S["syncBillPaidState:<br/>unpaid / partiallyPaid / paid<br/>mirrors paid figures to the work order"]
    B --> G["Select ≥ 2 unpaid bills of one shop<br/>→ Group → Consolidated invoice FAC-G-ABBR-NNN<br/>audit INVOICE_GROUPED"]
    G --> H["Grouped bills locked from direct payment"]
    G --> GP["Record payment on consolidated<br/>audit CONSOLIDATED_PAYMENT_RECORDED"]
    GP --> S
```

The Invoices page hosts 3 tabs: **Opticiens** (bills + consolidated, per-shop outstanding cards, group/payment/print), **Fournisseurs** (see W20), **Echeances** (cheque due dates, see W11).

## W19 — Supplier management (all roles, entity-scoped)

```mermaid
flowchart TD
    F["Fournisseurs — entity fixed by role<br/>atelier → atelier, others → shop"] --> S["Search name/phone · export CSV"]
    F --> A["Add / Edit: name* · phone · address · email · tax ID"]
    F --> P["Row click → supplier products dialog<br/>(their stock items, sold/unsold filter)"]
    F --> D["Delete → soft delete"]
```

## W20 — Purchase invoices & supplier grouping

```mermaid
flowchart TD
    PI["Purchase invoices (page: admin/shop · API: + atelier)<br/>entity fixed by role · payment-status filter"] --> N["New invoice — number auto-generated<br/>FAC-ABBR-NNN per fournisseur + entity"]
    N --> IT["Items per category — qty × unit cost<br/>(does NOT move product stock)"]
    N --> PM["Payments at creation — cash / cheque / traite<br/>cash counted immediately · cheques pending"]
    PI --> V["Preview dialog → Record payment<br/>audit SUPPLIER_INVOICE_PAYMENT_RECORDED"]
    PI --> G["Group ≥ 2 unpaid invoices of one fournisseur<br/>→ Supplier consolidated FAC-G-ABBR-NNN<br/>audit SUPPLIER_INVOICE_GROUPED"]
    G --> GP["Consolidated payment<br/>audit SUPPLIER_CONSOLIDATED_PAYMENT_RECORDED"]
```

## W21 — Retail stock & QR codes (admin, shop)

```mermaid
flowchart TD
    S["Stock page — filters: search · category<br/>(verre hidden for shop) · stock status<br/>export CSV"] --> NP["New product / Edit"]
    NP --> F["Per-category form:<br/>lunette · lentille · verre (lens params) · accessory ·<br/>nettoyant lentilles / monture<br/>cost · price* · qty · fournisseur"]
    F --> API["POST / PATCH — QR auto-generated<br/>SOPT-timestamp-random · audit PRODUCT_CREATED / UPDATED"]
    S --> QR["QR dialog — hang-tag + print label"]
    S --> DEL["Delete — audit PRODUCT_DELETED"]
    S --> SCAN["Order form: QR camera scan → item added"]
    QL["QR lookup page — enter / scan code"] --> LK["Product card result<br/>or 'Product not found'"]
```

## W22 — CSV import wizard (admin, shop)

```mermaid
flowchart TD
    W["Import — entity: clients / fournisseurs"] --> S1["1 · Upload CSV<br/>auto column mapping (FR/EN/WinDev aliases)"]
    S1 --> S2["2 · Map columns<br/>clients required: name · familyName · phone"]
    S2 --> S3["3 · Preview — POST /api/import<br/>duplicate detection by phone (clients)"]
    S3 --> S4["4 · Confirm — PUT /api/import<br/>per-row failures collected, not fatal"]
    S4 --> D["Done: success + failure toasts<br/>row-error list · re-import · export CSV"]
```

## W23 — Reports & audit logs

**Reports** (all roles; period: today / week / month / year / all, with ▲▼ deltas):
- admin sees **Shop reports**: revenue/profit KPIs, monthly trend, order-type donut, payment mix, receivables, collections (days-to-cash, bounce rate), top clients, doctor ranking, SPH/CYL demand bands, supplier balances, restock list, stock health, sales heatmaps, order-value buckets.
- atelier sees **Atelier reports**: revenue, completed WOs, avg turnaround, breakage rate, backlog + aging buckets, partner scorecard per shop, lens usage vs stock, low-blank alerts, revenue by optician.

```mermaid
flowchart TD
    R["Reports page"] --> E{"role"}
    E -- "admin" --> SH["Shop entity dashboard"]
    E -- "shop" --> SH
    E -- "atelier" --> AT["Atelier entity dashboard"]
    SH & AT --> P["Period select + delta comparison"]
```

**Audit logs** (admin only): text search on action, entity-type dropdown, date range, page navigation, expandable JSON metadata. Recorded actions include: `USER_LOGIN/LOGOUT`, `ADMIN_SETUP`, `PASSWORD_CHANGED`, `PROFILE_UPDATED`, `CLIENT_CREATED/UPDATED/DELETED`, `PRODUCT_CREATED/UPDATED/DELETED`, `ORDER_CREATED/COMPLETED/CANCELLED/DELETED`, `PAYMENT_ADDED`, `ORDER_AUTO_READY`, `REPAIR_CREATED/COMPLETED`, `BREAKAGE_DECLARED`, `WO_PAYMENT_RECORDED`, `BILL_PAYMENT_RECORDED`, `CHEQUE_STATUS_UPDATED`, `INVOICE_GROUPED`, `CONSOLIDATED_PAYMENT_RECORDED`, `SUPPLIER_INVOICE_GROUPED`, `SUPPLIER_CONSOLIDATED_PAYMENT_RECORDED`, `SUPPLIER_INVOICE_PAYMENT_RECORDED`.

## W24 — Notifications & alerts

```mermaid
flowchart TD
    POLL["Bell polls GET /api/notifications<br/>every 15 s"] --> ROLE{"role"}
    ROLE -- "admin" --> A5["all 5 alert types"]
    ROLE -- "shop" --> S4["4 — no pending_repair"]
    ROLE -- "atelier" --> T1["pending_repair only"]
    A5 --> CLICK["Click → role-checked deep link"]
    S4 --> CLICK
    T1 --> CLICK
```

| Alert type | Trigger | Deep link | Roles |
|---|---|---|---|
| low_stock | products qty ≤ 3 | stock | admin, shop |
| pending_repair | work orders pending | atelier-work-orders | admin, atelier |
| ready_order | orders ready | orders | admin, shop |
| ready_optician_work | optician WOs completed | atelier-work-orders | admin, shop |
| pending_payment | cheques due ≤ 7 days | billing | admin, shop |

---

## Cross-cutting money rule

```mermaid
flowchart LR
    P["Payment recorded"] --> M{"method"}
    M -- "cash / card" --> E["counts immediately"]
    M -- "cheque / traite" --> Q["Cheque row — pending"]
    Q -- "cashed / paid" --> E
    Q -- "bounced" --> X["never counts"]
    E --> ST["status recompute:<br/>unpaid / partiallyPaid / paid"]
    E --> OV["overpay blocked — epsilon 0.001"]
```

"Effective paid" = cash + card + **cleared** cheques only. All paid badges (orders, bills, invoices) derive from this.

## Known workflow dead-ends (as built)

| Gap | Detail |
|---|---|
| Order delete unreachable | API + hook exist (`ORDER_DELETED`, restock), no UI button wired |
| No product stock-adjustment UI | `StockAdjustmentReason` (restock/damage/adjustment/sale) unused by UI; qty set directly on the product form |
| Lens-blank adjust-stock unused | API exists (reasoned ledger entries), no UI button |
| Login error message | Wrong credentials always surface as generic 'Connection error' |
| 401 does not auto-logout | Expired token just toasts errors until manual logout |
| Clients gender filter | Filter state exists, no UI control wired |
| Purchase-invoice search box | Rendered but not wired |
| Cheques view vs API | Atelier can read scoped cheque APIs but cannot open the cheques view |
