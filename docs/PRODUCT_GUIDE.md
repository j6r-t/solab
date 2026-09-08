# Sofien Optic — Product Guide

This guide explains every part of the app and why it helps you. For step-by-step instructions with exact button names, read the **User Manual**.

---

## Dashboard (**Tableau de bord**)

**What it is.** The first screen after login. It shows KPI cards (revenue of the month, total clients, today's orders, low stock, pending repairs, product count), quick action buttons, and the **Prêt à récupérer** list: orders ready to hand to clients, with phone numbers.

**Why it helps you.** In ten seconds each morning you know the state of the shop and what to do today: call ready clients, restock what is low, follow up on repairs.

---

## Orders (**Commandes**)

**What it is.** Every sale is an order. Three types: **Monture + Verres** (frame + prescription lenses), **Remontage** (new lenses in the client's own frame), and **Vente directe** (quick sale of accessories, contact lenses or ready glasses). An order moves through statuses: **En attente** → **Prêt** → **Terminé** (or **Annulé**).

**Why it helps you.** Nothing is forgotten. You know which glasses are waiting for lenses, which are ready for pickup, who paid and who still owes — for every order, forever.

---

## Clients, Prescriptions and Doctors (**Clients**, **Médecins**)

**What it is.** Client records with phone, address, insurance (**Organisme / Assurance**) and notes (allergies, preferences). Each client can have several prescriptions, with the values for each eye and the prescribing doctor. Prescriptions are managed from the client's page in the **Ordonnances** section: history table, details, **Nouvelle ordonnance**.

**Why it helps you.** When a client returns, their history is there: old prescriptions, old orders, what they bought. The latest prescription is proposed automatically on the next order, so no more searching through drawers.

---

## Payments, Cheques and Traités (**Chèques et traites**)

**What it is.** On an order you can combine several payment rows: cash (**Espèces**), card (**Carte**), cheque (**Chèque**) and traite (**Traite**). A cheque or traite needs its number, the bank and a due date (**échéance**). The **Chèques et traites** page lists every cheque and traite: those given **by clients** (linked to orders) and those **given to suppliers** (linked to purchase invoices), with summary cards **En attente** / **Encaissés** / **Rejetés** and filters by status and type.

The two simple rules:

| | Cheque (chèque) | Traite |
|---|---|---|
| What it is | Money on its way | A promise to pay at a set date |
| Due date (**échéance**) | Not required by the app | Required — cannot normally be cashed before it |
| Counts as money | Only when you click **Encaisser** | Only when you click **Encaisser** (the app warns **Non échu** if you cash it early) |
| If it fails | Click **Rejeter** — the order shows unpaid again | Click **Rejeter** — same effect |

**Why it helps you.** Paper is not money. The app never counts a cheque as received until it is truly cashed, so your revenue numbers stay honest, and nothing is silently forgotten in a drawer.

---

## Billing Documents (**Facturation**)

**What it is.** The list of all orders with payments. Two printable documents, one click each:

| Document | French title | What it shows | When to use it |
|---|---|---|---|
| Facture (invoice) | **FACTURE** | Client, date, items, total | The official invoice for the purchase |
| Reçu (receipt) | **REÇU** | Deposit (**acompte**), **En attente** for pending cheques, **Reste** (what remains) | Proof of payment when the client pays in several times |

The facture prints with the shop identity: **Sofien Optic**, address *Rue de la Liberte a cote Mosquee Omar ibn Elkhattab*, phones 24.398.692 / 24.248.632.

**Why it helps you.** Two buttons instead of a handwritten book. The client sees exactly what was paid and what remains, and pending cheques are marked **En attente**, not counted as paid.

---

## Purchases (**Factures fournisseur**, **Fournisseurs**)

**What it is.** Supplier invoices. You record what you bought, from whom, and at what price. You pay with cash, cheque or traite — the same rules as for clients, in reverse: a supplier cheque is marked **Payé** when the supplier confirms it is cashed. Each invoice shows **Impayé**, **Partiel** or **Payé**.

**Why it helps you.** You know at any moment what you owe your suppliers, and the purchase prices feed your profit calculations in **Rapports**.

---

## The Workshop (**Travaux atelier**, **Réparations**, **Opticiens partenaires**)

**What it is.** Two flows:

- **Internal repairs** are attached to client orders (remontage, soudure, and other services you define with prices in **Paramètres** → **Services de réparation**). The **Réparations** page — opened from the dashboard button — tracks them and shows late jobs (**En retard**).
- **Direct work orders** for partner opticians (**Opticiens partenaires**): other opticians send work to your atelier. Each work order in **Travaux atelier** moves through **pending → in progress → completed → delivered**, can have lens blanks assigned, records breakage with the replacement blank used, and records their payments. Each partner gets a bill with status **Payée**, **Partiel** or **Impayée**.

**Why it helps you.** The atelier stops being a black box: you see the workload, the age of each job, the breakage rate, and what each optician shop brings you.

---

## Stock and Lens Inventory (**Stock**, **Verres**)

**What it is.** Products in categories: frames (**Montures**), lenses (**Verres**), contact lenses (**Lentilles**), accessories (**Accessoires**), cleaning products (**Nettoyant Lentilles**, **Nettoyant Monture**). Each product has a quantity, a purchase price, a selling price and a **Code QR** you can print and stick on it — scan it to find the product instantly. Quantities drop automatically with sales; low-stock alerts appear at 3 units or fewer, and **En rupture** at zero.

**Verres** (lens blanks) are tracked separately: brand, type (Unifocal, Progressif, Bifocal, Bureau, Photochromique), material (CR-39, Polycarbonate, Haut index, Trivex), thickness, and the exact SPH and CYL values. Each blank taken for an order, and each breakage, is recorded in its history.

**Why it helps you.** No more selling a frame that is not there. And in **Rapports** → **Santé du stock** you see the dead stock — items not sold for 90 days — which is money sitting on a shelf.

---

## Reports (**Rapports**)

**What it is.** Your numbers for a period (today, this week, this month, this year, all). The page adapts to your role:

| Role | Numbers to check weekly |
|---|---|
| Owner / Shop | Revenue and profit (**Bénéfice**) with the **Marge** line, orders and average basket (**Panier moyen**) — each with a ▲/▼ delta versus the previous period; sales by payment method, **Créances** and **Encaissements** (how fast cheques turn into money), **Concentration du CA** (top 10 % of clients), **Top médecins** and **Demande de correction**, **Soldes fournisseurs**, stock health with dead stock and **Réapprovisionnement**, repeat clients, daily average |
| Atelier | Workload with backlog aging (**Ancienneté des arriérés**), average turnaround, breakage rate, partner scorecard (**Partenaires opticiens**) including each optician's **Dette**, weekly throughput (**Débit hebdomadaire**), lens usage (**Verres consommés**), critical lens-blank stock |

Every headline KPI compares the chosen period with the previous equivalent one — this month against last month, this year against last year — so growth is visible at a glance. The **Bénéfice** line shows what remains after purchase costs, with the margin percentage underneath. Money-outside and stock cards (like **Créances** and **Santé du stock**) always show the live, current situation.

**Why it helps you.** Decisions stop being guesses: which clients to call, which payment habits to watch, what to reorder, and how much money is outside.

---

## Notifications

**What it is.** The bell at the top of the screen. Four alerts: **Chèques à échoir** (cheques due within 7 days), **Stock bas**, **Réparations en attente**, **Commandes prêtes**. Clicking an alert opens the right page.

**Why it helps you.** The app remembers for you: no more missed pickups or forgotten cheques.

---

## Settings (**Paramètres**)

**What it is.** Language (**Langue**: Français / English), appearance (**Apparence**: Clair / Sombre / Système), your profile and password, the repair services price list, and the lens types and brands.

**Why it helps you.** Each person works in their language and comfortable brightness, and the prices you charge for repair services stay up to date in one place.

---

## Who sees what (roles)

| Menu | Admin (boss) | Shop (Magasin) | Atelier |
|---|---|---|---|
| Tableau de bord | Yes | Yes | Yes |
| Clients, Médecins (prescriptions on the client page) | Yes | Yes | No |
| Stock | Yes | Yes | No |
| Verres (lens blanks) | Yes | No | Yes |
| Commandes, Facturation, Chèques | Yes | Yes | No |
| Travaux atelier, Réparations, Opticiens partenaires | Yes | No | Yes |
| Factures fournisseur, Fournisseurs | Yes | Yes | Yes |
| Rapports, Paramètres | Yes | Yes | Yes |
| Import (CSV) | Yes | Yes | No |
| Journal d'audit | Yes | No | No |

---

## How the money numbers work

One golden rule: **paper is not money until it is cashed.**

- **Paid** = cash (**Espèces**) + card (**Carte**) + cheques and traites that are **Encaissé**. Nothing else.
- **En attente** = cheques and traites given to you but not yet cashed. They appear in **Créances** as money outside, not as revenue in your pocket.
- **Rejected** (**Rejeté**) = a bounced cheque removes that payment; the order shows unpaid again.
- Nothing is ever silently counted as paid. If a number surprises you, it is almost always a cheque not yet cashed — check **Chèques et traites**.
