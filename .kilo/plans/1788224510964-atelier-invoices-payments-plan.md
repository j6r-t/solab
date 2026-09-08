# Atelier Invoices & Payments — Optician Shops + Suppliers

## Goal
Give the atelier a complete invoicing workflow: (1) every optician-shop work order gets an invoice with traceable partial payments (cash/card immediate; cheque/traite counted only when cleared), (2) a "Factures" hub to follow all invoices and instrument due dates, (3) grouping of not-fully-paid invoices of one shop into one consolidated invoice with its own payments and print, (4) the same process mirrored for supplier invoices.

## Locked decisions (approved with owner)
1. Grouped invoice = sum of each source invoice's **remaining** amount (never full amounts — avoids double-counting prior partial payments).
2. **Every** optician-shop work order gets a bill, including optician-supplied-lens orders (services-only lines).
3. Traites allowed on shop invoices (stored as `Cheque type='traite'` + `PaymentMethod='cheque'`, same as supplier side).
4. One **Factures** view, three tabs: Opticiens / Fournisseurs / Échéances.
5. Supplier grouping included (Phase 4).
6. Atelier (besides admin) may transition optician-bill instruments (`pending→cashed|bounced`) and supplier instruments (`pending→paid|bounced`).
7. Client *order* cheques stay admin/shop only — atelier never sees them.
8. Cost rule (unchanged): breakage replacements and this feature never alter work-order prices or bill totals; grouping never changes source amounts.

## Project constraints (every phase)
- Next.js 16 App Router + Prisma 6 SQLite (`npx prisma db push`, no migrate), react-query v5, Zustand view-store SPA (`src/app/page.tsx` registry + `view-store.ts` ViewName + `nav-config.ts` VIEW_ROLES; every new view registered in all three).
- `requireRole` on every new/changed API. Layers: API + view gate.
- i18n: `src/i18n/fr.json` + `eng.json` mirrored key sets (French = source of truth). `t()` supports `{n}` interpolation.
- TS strict: unused params `_`-prefixed. No new npm deps. Verify per phase: `npx tsc --noEmit` (8 pre-existing errors in `.next/dev/types/` are dev-server artifacts — ignore), `npx eslint` on changed files, i18n mirror script, both JSONs parse.
- **Session-isolation rule**: no persisted client state; react-query is cleared on logout — nothing new may persist across sessions.
- Never start/stop the user's dev server; never edit `dev.db` directly; `db push` only with owner informed.

---

## Phase 1 — Invoice per work order + real payment recording

### Backend
1. `prisma/schema.prisma`: extend `OpticianShopPayment` → add optional inline-instrument support is already possible via `chequeId`; keep model. No schema change needed for Phase 1 payments (create `Cheque` then connect). Add nothing else.
2. `src/modules/sales/repairs/repair.service.ts` `createRepair`: create the `OpticianShopBill` for **every** optician-source work order. When `lensSource==='optician'`: items = services only (skip blank items/stock decrement). Keep existing stock-lens behavior. Bill number generator unchanged.
3. Backfill (one-off script `scripts/backfill-optician-bills.ts`, run manually with owner): create missing bills for existing optician WOs without one; idempotent (skip if `bill` exists).
4. Upgrade `optician-shop-bill.schema.ts` + `optician-shop-bill.service.ts` `recordBillPayment`: accept `method: cash|card|cheque|traite`, `chequeNumber/chequeBankName/chequeDueDate/chequeType` (required for cheque/traite, validated with refine), optional `notes`. For cheque/traite create `Cheque` (`entityType:'client_payment'`, `type` standard|traite, `status:'pending'`) then `OpticianShopPayment` (`method:'cheque'`). Reuse the supplier-side instrument-creation pattern (`purchase-invoice.service.ts` `createSupplierInstrument` lines 43-68) as the reference. Keep the existing effective-total recompute + overpay guard (guard against `effectivePaymentTotal` overpay, i.e. pending instruments count 0).
5. Work-order ↔ bill unification: `WorkOrderDetailDialog` payment actions target the **bill** when present; WO `amountPaid` becomes derived (sync from bill paidAmount after each payment; keep `record-payment` WO action only for WOs without a bill — internal source).

