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
| **Réparations en attente** | Repairs not finished | Open them and move them forward |
| **Stock** | Total number of products | Nothing |

The atelier account sees the same cards with workshop numbers: revenue, partner opticians count, completed work orders, low-stock lens blanks, pending work orders, total lens blanks.

### Quick actions

Three buttons under the cards: **Réparations** (open the repairs page), **Opticiens partenaires** (partner opticians), and **Nouvelle commande** (start a sale).

### The "ready for pickup" list (**Prêt à récupérer**)

Orders ready to hand to clients, with order number, client name, phone and total.

**What to do:** call each client the same day. Click **Voir** to open the order; when the client has taken the glasses, click **Marquer comme récupéré**.

### What to do when a card alerts you

- **Articles en stock bas**: open **Stock**, sort by quantity, restock the critical items (section 8).
- **Réparations en attente**: click the **Réparations** quick action and finish or follow up on each job.
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

## 4. Prescriptions (**Ordonnances**)

**The app remembers every prescription, so the next order picks the right values automatically.**

### Create a prescription

1. Open **Ordonnances** → **Nouvelle ordonnance**.
2. Choose the client and the **Médecin**.
3. Set **Date de l'ordonnance**.
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
4. **Breakage**: if a blank breaks, record it and choose the replacement blank used — both are journaled, so the stock stays honest.
5. **Payments**: record what the optician pays; the bill becomes **Payée** when covered.

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

### Shop side

| Number | What it tells you in one sentence | Decision it supports |
|---|---|---|
| **Revenu ce mois** | Money earned this period | Is the shop growing? |
| **Commandes ce mois / aujourd'hui** | How busy you are | Staffing and opening hours |
| **Panier moyen** | Average sale value | Are you selling complete pairs or only small items? |
| **Bénéfice ce mois** | Profit after purchase costs | Is the margin healthy? |
| **Solde impayé** | Orders not fully paid | Who to call |
| **Top clients** | Your best clients by total spent | Who deserves a call or a discount |
| **Ventes par paiement** | Espèces / Carte / Chèques-traits encaissés | How money really arrives |
| **Créances** | Your money outside: **Impayés commandes**, **Instruments en attente**, **Instruments échus** (overdue — in red) | Which papers to chase, in order of urgency |
| **Santé du stock** | **Ruptures**, **Stock bas**, **Stock dormant (90j)**, **Valeur du stock** | What to reorder, what to discount |
| **Clients fidèles** | Clients with 2 or more orders in the period | Your loyal base — keep them |
| **Moyenne/jour** | Orders per day | Targets for the team |

### Atelier side

| Number | What it tells you | Decision it supports |
|---|---|---|
| **Charge atelier** | Work in progress and its average age | Accept or postpone new work |
| **Délai moyen** | Average time to finish a job | Promises you can keep |
| **Taux de casse** | Breakages / lens blanks consumed | Handling care or supplier quality |
| **Revenu par opticien** | What each partner shop brings | Where to invest effort |
| **Stock verres critique** | Blank references at 3 or fewer | Which blanks to order now |

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

**Ordonnances**, or open the client: all their prescriptions are kept, with dates and the doctor's name. The latest is proposed automatically on a new order.

### Something was sold but the stock did not move?

The quantity moves only when the sale is recorded in the app. Check for a missing order or quick sale — that is also why every sale should be entered before the client leaves.

### Starting fresh

The database can be reset with a demo dataset (orders #1001–#1014, cheques in different states) on request — useful for training a new employee without touching real data.
