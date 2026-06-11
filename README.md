# SOLab
Before I build the full PDR (Preliminary Design Review) document, I need a few clarifications to make it accurate and tailored to your exact lab workflow. Please answer as many as you can — I'll make reasonable assumptions for any you skip.

❓ Clarification Questions
1. Lab Type & Terminology
What kind of lab is this?

Medical/clinical analysis lab (blood tests, urine, etc.)

Research/academic lab

Industrial quality control lab

Other (please specify)

This affects field names, analysis types, and report formats.

2. User Roles & Permissions
Do all 2–5 users have the same access, or do you need roles like:

Admin (full control)

Technician (create/edit analyses, manage stock)

Viewer (read-only)

Or just a single role for everyone?

3. Stock Management Details
Do you track consumables/reagents with expiry dates and lot numbers?

Does the app need to alert when stock is low?

Will stock quantities be adjusted automatically when items are used in an analysis or service?

4. Services & Pricing
Are services fixed packages (e.g., "Complete Blood Count - $20") or customizable?

Do you need a catalog where customers/patients can view services?

Are prices different for different clients/customer types?

5. Invoices
Who is the invoice issued to — external patients/customers, internal departments, or both?

Do you need invoice templates (logo, lab info, terms)?

Should invoices be exportable as PDF? Printed directly from the app?

Do you need a simple payment status tracking (Paid, Pending, Overdue)?

6. Analysis Module
What does an "analysis" record represent?

A patient sample, with multiple parameters tested, results entered manually or via device?

A research experiment with notes and outcomes?

Does it link to specific services from the catalog? To stock consumed?

7. Offline Requirements
Will the lab have unreliable internet? Do you need the app to work offline (local data entry, sync later), or is it acceptable to require a connection at all times?

8. Devices
Will users use only phones, or also tablets? Do you prefer a phone-only layout or a responsive tablet-friendly UI?

9. Language / Locale
Is the app in English, or do you need support for other languages (e.g., Arabic, French)?

10. Data Retention & Backup
Any special requirements for how long data is kept, or manual backup needs? (Supabase includes daily automated backups, but we can design additional export.)

📄 What the PDR Will Include (Once Clarified)
Executive Summary – Project purpose and scope

System Overview – High-level architecture diagram

Requirements – Functional & non-functional, derived from your answers

Data Model – Supabase table schemas, relationships

System Architecture – Android app layers, Supabase services

UI/UX Design – Wireframe descriptions for each screen

Security – Auth, Row Level Security, data protection

Testing Strategy – Unit, integration, and user acceptance

Deployment Plan – Version control (GitHub), Firebase App Distribution or side‑loading

Cost Analysis – Proof that it remains $0

Risk Management – Potential issues and mitigations

Timeline & Milestones