### Frontend
6. Shared `PaymentDialog` component (`src/modules/sales/atelier-work-orders/PaymentDialog.tsx` or shared location): amount (prefill remaining), method select (Espèces/Carte/Chèque/Traite), conditional instrument fields, overpay prevention, toast errors.
7. `WorkOrderDetailDialog`: invoice panel shows billNumber/total/paid/remaining/status + **payment history table** (date, method label incl. traite, amount, instrument status badge En attente/Encaissé/Rejeté) + record-payment button (opens PaymentDialog). Replace the current amount-only input.
8. i18n keys both locales.

### Validation
Create optician WO (optician-lens) → bill exists with service lines; record cash 20 → Payé 20/Reste 25, status Partielle; record traite 25 → paid still 20 until instrument marked cashed; `db push` clean; tsc/eslint/i18n pass.

---

## Phase 2 — Factures hub (Opticiens / Fournisseurs / Échéances) + instrument follow-up

### View wiring
1. `ViewName` += `'invoices'`; `page.tsx` registry += `invoices: InvoicesPage`; `nav-config.ts` Atelier group += `{ view:'invoices', labelKey:'nav.invoices', roles:['admin','atelier'] }` + `VIEW_ROLES.invoices=['admin','atelier']`. i18n `nav.invoices` (fr "Factures").

### Opticiens tab
2. Extend `optician-shop-bill.controller/service` list: filters `status`, `opticianShopId`, search; response already re-derives paid/pending/status via mapper (keep). New endpoint or param for per-shop outstanding summary (Σ remaining, grouped-aware once Phase 3 lands).
3. `InvoicesPage` (`src/modules/invoices/InvoicesPage.tsx`): Opticiens tab = per-shop summary strip + invoice table (number, shop, date, total, paid, reste, status badge) with row actions: 👁 preview dialog (invoice lines + payment history), 💶 PaymentDialog (reuse Phase 1), 🖨 print. Filters: status + shop search.
4. New print `optician-bill.print.ts` mirroring `purchase-invoice.print.ts`: header (logo/shop contact), bill lines, **Total/Payé/Reste à payer**, payment history table, footer. Wire to row + preview dialog.

### Fournisseurs tab (Phase 4 fills actions; list lands here)
5. Render supplier invoices via existing `purchase-invoices` API filtered to entity — table identical in shape; actions arrive in Phase 4.

### Échéances tab (instrument follow-up)
6. Cheque endpoint scoping: extend `cheque.controller` (currently `admin|shop`) so `admin|atelier` can list/transition **only** cheques linked via `OpticianShopPayment` or `SupplierPayment`; client-order cheques stay admin/shop. Implement scoping in `cheque.service` list (new `scopes` param) and transition guard (resolve cheque → relation type → role check).
7. `cheque.mapper.ts`: resolve `opticianShopPayments` → linked bill (fixes "—" Linked-to).
8. Échéances tab: table sorted by dueDate (type badge, number, bank, amount, due date, party, source invoice link, status badge, red past-due highlight); filters À venir/En retard/Encaissés/Rejetés; inline actions Encaisser (shop instruments) / Marquer payé (supplier) / Rejeter with confirm dialogs → existing guarded `updateChequeStatus` (auto-syncs parent invoice).
9. `DueChequesAlert`: role-scoped sources — atelier/admin also alerted for optician-bill + supplier instruments due within `CHEQUE_ALERT_DAYS`; shop unchanged.

### Validation
Shop login cannot see Factures view nor call its APIs (403). Atelier: record traite on invoice → appears in Échéances pending → Encaisser → invoice paid updates instantly; Rejeter → invoice reverts to owed. Alert shows upcoming instruments. Print opens.

---

## Phase 3 — Grouped invoices (optician shops)

### Schema
1. `ConsolidatedInvoice`: `invoiceNumber @unique` (`FAC-G-{SHOPABBR}-{seq3}`), `opticianShopId`, `totalAmount`, `paidAmount @default(0)`, `status BillStatus`, `createdAt`, `items ConsolidatedInvoiceItem[]`, `payments ConsolidatedPayment[]`.
   `ConsolidatedInvoiceItem`: `sourceBillId @unique`, `sourceBillNumber`, `amount` (remaining at grouping time).
   `ConsolidatedPayment`: `amount`, `method PaymentMethod`, `chequeId?`, `notes?`, `paidAt` (mirror OpticianShopPayment).
   `OpticianShopBill` += `groupedIntoId?` → ConsolidatedInvoice.
   (Agent may generalize into one model shared with Phase 4 supplier grouping via nullable `opticianShopId`/`fournisseurId` — allowed if cleaner; keep API separate.)
