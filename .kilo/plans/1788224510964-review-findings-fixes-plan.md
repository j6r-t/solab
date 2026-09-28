# Fix Plan: Invoicing & Payments Review Findings (1–11)

Fix all 11 findings from the code review of the uncommitted invoicing feature. No schema changes, no `db push`, no price/total semantics changes (standing cost rule). All error strings and UI hints follow existing codebase conventions; new user-facing strings go in both `src/i18n/fr.json` and `eng.json` (keys stay mirrored).

## Verified facts this plan relies on

- Overpay guard only counts instant amounts: `optician-shop-bill.service.ts:106-107` (`isInstrument ? 0 : data.amount`); same pattern in `consolidated-invoice.service.ts` (`recordConsolidatedPayment` :152+) and `supplier-consolidated-invoice.service.ts` (`recordSupplierConsolidatedPayment` :161+).
- Reports add `total - paid` unclamped: `report.service.ts:370,381` (supplier outstanding), `:1190,1200` (optician debt).
- Cheque transition sync `syncOpticianBillStoredPaid` (`cheque.service.ts:102-114`) updates the bill only; the WO mirror exists only in `recordBillPayment` (`optician-shop-bill.service.ts:153-159`). `OpticianShopBill` has `workOrderId`.
- WO payment path `repair.service.ts:393-411`: naive sum, no `amount > 0`, no overpay guard, no audit, computes total from `servicePrice + lensBlankPrice` (can differ from bill total). Called by PaymentDialog kind `'workorder'` (`PaymentDialog.tsx:86` → `repairs.api.ts:33`).
- Every optician WO gets a bill at creation (`repair.service.ts:229-262`); backfill covers legacy ones.
- Numbering is per-shop max+1: `repair.service.ts:233-247` (`FAC-{ABBR}-`), `consolidated-invoice.service.ts:73-77` (`FAC-G-{ABBR}-`), supplier equivalent (`FAC-F-{ABBR}-`), backfill `scripts/backfill-optician-bills.mjs:30-45`. `billNumber`/`invoiceNumber` are unique → two entities sharing an abbreviation collide (P2002).
- Backfill hardcodes `paidAmount: 0, status: 'unpaid'` (:90-91), has no WO status filter (:50-58).
- Dead branches: `optician-shop-bill.controller.ts:17-22` (GET `?id=`) and `:40-45` (POST `?action=record-payment`), superseded by the `[id]` route.
- `getOpticianShopBillsSummary` (`optician-shop-bill.service.ts:43-45`) filters `groupedIntoId: null` and ignores consolidated outstanding.

## Tasks

### Wave A — Payment correctness (fixes 1, 2, 3, 4, 5)

1. **Shared payment math** — in `src/lib/utils/payments.ts` add pure helpers:
   - `pendingInstrumentTotal(payments, side)` — sum of instrument-payment amounts whose cheque is not yet `cashed` (client) / `paid` (supplier), matching `effectivePaymentTotal` semantics.
   - `assertWithinTotal({ totalAmount, effectivePaid, pendingTotal, newAmount, label })` — throws `BadRequestError` when `effectivePaid + pendingTotal + newAmount > totalAmount + epsilon` (round3 like existing code).
2. **Fix 1 — overpay guard** — in the three record-payment services (`optician-shop-bill`, `consolidated-invoice`, `supplier-consolidated-invoice`): before creating payment/cheque, call the guard with the target's current effective paid + pending instrument total + new amount. After every recompute of stored `paidAmount` (record paths and cheque-transition syncs), clamp: `paidAmount = Math.min(effective, totalAmount)`.
3. **Fix 1 — report clamp** — `report.service.ts:370,381,1190,1200`: wrap in `Math.max(0, …)`.
4. **Fix 2 — grouped bills frozen** — at top of `recordBillPayment` and supplier `addPaymentToInvoice`: if the row's `groupedIntoId != null`, throw `BadRequestError` with the grouped invoice number. In `WorkOrderDetailDialog`, when the bill is grouped: hide the record-payment button and show a hint (new i18n keys, e.g. `workOrders.groupedHint` "Facturée dans {invoiceNumber}"). Apply the same hide in any other UI that offers payment on a bill (check `InvoicesPage` Opticiens tab actions).
5. **Fix 3 — cheque→WO sync** — extract `syncBillPaidState(billId)` (exported from `optician-shop-bill.service.ts`): recompute effective paid, clamp, update bill `paidAmount`/`status` AND mirror WO `amountPaid`/`paymentStatus` when `workOrderId` set (copy logic of `:153-159`). Use it from `recordBillPayment` and replace `syncOpticianBillStoredPaid` in `cheque.service.ts`. Supplier-side `syncPurchaseInvoiceStoredPaid` stays separate (fix 10) — no WO mirror there.
6. **Fix 4 — single WO writer** — `repair.service.ts` `recordPayment`: fetch WO with `include: { bill: true }`. If `bill` exists → delegate: `recordBillPayment(bill.id, { amount, method: 'cash' })`, then return the WO re-fetched with `WORK_ORDER_INCLUDE` (bill path already mirrors WO + audits). If no bill → keep naive path but add `amount > 0` guard, overpay guard against `totalDue`, and a `WO_PAYMENT_RECORDED` audit log. Watch imports: `optician-shop-bill.service.ts` does not import the repairs module, so the one-way import is safe.
7. **Fix 5 — harden + dedupe supplier payments** — `purchase-invoice.service.ts` `addPaymentToInvoice`: wrap in `$transaction`, add `amount > 0` check, overpay guard via the shared helpers (incl. pending instruments), and `SUPPLIER_INVOICE_PAYMENT_RECORDED` audit (match existing audit metadata style). Make all four payment paths use the shared math helpers from task 1.

