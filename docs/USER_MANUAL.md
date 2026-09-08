# Sofien Optic — User Manual

The complete reference for daily work in the app. Each section starts with what you gain, then numbered steps with the exact button names. The app speaks French; the French names are shown in parentheses.

---

## 1. Signing in, signing out, theme and language

**You can set the app to your language and comfortable brightness in under a minute.**

### Sign in

1. Open the app in your browser. The login page appears.
2. Type your email and password.
3. Click **Se connecter**.

The menu shows only what your role needs (see the roles table in the Product Guide, or ask the owner).

### Sign out

1. Click **Déconnexion**. Always do this on a shared computer.

### Change the language

1. Open **Paramètres** (Settings).
2. Find **Langue**.
3. Choose Français or English. The whole app changes immediately.

### Change the theme

1. Open **Paramètres**.
2. Find **Apparence**.
3. Choose **Clair** (light), **Sombre** (dark), or **Système** (follows your device).

### Change your password

1. Open **Paramètres** → **Profil**.
2. Fill in **Mot de passe actuel**, **Nouveau mot de passe**, **Confirmer le mot de passe**.
3. Click **Mettre à jour le mot de passe**.

---

## 2. The Dashboard (**Tableau de bord**)

**The dashboard answers "what should I do today?" before you ask it.**

### The KPI cards

| Card (French label) | What it shows | What to do if it is high |
|---|---|---|
| **Revenu total** | Revenue for the current month | Nothing — it is a score, compare with other months in **Rapports** |
| **Total clients** | How many clients you have | Nothing |
| **Ventes du jour** | Orders taken today | Nothing — check the evening in **Rapports** |
| **Articles en stock bas** | Products at 3 units or fewer | Restock (see section 8) |
| **Réparations en attente** | Repairs not finished | On the shop account this number is informational — repairs are followed up from the atelier (or admin) account |
| **Stock** | Total number of products | Nothing |

The atelier account sees the same cards with workshop numbers: revenue, partner opticians count, completed work orders, low-stock lens blanks, pending work orders, total lens blanks.

### Quick actions

The buttons under the cards depend on your role: the **shop** account sees **Nouvelle commande** (start a sale); the **atelier** account sees **Réparations** (open the repairs page) and **Opticiens partenaires** (partner opticians); the **admin** account sees all three.

### The "ready for pickup" list (**Prêt à récupérer**)

Admin and shop accounts only. Orders ready to hand to clients, with order number, client name, phone and total.

**What to do:** call each client the same day. Click **Voir** to open the order; when the client has taken the glasses, click **Marquer comme récupéré**.

### What to do when a card alerts you

- **Articles en stock bas**: open **Stock**, sort by quantity, restock the critical items (section 8).
- **Réparations en attente**: on the atelier or admin account, click the **Réparations** quick action and finish or follow up on each job. The shop account sees the number only.
- A growing **Prêt à récupérer** list: call the clients; glasses that stay in the shop are money waiting.

---

## 3. Clients (**Clients**) and Doctors (**Médecins**)

**A complete client file means the next order takes seconds and nothing is forgotten.**

### Create a client

1. Open **Clients** → **Nouveau client**.
2. Fill in: **Nom**, **Nom de famille**, **Téléphone**, **Adresse**, **Genre** (Masculin / Féminin), **Date de naissance**.
3. **Organisme / Assurance**: the insurance or organization, if any.
4. **Notes**: allergies, preferences, medical notes.
5. Click **Enregistrer**. The app then offers to add a prescription right away — you can also do it later.

### Edit or remove a client

1. Open **Clients** and search by name or phone.
2. Open the client, click **Modifier** to change the details.
3. To remove, use **Supprimer**. The client disappears from the list but old orders and invoices keep their history.

### Find a client fast

Use the search box (**Rechercher des clients par nom ou téléphone...**). Phone digits work too.

### Import clients from a file

Many clients on paper or in Excel? Open **Import** and follow the steps: choose **Clients**, upload a CSV file, match the columns, preview, then import. The same flow works for suppliers (**Fournisseurs**).

### Create a doctor