2. `db push`.

### Backend
3. Service `groupOpticianShopBills(shopId, billIds)`: validate same shop, each not fully paid, not already grouped; items = per-bill remaining (`totalAmount − effectivePaymentTotal(...,'client')`); reject total ≤ 0. Transaction: create consolidated + items + set `groupedIntoId` on sources. Audit `INVOICE_GROUPED`.
4. `recordConsolidatedPayment`: same instrument flow as Phase 1 (side 'client'), effective-total recompute, overpay guard; extend cheque status sync (`cheque.service syncOpticianBillStoredPaid`) to consolidated invoices.
5. Debt math alignment: mapper/reports `partnerScorecard` (report.service ~1147) must count a grouped source bill as 0 outstanding and add the consolidated invoice's outstanding instead. Same for bill list filters.

### Frontend
6. Opticiens tab: checkboxes on not-fully-paid, non-grouped invoices of one shop → selection bar "N factures — Reste : X TND → Regrouper en facture" → confirm dialog with preview lines → create → toast + refetch. Grouped invoices show badge "Groupée" (read-only, no direct payments); the group invoice behaves like a normal invoice (payments, history, print).
7. Print `printGroupedInvoice`: header, source-invoice lines (number + remaining amount), Total/Payé/Reste, payment history, footer.

### Validation
Bills 10+25+25 (all partial/unpaid) → group → consolidated = 60; record cheque 60 → Encaisser → group Payée, sources stay "Groupée"; shop debt in reports = 0 after group paid; double-count check: pre-group partial payments don't inflate the group.

---

## Phase 4 — Supplier mirror

1. Add-payment UI: `PATCH /api/purchase-invoices/[id]?action=add-payment` exists (schema already accepts cash/cheque/traite + inline cheque fields; service `createSupplierInstrument` creates the Cheque). Surface PaymentDialog (supplier variant: Espèces/Chèque/Traite, side='supplier' semantics: instrument counts when `paid`) on `PurchaseInvoicesPage` row action + `PurchaseInvoicePreviewDialog` button; history table refresh after.
2. Supplier grouping: mirror Phase 3 for `PurchaseInvoice` per `fournisseurId` (same model pattern or generalized model), numbering `FAC-G-{SUPABBR}-{seq}`, status transitions side='supplier', grouped source invoices badge + excluded from outstanding; reports `supplierBalances` (report.service ~349) counts group outstanding instead of grouped sources.
3. Print `printGroupedSupplierInvoice` mirroring Phase 3 print.
4. Fournisseurs tab actions (from Phase 2 list): 👁 (existing preview), 💶 payment, 🖨 print single/group.

### Validation
Add partial cash payment post-creation → totals/status update; supplier cheque pending → Échéances shows "Marquer payé" action; group 2 partially-paid supplier invoices → outstanding math matches reports.

---

## Phase 5 — Hygiene (fold into phases where cheap)
1. Cheques page "Linked-to" shows optician-bill links (done in 2.7 — verify).
2. Instrument status badges reuse one component across payment histories.
3. `docs/USER_MANUAL.md` section 11: Factures view, payment recording, Échéances follow-up, grouping; note atelier role scope.
4. Remove dead code encountered (`optician-shop-bills.api.ts` unused functions get wired or replaced).

---

## Risks & edge cases
- Overpay guard must use effective totals (pending cheque = 0) — keep existing quirk consistent across bill/consolidated/supplier payment paths.
- Bounced instrument: counts as nothing; invoice reverts to owed; history keeps the Rejeté badge; replacement payment allowed.
- Grouping snapshot: amounts frozen at grouping time; later edits to source bills impossible (read-only) — enforce.
- Timezone: date-only comparisons via local y/m/d → `Date.UTC` normalization (pattern in `AtelierWorkOrdersPage.daysUntil`).
- Numbering sequences must be race-safe (mirror `getNextInvoiceNumber` pattern).
- Backfill script must be idempotent and run only with owner approval.
- Report regressions: recheck `partnerScorecard` + `supplierBalances` after Phases 3-4.

## Out of scope
- Client order billing/cheques (shop domain) — untouched.
- Supplier invoice `dueDate` field (deferred; propose later).
- Email/SMS reminders for instruments.