### Wave B — Numbering, backfill, deploy (fixes 6, 7, 8)

8. **Fix 6 — global sequences** — in all four numbering sites (`repair.service.ts:233-247`, both consolidated-invoice services, backfill `nextBillNumber`): compute max+1 by scanning **all** rows of the target table (drop the per-shop `where` on the sequence scan only; keep the abbreviation prefix for readability). Result: `FAC-SO-001` can never repeat across two different shops. Accepted risk: read-max+1 is not race-proof — fine at this shop's traffic.
9. **Fix 7 — backfill respects history** — in `scripts/backfill-optician-bills.mjs`:
   - Add `status` filter: skip cancelled WOs (read the exact `AtelierWorkOrderStatus` enum literal for cancelled from `prisma/schema.prisma` — do not guess).
   - Seed from history: `paidAmount = Math.min(Number(wo.amountPaid || 0), totalAmount)`; `status = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'`.
   - Use the global sequence (task 8). Keep idempotency (skip WOs that already have a bill).
10. **Fix 8 — deploy procedure** — `deploy/README.md` §6: reorder to stop app → `npx prisma db push` → `npx prisma generate` → build → start (note the EPERM/stale-client failure mode). Add a first-deploy checklist step: run `node scripts/backfill-optician-bills.mjs` immediately after the first deploy, before the app is used.

### Wave C — Polish (fixes 9, 10, 11)

11. **Fix 9 — honest shop cards** — `getOpticianShopBillsSummary`: additionally fetch all consolidated invoices grouped by `opticianShopId` (with payments), add `Math.max(0, total - effectivePaid)` per shop into that shop's outstanding total. If the Fournisseurs tab uses an equivalent supplier summary function, apply the same treatment there.
12. **Fix 10 — dedupe supplier sync** — export `syncPurchaseInvoiceStoredPaid` from `purchase-invoice.service.ts` (single definition), import it in `cheque.service.ts`; delete the verbatim copy.
13. **Fix 11 — delete dead branches** — after grepping that no client code calls `GET /api/optician-shop-bills?id=` or `POST /api/optician-shop-bills?action=record-payment` (check `optician-shop-bills.api.ts` and all callers), remove both branches from `optician-shop-bill.controller.ts` (:17-22, :38-46) and any now-unused imports/params (`billId` optionality in `recordBillPaymentSchema` if it existed only for the dead path — keep schema backward-compat otherwise).

## Constraints

- No Prisma schema changes → no `db push`, no client regeneration, dev server restart not required.
- Never alter bill/work-order prices or totals (cost rule). Grouping snapshots untouched.
- Do not touch the running dev server on :3000. Do not run the backfill script (owner runs it).
- i18n: every new user-facing string in both fr.json and eng.json.

## Validation

1. `npx tsc --noEmit` and `npx eslint src scripts` — zero errors.
2. i18n parity: fr/eng key counts match (670 + added keys, both files).
3. Grep sweep: no remaining per-shop-only sequence scans; no duplicate `syncPurchaseInvoiceStoredPaid`.
4. Logic spot-checks (code reading + dev-server API calls if the owner's server is running):
   - Stack two pending cheques totalling more than a bill's remaining → second is rejected; clearing them cannot overpay.
   - Pay a bill whose `groupedIntoId` is set → rejected with the grouped invoice number; button hidden in dialog.
   - Transition a linked cheque to cashed → bill AND work-order `amountPaid`/`paymentStatus` both update.
   - Two optician shops with identical name abbreviations → each grouping/backfill run yields distinct numbers.
   - Work-order payment endpoint on a WO with a bill → bill and WO both reflect the payment.
5. Owner follow-ups after implementation: hard-refresh (Ctrl+Shift+R), then run `node scripts/backfill-optician-bills.mjs` (idempotent, now history-aware).

## Delegation

Standing rule: implement via `general` subagents using the task tool — one task per wave (A, then B, then C), each given the exact findings, file:line anchors, and validation steps above. Verify tsc/eslint/i18n between waves.

## Out of scope

- Race-proof atomic sequence allocation (accepted risk).
- Migrating historical overpaid ledgers beyond clamp-on-next-sync.
- Restructuring PaymentDialog beyond the grouped-bill hint.