1. Open **Médecins** → **Nouveau médecin**.
2. Fill in the name, phone and specialty.
3. Click **Enregistrer**. The doctor can now be linked to prescriptions.

---

## 4. Prescriptions — on the client page (**Ordonnances**)

**The app remembers every prescription, so the next order picks the right values automatically.**

Prescriptions are not a separate menu anymore: every client's prescriptions live on their page, in the **Ordonnances** section — a table with the date, the **Médecin** and both eyes' values. Click a row to see the full details (SPH, CYL, AXE, ADD and DP for each eye) and use **Modifier** or **Supprimer** there.

### Create a prescription

1. Open **Clients** and click the client. Their page shows the **Ordonnances** section.
2. Click **Nouvelle ordonnance** — the client is already selected.
3. Choose the **Médecin** and set **Date de l'ordonnance**.
4. For each eye — **Œil droit** (right) and **Œil gauche** (left) — enter **SPH**, **CYL**, **AXE**, and **ADD** if present. **DP** is the pupillary distance.
5. Click **Enregistrer**.

You can also click **Importer une ordonnance (photo)**: take a photo of the paper prescription and the app reads the values for you — always check them before saving.

### Read the prescription label

In an order, the prescription shows like this:

`OG:CYL(SPH , AXE) | OD:CYL(SPH , AXE) date`

- **OG** = œil gauche (left eye), **OD** = œil droit (right eye).
- Example: `OG:-0.50(-2.00 , 170) | OD:-0.25(-1.00 , 10) 3/2/2026` means left eye CYL -0.50, SPH -2.00, axis 170; right eye CYL -0.25, SPH -1.00, axis 10; prescription dated 3 February 2026.
- The date at the end tells you how old the prescription is.

---

## 5. Orders (**Commandes**) — the full walkthrough

**The order is where the sale happens: client, glasses, payment, facture — all in one place.**

### Order statuses

| Status (French) | Meaning |
|---|---|
| **En attente** | Created, waiting for the atelier |
| **Prêt** | Assembled, ready for the client |
| **Terminé** | Handed to the client |
| **Annulé** | Cancelled |

Payment badges: **Payé** (fully paid), **Partiel** (partly paid), **Impayé** (nothing valid received yet).

### Create an order

1. Open **Commandes** → **Nouvelle commande**.
2. Choose the **Type de commande**:
   - **Monture + Verres**: frame + prescription lenses (needs a prescription).
   - **Remontage**: new lenses in the client's own frame.
   - **Vente directe**: quick sale of accessories, contact lenses or ready glasses.
3. Pick the **Client**. For Monture + Verres and Remontage, the client's latest prescription is selected automatically — the label shows the values and the date. If it is a new prescription, click **Nouvelle ordonnance** and fill it in without leaving the order.
4. Set **Livraison prévue** (turnaround in days) if you want a promised date.
5. Add items:
   - A frame from **Stock**.
   - Lenses: the app shows **Verres correspondants** — lens blanks matching the prescription's sphere and cylinder. If none match, it says so clearly.
   - Accessories or contact lenses from **Stock**.
   - Repair services (for example remontage) with their prices.
6. Take the payment (next part).
7. Click **Enregistrer**. The app offers to print the **FACTURE** — click **Imprimer** or **Non**.

### Take the payment

