# Client page: prescriptions history replaces the Ordonnances section

## Goal
Prescriptions become fully managed from the client detail page; the standalone Ordonnances nav section is removed.

## User-confirmed decisions
- **Full management** on the client page: create ("Nouvelle ordonnance", client pre-filled), edit, delete — complete replacement for the removed section.
- **Table layout:** columns `Date | Médecin | OD (SPH/CYL/Axe) | OG (SPH/CYL/Axe)`, sticky header, ~6 rows visible then scroll (scrollable container, e.g. `max-h-[350px] overflow-y-auto`), row click opens details modal.
- **Details modal:** full both-eye values (SPH, CYL, Axe, Addition, PD), doctor, date (dateWritten else createdAt), notes + **Modifier** / **Supprimer** buttons. No order shortcut (explicitly declined).
- No order shortcut button inside the modal (declined).

## Current wiring (verified)
- `ClientDetailPage.tsx` (src/modules/partners/clients/) = client card + orders list; orders section header has a "new order" button pattern to mirror.
- Prescriptions API `GET /api/prescriptions` already accepts `clientId` filter; `usePrescriptions({ clientId })` hook exists (src/modules/sales/prescriptions/usePrescriptions.ts). PATCH/DELETE exist.
- `PrescriptionForm` (src/modules/sales/prescriptions/PrescriptionForm.tsx) is the reusable create/edit form (already used in dialog by PrescriptionsPage and inline by OrderForm).
- Standalone section to remove: nav entry `src/components/layouts/nav-config.ts:53`; view registry `src/app/page.tsx` (import line 13 + map line 35); view-store union entries `'prescriptions'` and `'prescription-new'` (src/stores/view-store.ts:12-13) — verify `prescription-new` has no other usage, then remove both.
- Unaffected and must keep working: `OrderForm` inline new-prescription dialog; `DoctorPatientsDialog` (read-only patient list via `?doctorId&includeClient`); doctors page prescription counts; orders' prescription auto-select.

## Tasks (in order)
1. **ClientDetailPage — new section between the client card and orders:**
   - Header row: "Ordonnances" (existing key `prescriptions.title`) + count badge + `Nouvelle ordonnance` button (reuse `Plus` icon pattern from orders section).
   - Scrollable table (`<table className="w-full text-sm">` inside `max-h-[350px] overflow-y-auto border rounded-xl`): columns Date (dd/mm/yyyy via dateWritten ?? createdAt), Médecin (doctor name or —), OD `SPH / CYL / AXE°` compact, OG same. Row hover + cursor-pointer; row click → details modal.
   - Empty state mirroring orders empty state (icon + `prescriptions`-appropriate text; reuse existing keys if suitable, else add `clients.noPrescriptions`).
   - Data: `usePrescriptions({ clientId })`; invalidate on create/edit/delete.
2. **Details modal** (`Dialog`): title = client name + date; both-eyes grid/table (OD/OG × SPH, CYL, Axe, Addition, PD — reuse the display conventions of `PrescriptionCards`); doctor + notes lines; footer buttons Modifier / Supprimer.
   - Modifier opens the existing `PrescriptionForm` dialog pattern (copy the `defaultValues` mapping from PrescriptionsPage lines 158-172).
   - Supprimer uses existing `ConfirmDialog` pattern + `deletePrescription` API.
3. **Create flow:** same dialog pattern as PrescriptionsPage (lines 152-178) but with `clientId` pre-filled and the client select locked/hidden; POST via existing `createPrescription`.
4. **Remove the standalone section:**
   - Delete nav entry (nav-config.ts:53), registry import+entry (page.tsx), view-store union entries.
   - Delete files `PrescriptionsPage.tsx` and `PrescriptionCards.tsx` (check for other importers first).
   - Keep: API routes, service, controller, mapper, dto, schema, `PrescriptionForm`, `usePrescriptions`, `prescriptions.api`.
5. **i18n:** reuse existing `prescriptions.*` keys where possible; add any new ones to BOTH `fr.json` and `eng.json` (mirrored); remove keys left orphaned by the page deletion (e.g. `empty.noPrescriptions*`, prescriptions search keys) only after confirming zero remaining usages.
6. **Docs touch-up (light):** in `docs/USER_MANUAL.md` + `docs/PRODUCT_GUIDE.md` + `docs/GETTING_STARTED.md`, update mentions of the Ordonnances nav section: prescriptions are now created/managed from the client page; adjust the getting-started tour step accordingly.

## Risks / notes
- `usePrescriptions` currently sends only `clientId`; response shape already includes doctor + all eye fields (per PrescriptionsPage interface) — no API change expected.
- Do not break OrderForm: it imports `PrescriptionForm` and the prescriptions API directly — signature changes are FORBIDDEN; additive only.
- Role access unchanged: prescriptions were admin+shop (nav roles); client page is admin+shop, so exposure is identical. Atelier never saw prescriptions.

## Validation
- `npx tsc --noEmit` clean; `npx eslint` on changed files clean.
- Manual: client with no prescriptions → empty state + create flow; create/edit/delete from client page; row → modal; scroll behavior with >6 prescriptions; OrderForm still auto-selects latest prescription and its inline create works; doctors page patient dialog opens; nav no longer shows Ordonnances (admin+shop); i18n mirror check (identical key sets fr/eng).