1. Choose **Paiement complet** (full) or **Acompte** (deposit, with **Montant de l'acompte**).
2. Payment rows — you can combine several:
   - **Espèces** (cash): counts as paid immediately.
   - **Carte** (card): counts as paid immediately.
   - **Chèque**: enter the number and the bank. Counts as received only when cashed (section 7).
   - **Traite**: number, bank, and **Date d'échéance** (required). Same rule — not money until cashed.
3. Example: total 400, client gives 150 cash + 2 cheques of 125 → add three rows. **Payé** will show only the cash until the cheques are cashed.

### Follow the order to the end

1. When the glasses are assembled, open the order from **Commandes** and click **Marquer comme prêt**. The order appears in **Prêt à récupérer** on the dashboard.
2. When the client picks up and pays the rest, click **Paiement du solde** to record it, then **Marquer comme récupéré**. The order becomes **Terminé**.
3. The **Historique des paiements** in the order shows every payment row with its date and type.

### Cancel an order

1. Open the order.
2. Click **Annulé**. Confirm.

### Print the facture or the reçu later

Everything is available from **Facturation** (section 6) — the facture from the order, the reçu with deposits and remaining balance.

---

## 6. Billing (**Facturation**)

**Every paid or partly paid order is here, with its two printable documents one click away.**

### The list

1. Open **Facturation**. You see order number, client, date, total, paid, balance, and a status badge.
2. Search by client or number; filter by status.

### Status badges

| Badge | Meaning |
|---|---|
| **Payé** | Everything validly received (cash + card + cashed cheques) |
| **Partiel** | Some received, some missing |
| **Impayé** | Nothing validly received yet |
| **En attente** | A cheque or traite was given but not yet cashed — it shows on the reçu and in the payment list, but is not counted as money |

### Print the facture

1. Open the order's line and click **Imprimer**.
2. The **FACTURE** prints with: client, date, items, total, and the shop identity (Sofien Optic, Rue de la Liberte a cote Mosquee Omar ibn Elkhattab, 24.398.692 / 24.248.632).
3. **Exporter PDF** saves the same document as a PDF.

### Print the reçu (payment receipt)

1. Open the order's line and click **Imprimer le reçu**.
2. The **REÇU** shows: what was paid (cash/card), any deposit (**acompte**), pending cheques marked **En attente (chèque/traite)**, and **Reste** — what the client still owes.

### Quick sale (**Vente rapide**)

For a small sale without a full order:

1. Open **Facturation** → **Vente rapide**.
2. Pick items, take the payment, save. It appears in the list with its facture.

---

## 7. Cheques and traites (**Chèques et traites**)

**This page turns paper into truth: a cheque counts as money only here, only when cashed.**

### Read the page

- Three summary cards: **En attente** (waiting), **Encaissés** (cashed), **Rejetés** (bounced).
- Filters: **Tous les statuts** and **Tous les types** (Chèque / Traite).
- Each row: **Numéro**, **Type**, **Banque**, **Montant**, **Échéance**, **Statut**, and **Lié à** — the order for client cheques, the purchase invoice for supplier cheques.

### Statuses

| Status (French) | Meaning |
|---|---|
| **En attente** | In your drawer, not yet cashed |
| **Encaissé** | Cashed — now it is money |
| **Payé** | Supplier cheque the supplier confirmed paid |
| **Rejeté** | Bounced — does not count anymore |
| **Déposé** | Deposited at the bank |
| **Non échu** | A traite whose due date (**échéance**) has not arrived yet |

### Cash a client cheque (**Encaisser**)

1. Open **Chèques** and find the row (use the search or filters).
2. Click **✓ Encaisser** and confirm.
3. The cheque becomes **Encaissé**. The linked order's paid amount updates: what was **Partiel** or **Impayé** can become **Payé**.

### Mark a supplier cheque paid (**Marquer payé**)

1. Find the cheque row linked to a purchase invoice (type **Fournisseur**).
2. Click **✓ Marquer payé** when the supplier confirms.
3. The linked purchase invoice moves toward **Payé**.

### Reject a cheque (**Rejeter**)

1. Click **✗ Rejeter** on the row and confirm.
2. The cheque becomes **Rejeté** and its amount is removed from the payments. The linked order or invoice shows unpaid again — call the client.

### The traite rule (**Non échu**)

A traite before its due date shows **Non échu**. If you try to cash it early, the app warns you that a traite normally cannot be cashed before its échéance, and asks you to confirm. Only do this if you really deposited it and the bank accepted.

### The golden rule

Never count paper as money. An order shows **Payé** only when cash + card + **Encaissé** cheques cover the total. If a client asks "why do you say I still owe?", open their order and show the **En attente** cheques — the reçu explains it on paper.

---

## 8. Stock, products and lens blanks (**Stock**, **Verres**)

**The stock pages make sure you never sell what you do not have, and never lose track of a lens blank.**

### Create a product

1. Open **Stock** → **Nouveau produit**.
2. Fill in: **Nom**, **Marque**, **Modèle**, **Réf**, **Catégorie**, **Prix de vente**, **Prix d'achat**, **Quantité**, and the supplier (**Fournisseur**) if you want.
3. Categories: **Montures** (frames), **Verres**, **Lentilles** (contact lenses), **Accessoires**, **Nettoyant Lentilles**, **Nettoyant Monture**.
4. Click **Enregistrer**.

### QR codes

1. In the product row, click the QR icon (**Code QR**).
2. Print the code and stick it on the product or its shelf.
3. Later, scan the code into the **Stock** search box — the product appears instantly. The search box accepts a scanned code as well as typed text.

### Stock adjustments

- **Restock**: open the product → **Ajouter du stock**, enter the quantity received.
- **Sales**: automatic. Every order or quick sale reduces the quantity.
- **Breakage (lens blanks)**: recorded on the blank's history (see below), so the quantity stays true.

### Stock level labels

| Label | Meaning |
|---|---|
| **En stock** | Healthy quantity |
| **Stock bas** | 3 or fewer — plan to reorder |
| **En rupture** | Zero — remove from display or reorder urgently |

The **Articles en stock bas** count on the dashboard and the bell notification use the same rule. The total value of the stock shows at the top of the page (**Valeur totale du stock**).

### Lens blanks (**Verres**)

Lens blanks live separately because a "product" here is a combination of values, not a box.

1. Open **Verres** (admin and atelier accounts) or **Nouveau verre** from the atelier.
2. Each blank has: **Marque** (brand), type — **Unifocal**, **Progressif**, **Bifocal**, **Bureau**, **Photochromique** — **Matériau** (CR-39, Polycarbonate, Haut index, Trivex), **Épaisseur**, **Traitement** (Aucun, Anti-reflet, Anti-rayure, Anti-lumière bleue), and the exact **SPH** and **CYL** values.
3. When you create an order, the app matches the prescription's SPH/CYL against the blanks and proposes the **Verres correspondants**.
4. Every usage (taken for an order) and every breakage is recorded in the blank's history — the quantity and the story stay exact.

---

## 9. Purchases (**Factures fournisseur**)

**You always know what you owe your suppliers, with the same honesty rules as for clients.**

### Create a supplier invoice

1. Open **Factures fournisseur** → **Nouvelle facture**.
2. Choose the **Fournisseur** (create one with **Ajouter un fournisseur** from the **Fournisseurs** page if needed).
3. Enter the invoice number (**Facture N°**), the date, and the items with quantities and prices.
4. Add payments if you pay right away:
   - **Cash**: counts immediately.
   - **Chèque** or **Traite**: number, bank, due date. It appears on **Chèques et traites** as a supplier cheque.
5. Save. The invoice shows one of: **Impayé**, **Partiel**, **Payé**.

### Pay a supplier by cheque

1. Give the cheque to the supplier and record it on the invoice (step 4 above).
2. When the supplier confirms it is cashed, open **Chèques et traites**, find the row, click **✓ Marquer payé**.
3. The invoice updates toward **Payé**.

### Read an invoice status

| Badge | Meaning |
|---|---|
| **Payé** | Cash + confirmed cheques cover the total |
| **Partiel** | Some paid, some remains |
| **Impayé** | Nothing validly paid yet |

---

## 10. Partner opticians and their bills (**Opticiens partenaires**)

**Your atelier also works for other opticians — this keeps those jobs and their money visible.**

### Create a partner optician

1. Open **Opticiens partenaires** → **Nouvel opticien**.
2. Fill in **Nom**, **Téléphone**, **Adresse**, **Notes**.
3. Click **Enregistrer**.

### Their work and their bills

1. Each job you do for a partner is a work order in **Travaux atelier** (section 11).
2. Each work order produces a bill with status **Payée**, **Partiel** or **Impayée**.
3. Record their payments on the work order; the bill status updates.
4. In **Rapports** (atelier side), **Revenu par opticien** shows what each partner brings you.

---

## 11. Repairs and work orders (**Réparations**, **Travaux atelier**)

**Nothing stays in the workshop without a trace: who asked, what is broken, who did it, who paid.**

### Internal repairs (attached to a client order)

1. Repair services (remontage, soudure, and others) are defined in **Paramètres** → **Services de réparation** with a name and **Prix par défaut**. Add or edit them anytime with **Nouveau service**.
2. When creating an order, add one or more repair services with their prices.
3. Open **Réparations** (dashboard button) to see all repairs: search by client or optician, late jobs show **En retard**.
4. When a repair is finished, mark it complete so it leaves the pending list.

### Work orders for partner opticians (**Travaux atelier**)

1. Open **Travaux atelier** and create a new work order for a partner optician, with the prescription if there is one.
2. Follow the statuses: **pending** → **in progress** → **completed** → **delivered** (or **cancelled**).
3. Assign the lens blanks used (the app warns if none match — the partner can provide them).
4. **Breakage**: if a blank breaks, open the work order and use **Déclarer une casse** — choose **Gauche**, **Droite** or **Les deux**, and optionally pick a replacement blank from stock for each broken eye (a work order can be reported late; the button disappears once a breakage is already declared).
5. The replacement is consumed from stock, but the work order and bill amounts never increase — the atelier takes responsibility for the breakage. Both the declaration and the replacement are journaled, so the stock stays honest.
6. Every declaration feeds the **Taux de casse** and **Casse par verre** stats in **Rapports**, so recurring breakages become visible.
7. **Payments**: record what the optician pays; the bill becomes **Payée** when covered.

---

## 12. Notifications

**The bell is your to-do list — it opens with a click, top of the screen.**

| Notification | Meaning | What to do |
|---|---|---|
| **Chèques à échoir** | A cheque or traite reaches its due date within 7 days | Deposit it or check the bank; cash it when it returns |
| **Stock bas** | Products at 3 or fewer | Restock (section 8) |
| **Réparations en attente** | Repairs not finished | Open **Réparations** and move them forward |
| **Commandes prêtes** | Orders ready for pickup | Call the clients; hand over the glasses |

Clicking a notification opens the right page. If the list is empty, everything is under control. (SMS notifications appear in **Paramètres** but are announced for a future update — for now, alerts are inside the app.)

---

## 13. Reports (**Rapports**)

**Reports turn your daily work into decisions — pick a period, read, act.**

Choose the period at the top: **Aujourd'hui**, **Cette semaine**, **Ce mois**, **Cette année**, **Tout**. The shop account and the atelier account see different pages.

Cards whose title carries the period (for example **Chiffre d'affaires — Ce mois**) follow the selector, and the suffix changes with it. Each headline card also shows a small ▲ or ▼ percentage: the change compared with the previous equivalent period (yesterday, the previous week, the previous month, the previous year). No arrow appears when there is nothing to compare — and with **Tout** there is never a comparison. Revenue and profit count only **Terminé** orders. Cards about money outside and stock are always live: **Créances**, **Santé du stock**, **Réapprovisionnement**, **Soldes fournisseurs**, and the workshop backlog show the situation right now and ignore the period. Finally, the same échéances rule as everywhere in the app applies: chèques and traités count as money only once marked **Encaissé** (or **Payé** for supplier papers).

In the tables below, labels are quoted for the default **Ce mois** period.

### Shop side

| Card (French label) | What it means | Decision it supports |
|---|---|---|
| **Chiffre d'affaires — Ce mois** | Money from completed orders in the chosen period, with ▲/▼ % versus the previous period | Is the shop growing or slowing down? |
| **Bénéfice — Ce mois** | What remains after subtracting the purchase cost of the items sold; the **Marge : X %** line underneath is profit divided by revenue | Is the shop keeping a healthy share of every dinar of sales? |
| **Commandes — Ce mois** | All orders created in the period, whatever their status | How busy the shop is — staffing and opening hours |
| **Panier moyen — Ce mois** | Average value of a completed sale | Are you selling complete pairs or mostly small items? |
| **Nouveaux clients — Ce mois** | Clients created in the period | Is the shop attracting new faces? |
| **Tendance des revenus (12 mois)** | Always the last 12 months: monthly revenue (green **Revenu** line) and profit (blue **Bénéfice** line) | Season patterns; whether profit grows along with revenue |
| **Revenus par type — Ce mois** | Revenue split between **Monture + Verres**, **Remontage** and **Vente directe** | Which activity actually pays the bills |
| **Commandes par statut — Ce mois** | Orders still **En attente** and those **Terminé**; below, **Annulations** and the **CA perdu** they represented | What to follow up; what cancellations cost you |
| **Ventes par paiement — Ce mois** | How money arrived: **Espèces** and **Carte** count immediately; **Chèques/traits encaissés** only once marked **Encaissé** | How money really arrives; how dependent you are on paper |
| **Créances** | Live, all-time: **Impayés commandes** (order balances still owed), **Instruments en attente** (chèques/traités not yet cashed), **Instruments échus** (past their due date — in red) | Which papers to chase, in order of urgency |
| **Encaissements — 12 derniers mois** | Always the last 12 months: **Délai d'encaissement moyen** (average days between a sale and its cheque being cashed), **Taux de rejet** (bounced ÷ cashed + bounced), and the **Encaissés** / **Rejetés** counts | How fast paper turns into money, and how often it fails |
| **Top clients** | The period's best clients by total spent, with order count and revenue | Who deserves a thank-you call or a discount |
| **Clients fidèles** | Share of active clients with 2 or more orders in the period | The loyal base — recognize and keep it |
| **Moyenne/jour** | Orders per day over the period | Daily targets for the team |
| **Concentration du CA** | Share of the period's revenue made by the top 10 % of clients; the text repeats the figure and the number of active clients | Dependency risk: too much revenue from too few people |
| **CA nouveaux vs fidèles** | Period revenue split between **Nouveaux clients** (their first-ever completed order falls in the period) and **Clients fidèles** (everyone else) | Is growth coming from new clients or from loyalty? |
| **Top médecins** | Prescribing doctors behind the period's completed orders, with order count and revenue | Which doctors send you clients — nurture those relationships |
| **Demande de correction** | From the period's prescriptions: **Sphère (SPH)** bands from ≤ −6 up to ≥ +4, and **Cylindre (CYL)** by strength | Which lens powers to keep on the shelf |
| **Soldes fournisseurs** | Per supplier: **Achats** made in the period and **Solde dû** — everything still unpaid, including traités not yet due (red when above zero) | What you owe whom, before the supplier calls |
| **Risques & couverture** | **Annulations** and **CA perdu** for the period, then live **Semaines de couverture** per category: current stock ÷ average weekly sales of the last 90 days; ∞ means it has not sold recently | How many weeks of stock remain per category, and what running out would cost |
| **Réapprovisionnement** | Live list of products at 3 units or fewer, with quantity and supplier | The reorder list, ready to phone in |
| **Santé du stock** | Live: **Ruptures** (zero stock), **Stock bas** (3 or fewer), **Stock dormant (90j)** (in stock, nothing sold for 90 days), **Valeur du stock**; underneath, **Marge par catégorie** — margin per category from item prices × quantities (repair-service lines are not included, so it can differ slightly from order totals) | What to reorder, what to discount, which categories earn the most |
| **Meilleurs produits** | Per category, the period's best sellers with quantity, revenue and profit | Which references to display and push |
| **Ventes par jour de la semaine** | Orders of the period grouped by weekday | Which days deserve more staff |
| **Ventes par heure (8h–23h)** | Orders of the period grouped by hour of the day | Shift planning and opening hours |
| **Paniers de commande** | Orders of the period grouped by value: **< 200**, **200 – 500**, **500 – 1 000**, **> 1 000** DT | Whether you sell big or small — and what a higher basket would be worth |

### Atelier side

| Card (French label) | What it means | Decision it supports |
|---|---|---|
| **Chiffre d'affaires — Ce mois** | Revenue of completed work orders in the period (service price + lens prices), with ▲/▼ % versus the previous period | Is the workshop growing? |
| **Terminés — Ce mois** | Work orders completed in the period | The team's output |
| **Délai moyen — Ce mois** | Average time between starting and finishing the jobs completed in the period; here down (▼) is good | Promises you can keep to opticians |
| **Taux de casse — Ce mois** | Share of handled lens blanks that broke; down (▼) is good | Handling care or supplier quality |
| **Arriéré — Ce mois** | Despite the period tag, this is the current backlog: pending + in-progress work orders, with their **Âge moyen (attente + cours)** | The total weight on the bench right now |
| **Panier moyen — Ce mois** | Average revenue per completed work order | How you price services and lenses |
| **Tendance des revenus (12 mois)** | Always the last 12 months: monthly revenue of completed work orders (green **Revenu** line) | The season pattern of workshop demand |
| **Origine des ordres** | Orders of the period split **Interne** (your own shop) vs **Opticien** (partners) | Where the work comes from |
| **Débit hebdomadaire (12 semaines)** | Always the last 12 weeks: **Créés** vs **Terminés** per week | If created runs above completed, the backlog is growing |
| **Ancienneté des arriérés** | Current backlog grouped by days since creation: **0–3 j**, **4–7 j**, **8–14 j**, **15 j +** | Which old jobs to unblock first |
| **Partenaires opticiens** | Per optician: orders and revenue in the period, **Délai moyen** over all time, **Dette** (all bills minus payments, all time — red when above zero), **Dernière activité** | Who is active, who pays, who has gone quiet |
| **Charge atelier** | Live: **En attente**, **En cours**, and **Âge moyen (attente + cours)** | Accept or postpone new work |
| **Verres consommés** | Blanks used for mounting in the period (**Consommés**) next to the **En stock** quantity today (amber at 3 or fewer) | Restock the blanks you actually use |
| **Casse par verre** | Blanks broken during mounting, per reference, in the period | Which references break most — handling or quality |
| **Stock verres critique** | Live: number of blank references at 3 or fewer (**références avec quantité ≤ 3**), with the list | The lens order to place now |
| **Ordres par magasin** | Work orders of the period per partner shop | How work is distributed between partners |
| **Revenu par opticien** | Revenue brought by each partner shop in the period | Where to invest relationship effort |

### Printing a report

Use your browser's print function (Ctrl+P) — the report page is designed to print cleanly. The dashboard KPIs give you the same headline numbers in seconds if you only need a quick look.

---

## 14. Good practices and FAQ

**A few habits make every number in this app trustworthy.**

### End-of-day checklist

1. **Chèques**: click **Encaisser** on every cheque or traite that came back cashed today.
2. **Rapports** → **Créances**: read your money outside; make one call if a number grew.
3. **Tableau de bord**: any **Prêt à récupérer** left? Call tomorrow's list is ready.
4. **Notifications**: clear the low-stock items you can order.

### A client's cheque bounced — what happens?

Open **Chèques et traites**, find the cheque, click **✗ Rejeter**. The payment is removed, so the order shows unpaid (**Impayé** or **Partiel**) again — this is correct and intentional. Call the client to arrange a new payment, and record it on the order.

### Why does my paid order show unpaid?

Almost always: the client paid by cheque or traite that is not cashed yet. The order shows **En attente** for that payment until you click **Encaisser** in **Chèques et traites**. Cash and card, on the other hand, count immediately.

### A client paid a deposit — how do I prove it?

Print the reçu: **Facturation** → open the order → **Imprimer le reçu**. It shows the acompte, the pending cheques as **En attente**, and the **Reste**.

### The prescription from last year — where is it?

Open the client: all their prescriptions are kept in the **Ordonnances** section of their page, with dates and the doctor's name. The latest is proposed automatically on a new order.

### Something was sold but the stock did not move?

The quantity moves only when the sale is recorded in the app. Check for a missing order or quick sale — that is also why every sale should be entered before the client leaves.

### Starting fresh

The database can be reset with a demo dataset (orders #1001–#1014, cheques in different states) on request — useful for training a new employee without touching real data.
