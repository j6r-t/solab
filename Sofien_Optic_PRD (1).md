# Sofien Optic

**Product Requirements Document**

**PRD**

- Platform: Cloud-Based SaaS for Optical Shops
- Language: English / French | Currency: TND
- Audience: Developer (Single-User System)

Confidential | Version 1.3

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
   - 2.1 [Product Vision](#21-product-vision)
   - 2.2 [Target Audience](#22-target-audience)
   - 2.3 [Business Context](#23-business-context)
3. [User Workflows](#3-user-workflows)
   - 3.1 [Walk-In Scenario 1: New Eyewear Purchase with Prescription Lenses](#31-walk-in-scenario-1-new-eyewear-purchase-with-prescription-lenses)
   - 3.2 [Walk-In Scenario 2: Client Brings Own Frame for New Lenses (Remounting)](#32-walk-in-scenario-2-client-brings-own-frame-for-new-lenses-remounting)
   - 3.3 [Walk-In Scenario 3: Direct Purchase of Lenses or Accessories](#33-walk-in-scenario-3-direct-purchase-of-lenses-or-accessories)
   - 3.4 [Repair Workflow](#34-repair-workflow)
4. [Functional Requirements](#4-functional-requirements)
   - 4.1 [Stock Management Module](#41-stock-management-module)
   - 4.2 [Client Profile Module](#42-client-profile-module)
   - 4.3 [Prescription Module](#43-prescription-module)
   - 4.4 [Repair and Montage Module](#44-repair-and-montage-module)
   - 4.5 [Billing and Invoicing Module](#45-billing-and-invoicing-module)
   - 4.6 [SMS Notification Module](#46-sms-notification-module)
   - 4.7 [Analytics and Reports Module](#47-analytics-and-reports-module)
5. [Non-Functional Requirements](#5-non-functional-requirements)
   - 5.1 [Platform and Accessibility](#51-platform-and-accessibility)
   - 5.2 [Language Support](#52-language-support)
   - 5.3 [Currency and Formatting](#53-currency-and-formatting)
   - 5.4 [Performance and Scalability](#54-performance-and-scalability)
   - 5.5 [Data Security and Privacy](#55-data-security-and-privacy)
6. [Technical Considerations](#6-technical-considerations)
   - 6.1 [Technology Stack](#61-technology-stack)
   - 6.2 [Data Model Overview](#62-data-model-overview)
   - 6.3 [Deployment and Hosting](#63-deployment-and-hosting)
   - 6.4 [Project Architecture and Folder Structure](#64-project-architecture-and-folder-structure)
7. [Development Phases and Priority](#7-development-phases-and-priority)
   - 7.1 [Phase 1: Foundation (MVP)](#71-phase-1-foundation-mvp)
   - 7.2 [Phase 2: Operations](#72-phase-2-operations)
   - 7.3 [Phase 3: Communication and Intelligence](#73-phase-3-communication-and-intelligence)
   - 7.4 [Phase 4: Polish and Optimization](#74-phase-4-polish-and-optimization)
8. [Assumptions and Constraints](#8-assumptions-and-constraints)
9. [Glossary](#9-glossary)

---

## 1. Executive Summary

Sofien Optic is a cloud-based Software as a Service (SaaS) platform designed specifically for a single local optician shop to streamline and simplify its daily business operations. The platform addresses the critical pain points faced by optician shop owners, including managing customer prescriptions and orders, tracking inventory of eyewear and lenses, handling billing and invoicing, and generating business analytics reports. By digitizing these operations, the platform eliminates the reliance on paper-based records and manual tracking methods that are prone to errors and inefficiencies.

The platform is built with a mobile-first, responsive design philosophy, ensuring that the shop owner can access and manage all operations from either a smartphone or a desktop computer. The user interface is intentionally designed to be simple and fast, minimizing the number of input steps required for common tasks such as registering a new client, recording a purchase, or updating stock levels. This focus on speed and simplicity is critical in a retail environment where the shop owner needs to serve customers quickly without being tethered to a complex software system.

Key capabilities of the platform include a comprehensive stock management module with QR code generation for each eyewear item, enabling rapid identification and purchase processing. A client profile module stores all customer information including prescriptions, purchase history, and contact details. A repair and montage service module tracks service orders from intake through completion, with automated SMS notifications to inform clients when their orders are ready for pickup. An analytics and reporting module provides the shop owner with insights into sales performance, inventory status, and revenue trends, all displayed in a clear and actionable dashboard format.

The platform supports bilingual operation in both English and French, uses the Tunisian Dinar (TND) as its currency, and is designed exclusively for a single shop owner user. It is not a multi-tenant or subscription-based system, but rather a dedicated tool built to serve the specific operational needs of one local optician business. This focused scope allows the platform to be highly optimized for the workflows and processes that matter most to the shop owner.

---

## 2. Product Overview

### 2.1 Product Vision

The vision for Sofien Optic is to become the central nervous system of the optician shop, where every business operation, from client intake to final sale, flows through a single, unified digital platform. The platform aims to replace the fragmented combination of paper notebooks, spreadsheets, and memory-based tracking that currently runs the shop with a streamlined, reliable, and accessible digital solution. The shop owner should be able to manage the entire business from their pocket, whether they are at the counter serving a customer or away from the shop checking on the day's sales.

The core philosophy behind Sofien Optic is simplicity over feature bloat. Every module, every screen, and every interaction is designed with the understanding that the primary user is a shop owner who needs to complete tasks quickly and accurately, not a power user who wants to explore complex software configurations. The platform should feel like a natural extension of how the shop already operates, not a disruptive new system that requires extensive training or behavioral change. This means large touch targets, clear labels, minimal form fields, and smart defaults that reduce the cognitive load on the user.

### 2.2 Target Audience

The sole target user of Sofien Optic is the shop owner. There is only one user type in the system, and that user has full access to all modules and features. The platform does not support multiple user roles, employee accounts, or permission levels. This single-user design simplifies the authentication model, eliminates the need for complex access control, and ensures that the shop owner has complete visibility and control over every aspect of the business at all times.

The shop owner is expected to be a practical, hands-on business person who may not have advanced technical skills. The platform must be intuitive enough that someone with basic smartphone literacy can navigate and use all features without referring to a manual. The bilingual support (English and French) ensures that the owner can work in whichever language they are most comfortable with, and the interface should switch seamlessly between the two languages without requiring a page reload or app restart.

### 2.3 Business Context

The platform is being built for a local optician shop located in Tunisia. The shop provides a range of services and products to its customers: selling ready-made eyewear (frames with or without prescription lenses), selling individual lenses, selling accessories (cleaning solutions, cases, chains), providing repair services (montage work such as replacing nose pads, tightening screws, or re-fitting lenses into existing frames), and providing a remounting service where a client brings in their own existing frame and requests new prescription lenses to be fitted into it.

The shop operates on a cash-only basis. All transactions are settled in Tunisian Dinars (TND). The shop currently manages its operations through a combination of handwritten notes, paper receipts, and the owner's personal memory. There is existing client data and stock information that will need to be migrated into the platform once the database schema is finalized and the initial data import process is established. This migration is not part of the initial build scope but is planned as a post-launch activity.

---

## 3. User Workflows

This section describes the three primary walk-in scenarios and the repair workflow that the platform must support. Each workflow represents a distinct customer interaction pattern that the platform needs to handle from start to finish, including client registration, prescription recording, payment processing, and notification dispatch.

### 3.1 Walk-In Scenario 1: New Eyewear Purchase with Prescription Lenses

This is the most common and complex workflow in the shop. A customer walks in, browses the available eyewear collection, and selects a frame they like. The shop owner then checks or records the customer's prescription. If the customer is new, their profile is created in the system along with their prescription details. The owner then determines whether the required prescription lenses are currently in stock or need to be ordered from a supplier.

The customer can choose to pay the full amount upfront or pay half as a deposit, with the remaining balance due upon pickup. The system must record the payment status clearly so the owner knows at a glance whether a particular order has been fully paid or has an outstanding balance. A turnaround time is set for the order, which represents the expected date or number of days until the eyewear with the new prescription lenses will be ready. During this time, the eyewear is effectively reserved and removed from the available stock.

Once the eyewear is ready (the new lenses have been mounted into the frame), the shop owner sends an SMS notification to the customer, or calls them directly, to inform them that their order is complete. The customer then visits the shop, pays any remaining balance if they only paid a deposit initially, and receives their eyewear. The platform must update the order status to completed, record the final payment, and log the transaction in the customer's purchase history. The stock module should reflect that the eyewear has been sold and is no longer available.

### 3.2 Walk-In Scenario 2: Client Brings Own Frame for New Lenses (Remounting)

In this scenario, a customer arrives at the shop with their own existing eyewear frame and requests new prescription lenses to be fitted into it. The workflow is similar to Scenario 1 in terms of prescription checking, client registration (if new), and payment processing, but differs in that no eyewear frame is being sold from the shop's inventory. Instead, the shop is providing a service: the montage of new lenses into the customer's existing frame.

The platform must distinguish this type of order from a standard eyewear sale. The system should allow the owner to create an order that is linked to a client profile and prescription but is not linked to any eyewear stock item. Instead, the order is categorized as a remounting service. The price charged includes the cost of the new lenses plus the montage service fee. The same payment flexibility applies: the customer can pay in full or in half, with the remainder due on pickup. SMS notification is sent when the montage is complete, and the final payment is recorded upon delivery.

### 3.3 Walk-In Scenario 3: Direct Purchase of Lenses or Accessories

This is the simplest workflow. A customer visits the shop to purchase lenses (without a frame), cleaning solutions, eyewear cases, chains, or other accessories. The transaction is straightforward: the item is selected from stock, the price is determined, and the customer pays in full. No prescription is involved (unless the customer is buying prescription lenses separately, in which case a prescription may be recorded for the client's profile), no turnaround time is needed, and the item is immediately removed from stock upon sale.

The platform should support quick-sale functionality for this scenario. The owner should be able to scan a QR code on the item (if it is an eyewear or lens with a pre-generated code) or manually search for it in the stock module, add it to a simple sale record, and complete the transaction with minimal steps. The sale is immediately reflected in the inventory count and is recorded in the daily sales report. If the customer is an existing client, the purchase is also logged in their profile history.

### 3.4 Repair Workflow

The repair workflow is integrated into Scenario 1 and Scenario 2. When a customer's order involves montage work (fitting new lenses into a frame, whether the frame was purchased at the shop or brought in by the customer), the repair module tracks the status of that montage. The platform does not need to track the detailed steps of the repair process itself. The only information captured is the type of montage service provided, the associated client, the price of the service, and whether the montage is complete.

When the montage is finished, the shop owner updates the order status and the system triggers an SMS notification to the client. The turnaround time for the repair is selected during the initial purchase process in Scenarios 1 and 2. The repair module serves as a lightweight tracking layer that sits on top of the main order, providing the owner with a clear view of all pending montage work and their expected completion dates. This allows the owner to manage their workshop workload and proactively communicate with clients about delays or early completions.

---

## 4. Functional Requirements

This section defines the core modules that make up the Sofien Optic platform. Each module is described with its purpose, key features, and the specific functionality it must provide.

### 4.1 Stock Management Module

The stock management module is the backbone of the platform's inventory operations. It must handle three distinct categories of products: eyewear (complete frames, either with or without demo lenses), lenses (prescription lenses of various types, materials, and indices), and accessories (cleaning solutions, cases, chains, screws, nose pads, and other supplementary items). Each category has its own set of attributes and management requirements.

The module must support full CRUD operations (create, read, update, delete) for all product types. When a new product is added to the inventory, the system must automatically generate a unique QR code for that product. The QR code should encode a unique product identifier that, when scanned, immediately retrieves and displays the product's full details on screen. This enables the shop owner to quickly identify any item in the shop by simply scanning its QR code with the device camera, dramatically reducing the time needed to process sales and stock checks.

Stock quantities must be tracked in real-time. Every sale, restock, manual adjustment, or damage event must be logged as a stock adjustment with a reason code. The module should display current stock levels with visual indicators (such as color coding or badges) for low-stock and out-of-stock items. The shop owner should be able to filter and search the inventory by product name, brand, category, or stock status. A stock summary view should show the total number of items, total value, and items that need reordering.

The QR code labels should be printable, allowing the shop owner to print them on adhesive paper and attach them to the physical products in the shop. The QR code generation should happen server-side to ensure consistency and reliability, and the generated codes should be downloadable as printable images or PDF label sheets.

### 4.2 Client Profile Module

The client profile module is the customer relationship foundation of the platform. It stores all customer information including their full name, phone number, address, gender, and registration date. Each client profile serves as a hub that links to all of that customer's prescriptions, purchase orders, and received SMS notifications, providing the shop owner with a complete 360-degree view of every customer's history.

The module must support searching for clients by name or phone number, with results appearing instantly as the owner types (debounced search). When a new client is registered, only the essential fields (name and phone number) should be required; additional fields like address and gender can be filled in later. The client list should be sortable and display key information at a glance (name, phone, last visit date, total purchases). Each client's detail page should show their full profile, all linked prescriptions, complete order history with payment statuses, and a timeline of all SMS notifications sent to them.

The module should also provide a way to quickly check whether a phone number is already registered in the system, preventing duplicate client entries. If the owner enters a phone number that matches an existing client, the system should suggest linking the new transaction to that existing profile instead of creating a duplicate.

### 4.3 Prescription Module

The prescription module manages the optical prescription data for each client. A prescription record stores all the standard optical parameters: SPH (Sphere), CYL (Cylinder), Axis, ADD (Addition), and PD (Pupillary Distance) for both the left and right eyes. Critically, each prescription must also record the name of the prescribing doctor, which provides important context for the client's eye care history.

A client can have multiple prescriptions over time, as their vision needs change. The module should display the prescription history in reverse chronological order, with the most recent prescription prominently displayed. When creating a new order that requires prescription lenses, the system should allow the owner to select the client's most recent prescription as a default, with the option to create a new prescription or select a different previous one.

The prescription form should be designed for quick data entry, as the owner will typically be reading values off a paper prescription from a doctor and entering them rapidly. Clear labeling of left eye (OS) and right eye (OD) fields, logical tab order, and input validation (e.g., SPH values typically range from -20.00 to +20.00) will help reduce entry errors and speed up the process.

### 4.4 Repair and Montage Module

The repair and montage module is a lightweight service tracking system. It does not track the detailed steps of a repair process (no status progression through multiple stages). Instead, it captures the essential information: the type of montage service being performed (e.g., new lenses fitting, nose pad replacement, screw tightening, frame adjustment), the client who requested the service, the associated order, the price charged for the service, and the current status (pending or complete).

This module is always linked to an order. When a customer's purchase involves montage work (Scenario 1 or Scenario 2), the repair record is created as part of the order creation process. The owner simply selects the type of montage service and the expected turnaround time, and the system creates the repair tracking record automatically. When the work is done, the owner marks the repair as complete, which triggers the SMS notification to the client.

The module should provide a list view of all pending repairs, sorted by expected completion date, giving the owner a clear overview of their workshop workload. This view should show the client name, the type of service, the date the repair was received, and the expected completion date. The ability to filter by status (pending or complete) and to search by client name should also be available.

### 4.5 Billing and Invoicing Module

The billing module handles all financial transactions in the platform. It supports cash-only payments with the ability to record partial payments. When an order is created, the owner can record either a full payment (the customer pays the entire amount) or a partial payment (the customer pays a deposit, typically half, with the remaining balance due upon pickup). The system must clearly display the payment status of each order: fully paid, partially paid (showing the remaining balance), or unpaid.

The invoice should be a digital record that summarizes the order details: the client name, the items or services purchased, the individual prices, the total amount, and the payment history. The owner should be able to view and print invoices. The billing module should also track revenue data that feeds into the analytics module, recording the transaction date, amount, and payment status for reporting purposes.

For the quick-sale workflow (Scenario 3), the billing module should support a streamlined process where the owner can scan a QR code or search for a product, enter the quantity, and immediately generate a completed sale record with full payment, all in as few steps as possible.

### 4.6 SMS Notification Module

The SMS notification module is responsible for sending text messages to clients. The primary use case is automated notifications: when an order or repair is marked as complete, the system should automatically send an SMS to the client's registered phone number informing them that their order is ready for pickup. The SMS templates should be customizable and available in both English and French.

The module should also support manual message sending, where the owner can compose and send a custom SMS to any client directly from the client's profile page. This is useful for follow-ups, reminders about outstanding balances, or any other ad-hoc communication. A log of all sent messages (both automated and manual) should be maintained for reference, showing the recipient, the message content, the timestamp, and the delivery status.

The SMS integration is done through a third-party API (Twilio or a local Tunisian SMS provider). The API credentials should be stored as environment variables and should not be hardcoded in the application. The module should handle delivery failures gracefully, logging the failure reason and allowing the owner to retry sending the message.

### 4.7 Analytics and Reports Module

The analytics module provides the shop owner with business intelligence through a dashboard and detailed reports. The dashboard should display key performance indicators (KPIs) at a glance: total revenue for a selected period, number of transactions, average transaction value, and stock summary (total items, low-stock alerts). Visual charts should show sales trends over time (daily, weekly, monthly), revenue breakdown by product category, and stock movement patterns.

The module should support date-range filtering for all reports, allowing the owner to view data for today, this week, this month, this year, or any custom date range. Reports should be exportable (as CSV or PDF) for record-keeping or sharing. The analytics should cover revenue and sales metrics, inventory metrics (stock levels, turnover rates, items sold vs. restocked), and client metrics (new clients added, repeat customers, total active clients).

The dashboard should be the first page the owner sees after logging in, providing an immediate overview of the business's current status. The design should prioritize clarity and actionability: the owner should be able to understand the health of the business at a glance and identify any issues (such as declining sales or low stock levels) without having to dig through multiple screens.

---

## 5. Non-Functional Requirements

### 5.1 Platform and Accessibility

The platform must be accessible from both mobile phones and desktop computers through a web browser. It should be built as a responsive web application that adapts its layout and interaction patterns to the screen size of the device being used. On mobile, the interface should prioritize touch-friendly elements with large tap targets (minimum 44x44 pixels), bottom-sheet modals for forms, and thumb-zone-optimized navigation. On desktop, the interface should take advantage of the larger screen real estate with multi-column layouts, hover states, and keyboard shortcuts where appropriate.

The platform should be hosted on a cloud infrastructure to ensure reliable uptime and accessibility from any location. The shop owner should be able to access the platform from their phone while standing at the shop counter, from their home computer in the evening, or from any other device with a web browser. The web application must perform well on both modern smartphones (Chrome, Safari, Firefox) and desktop browsers, with a target page load time of under 3 seconds on a standard 4G mobile connection.

### 5.2 Language Support

The platform must support bilingual operation in English and French. The language should be selectable by the user from a settings menu or a toggle in the navigation bar, and the switch should take effect immediately across the entire interface without requiring a page reload. All static text (labels, button text, navigation items, error messages, placeholder text, and report headers) must be available in both languages. Dynamic data entered by the user (such as client names, product names, and notes) should be stored as-is and displayed in the language they were entered in.

The translation system should be designed for easy extension in the future, even though the current requirement is only English and French. This means using a translation key system rather than hardcoding strings directly into components. Dates, numbers, and currency values should be formatted according to the selected locale (e.g., date format, number separators). The SMS notification templates must also be available in both languages, with the option to send in the client's preferred language if known.

### 5.3 Currency and Formatting

The platform uses the Tunisian Dinar (TND) as its sole currency. All prices, totals, and financial figures must be displayed with the TND currency symbol or code. Number formatting should follow the conventions used in Tunisia, with comma as the decimal separator and period as the thousands separator (or the opposite, depending on local convention). The currency formatting must be consistent across all modules: stock management, billing, analytics, and reports. There is no requirement to support multiple currencies or currency conversion.

### 5.4 Performance and Scalability

Given that the platform serves a single shop, scalability requirements are modest. The system should comfortably handle the daily transaction volume of a typical optician shop (estimated at 10-30 transactions per day) without any performance degradation. Database queries should be optimized to return results in under 500 milliseconds, and the user interface should feel responsive with no perceptible lag when navigating between modules or performing common operations like searching for a client or scanning a QR code.

The QR code scanning feature must be fast and reliable. From the moment the camera captures the code to the moment the product details appear on screen, the total processing time should not exceed 2 seconds. The scanning should work in various lighting conditions typical of a retail environment, including indoor fluorescent lighting and natural daylight near windows. If the scan fails, the user should be able to manually enter the product code or search by name as a fallback.

### 5.5 Data Security and Privacy

The platform handles personal client information (names, phone numbers, prescriptions) and financial data (transaction records, payment statuses). All data must be transmitted over HTTPS, and the application must enforce authentication to prevent unauthorized access. Since there is only one user (the shop owner), the authentication system can be as simple as a secure login with email and password, optionally enhanced with two-factor authentication for additional security.

Client phone numbers used for SMS notifications must be stored securely and used only for the purposes described in this document. The platform must not share, sell, or expose client data to any third party. Regular database backups should be automated to prevent data loss in case of hardware failure or other emergencies. The backup strategy should include both automated daily backups and the ability to export all data manually at any time.

---

## 6. Technical Considerations

### 6.1 Technology Stack

The technology stack for Sofien Optic is built around three priorities: responsive web design that works seamlessly on both mobile phones and desktop computers, rapid development suited for a single-developer project, and future readiness for AI integration. The platform will be built as a responsive web application using a single codebase that adapts to any screen size, eliminating the need to develop and maintain separate mobile and desktop applications. The following table summarizes the complete technology stack for the project.

*Table: Technology Stack Summary*

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js + React | Responsive web, mobile-first, SSR built-in, single codebase for phone and PC |
| Backend / API | Next.js API Routes (Node.js) | Single repository, no separate backend server needed |
| Database | PostgreSQL | Relational, JSON columns for future AI, robust and performant |
| ORM | Prisma | Type-safe queries, auto migrations, excellent PostgreSQL integration |
| Authentication | NextAuth.js (or JWT) | Single-user email + password, lightweight |
| QR Generation | qrcode (npm) | Server-side generation, printable label output |
| QR Scanning | html5-qrcode (browser) | Camera-based scanning, no native app required |
| SMS Notifications | Twilio / Tunisian SMS API | REST API integration, async delivery |
| Charts / Reports | Recharts or Chart.js | Lightweight, responsive charts for analytics dashboard |
| Styling | Tailwind CSS | Mobile-first by design, fast UI development |
| Internationalization | next-intl | English + French locale routing |
| Deployment | Docker + Docker Compose | Full stack containerized, one-command deploy |

PostgreSQL is the chosen database for structured data storage. PostgreSQL offers robust relational capabilities, excellent performance for the query patterns expected in this application, and native support for JSON columns which will be valuable when an AI layer is introduced in the future. The AI integration is not planned for the current development scope but is a long-term consideration. To ensure the backend is AI-ready, the architecture follows a clean separation of concerns with a well-defined API layer between the frontend and the database, making it straightforward to inject AI-powered features (such as intelligent recommendations, sales forecasting, or automated insights) into the data pipeline without refactoring the core application.

The QR code generation uses the qrcode npm package on the server side to create printable labels for each stock item. The QR code scanning uses the html5-qrcode library in the browser, accessing the device camera through the WebRTC API to provide a native-feeling scanning experience without requiring a native mobile application. The SMS integration is done through a REST API provided by an SMS gateway service (Twilio or a local Tunisian SMS provider), with the API credentials stored securely as environment variables. Charts and reports in the analytics module are rendered using Recharts or Chart.js, both of which provide responsive, lightweight visualization components that work well on mobile and desktop screens.

### 6.2 Data Model Overview

The core data entities in the system include: User (the shop owner, single record), Client (customer profiles with contact info, gender, and registration date), Prescription (optical parameters with the prescribing doctor's name, linked to a client), Product (stock items categorized as eyewear, lenses, or accessories), QR Code (auto-generated unique identifier linked to a product), Order (a sales transaction linking a client, products, and services), Payment (records of cash payments linked to orders, supporting partial payments), Repair (service tracking with type, status, and turnaround), SMS Log (record of all sent notifications), and Stock Adjustment (log of all inventory changes with reasons).

The relationships between these entities are designed to support the workflows described in Section 3. An Order can contain one or more Products and zero or more Repairs. A Client can have multiple Prescriptions, Orders, and SMS Logs. Each Product has exactly one QR Code. Each Payment is linked to exactly one Order. This relational structure ensures data integrity and enables the analytics module to generate accurate reports by joining data across modules.

*Table 1: Core Data Entities Summary*

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| Client | Name, Phone, Address, Gender, Date | Has many Prescriptions, Orders |
| Prescription | SPH, CYL, Axis, ADD, PD, Doctor, Date | Belongs to Client |
| Product | Name, Brand, Category, Price, Qty | Has one QR Code |
| Order | Client, Items, Total, Status, Date | Has Payments, Repairs |
| Payment | Amount, Type (Full/Partial), Date | Belongs to Order |
| Repair | Type, Status, Turnaround, Price | Belongs to Order |
| SMS Log | Phone, Message, Status, Timestamp | Belongs to Client |
| Stock Adj. | Product, Quantity, Reason, Date | Belongs to Product |

### 6.3 Deployment and Hosting

The deployment strategy prioritizes minimizing cost to near zero. The preferred approach is to leverage genuinely free hosting options. Oracle Cloud Always Free tier provides ARM-based virtual machines (up to 4 VMs with 24GB RAM total) at no cost, making it the strongest candidate for hosting the application and the PostgreSQL database. Google Cloud Free Tier offers an e2-micro instance (1GB RAM) as a free alternative, though limited to certain regions. Both options require manual deployment, which is acceptable for this project since the owner-developer has direct control over the infrastructure and updates are infrequent.

Docker is the recommended deployment mechanism. The entire application (frontend, API, and database) should be containerized using Docker Compose, allowing the owner-developer to deploy the full stack with a single command on any compatible server. This approach eliminates the complexity of manual server configuration and makes it trivial to move the application between hosting providers if needed. Environment variables should be used for all sensitive configuration (database credentials, SMS API keys, session secrets), stored in a .env file on the server that is not committed to version control.

As a fallback if Oracle Cloud is unavailable or unsuitable, the platform can be self-hosted on an old PC or laptop at the shop running Linux (Ubuntu Server recommended). The machine should have a minimum of 2GB RAM and a working hard drive. While this introduces the risk of downtime due to power outages or hardware failure, it brings the hosting cost to absolute zero and eliminates any dependency on external cloud providers. Automated daily database backups using pg_dump should be configured via a cron job regardless of the hosting method, with backups stored locally and optionally copied to an external drive or free cloud storage for redundancy.

### 6.4 Project Architecture and Folder Structure

The application follows the Next.js App Router architecture with a clear separation between routes, components, libraries, and configuration. The project is organized into logical directories that map directly to the business modules defined in this document. This structure ensures that each feature is self-contained, easy to navigate, and straightforward to maintain by a single developer. The API layer is co-located with the application using Next.js Route Handlers, providing a clean REST interface between the frontend and the database without the need for a separate backend server.

#### 6.4.1 Directory Structure

The following directory tree outlines the complete project structure. The `src/` directory contains all application code, organized into `app/` for routes and API endpoints, `components/` grouped by business module, `lib/` for shared utilities and configuration, `i18n/` for internationalization files, `hooks/` for custom React hooks, and `types/` for shared TypeScript type definitions.

```
sofien-optic/
├── prisma/
│   ├── schema.prisma              # All database models
│   ├── seed.ts                    # Seed data
│   └── migrations/                # Auto-generated by Prisma
│
├── src/
│   ├── app/
│   │   ├── [locale]/              # next-intl locale routing (EN/FR)
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                   # Dashboard home (analytics overview)
│   │   │   │   ├── clients/
│   │   │   │   │   ├── page.tsx               # Client list
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx           # Client detail
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx           # Add client
│   │   │   │   ├── stock/
│   │   │   │   │   ├── page.tsx               # Stock inventory
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx           # Product detail
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx           # Add product
│   │   │   │   │   └── scan/
│   │   │   │   │       └── page.tsx           # QR scanner page
│   │   │   │   ├── prescriptions/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── billing/
│   │   │   │   │   ├── page.tsx               # Invoice list
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx           # Invoice detail
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx           # Create invoice
│   │   │   │   ├── repairs/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.tsx               # Analytics & reports
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx               # Profile, language, SMS config
│   │   │   ├── layout.tsx                     # Root layout with providers
│   │   │   └── page.tsx                       # Redirect to dashboard
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── clients/route.ts
│   │   │   ├── clients/[id]/route.ts
│   │   │   ├── stock/route.ts
│   │   │   ├── stock/[id]/route.ts
│   │   │   ├── stock/[id]/qr/route.ts         # QR code generation
│   │   │   ├── prescriptions/route.ts
│   │   │   ├── prescriptions/[id]/route.ts
│   │   │   ├── billing/route.ts
│   │   │   ├── billing/[id]/route.ts
│   │   │   ├── repairs/route.ts
│   │   │   ├── repairs/[id]/route.ts
│   │   │   ├── reports/route.ts
│   │   │   └── sms/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx                         # Absolute root
│   │
│   ├── components/
│   │   ├── ui/                                # Reusable UI (buttons, inputs, modals)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── clients/
│   │   │   ├── ClientForm.tsx
│   │   │   └── ClientCard.tsx
│   │   ├── stock/
│   │   │   ├── ProductForm.tsx
│   │   │   ├── QRGenerator.tsx
│   │   │   └── QRScanner.tsx
│   │   ├── prescriptions/
│   │   │   └── PrescriptionForm.tsx
│   │   ├── billing/
│   │   │   ├── InvoiceForm.tsx
│   │   │   └── InvoicePrint.tsx
│   │   ├── repairs/
│   │   │   └── RepairForm.tsx
│   │   ├── reports/
│   │   │   ├── SalesChart.tsx
│   │   │   ├── StockChart.tsx
│   │   │   └── KPICard.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── SearchBar.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts                          # Singleton Prisma client
│   │   ├── auth.ts                            # NextAuth config
│   │   ├── sms.ts                             # Twilio/Tunisian SMS helper
│   │   ├── qrcode.ts                          # QR generation utility
│   │   ├── utils.ts                           # Formatting (currency TND, dates)
│   │   └── validators.ts                      # Zod schemas for form validation
│   │
│   ├── i18n/
│   │   ├── config.ts                          # next-intl config
│   │   ├── request.ts                         # Locale detection
│   │   └── messages/
│   │       ├── en.json                        # English translations
│   │       └── fr.json                        # French translations
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts                   # Responsive detection
│   │   └── useQRScanner.ts
│   │
│   └── types/
│       └── index.ts                           # Shared TypeScript types
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

- **prisma/** — Contains `schema.prisma` (all database models), `seed.ts` (seed data), and `migrations/` (auto-generated by Prisma).
- **src/app/[locale]/** — Locale-prefixed routing using next-intl. Contains `(auth)/` for login, `(dashboard)/` for the main application layout and all module pages (clients, stock, prescriptions, billing, repairs, reports, settings).
- **src/app/api/** — REST API Route Handlers organized per entity (clients, stock, prescriptions, billing, repairs, reports, sms). Each entity has a `route.ts` for list/create and a `[id]/route.ts` for single-item operations.
- **src/components/** — Reusable UI components grouped by module. The `ui/` subfolder contains generic building blocks (buttons, inputs, modals, tables). The `layout/` subfolder contains Sidebar, Header, and MobileNav. Each business module has its own subfolder (`clients/`, `stock/`, `prescriptions/`, `billing/`, `repairs/`, `reports/`) with forms and display components. The `shared/` subfolder contains cross-module components like DataTable, SearchBar, and ConfirmDialog.
- **src/lib/** — Shared utility modules including `prisma.ts` (singleton database client), `auth.ts` (NextAuth configuration), `sms.ts` (SMS API helper), `qrcode.ts` (QR code generation), `utils.ts` (currency and date formatting), and `validators.ts` (Zod schemas for form validation shared between client and server).
- **src/i18n/** — Internationalization configuration with `config.ts` (locale settings), `request.ts` (locale detection middleware), and `messages/` containing `en.json` and `fr.json` translation files.
- **src/hooks/** — Custom React hooks including `useDebounce.ts` (input debouncing), `useMediaQuery.ts` (responsive breakpoint detection), and `useQRScanner.ts` (camera-based QR scanning logic).
- **src/types/** — Shared TypeScript type definitions and interfaces used across the application.

#### 6.4.2 Key Architecture Decisions

The following table summarizes the major architectural decisions and the rationale behind each one. These decisions were made to optimize for single-developer productivity, mobile-first user experience, and long-term maintainability.

*Table: Key Architecture Decisions*

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Routing | App Router (not Pages) | Modern Next.js pattern with better layouts, server components, and nested routing |
| Locale Routing | `[locale]/` prefix | next-intl standard pattern for English/French bilingual support |
| API Pattern | Route Handlers per entity | Clean REST endpoints, AI-ready for future feature injection |
| Component Grouping | Organized by module | Each business module (clients, stock, billing) has its own component folder for easy navigation |
| State Management | Server Components + URL state | Minimal client state needed for a single-user app; reduces complexity |
| Authentication | JWT (no DB sessions) | Simplest approach for single-user, no session table overhead |
| Form Validation | Zod schemas | Shared validation logic between client and server, type-safe |
| Database Access | Prisma singleton | Prevents connection pool exhaustion in development; single instance reused |
| Deployment | Docker Compose | Full stack containerized; one-command deploy to any server |

#### 6.4.3 Database Entity Relationships

The relational structure of the database follows a practical design that supports all three walk-in scenarios. The User entity represents the single shop owner. A Client can have multiple Prescriptions, Orders, and SMS Logs. Each Order contains one or more Products (through OrderItem) and zero or more Repairs. Each Order has one or more Payments (supporting partial payment tracking). Each Product has exactly one auto-generated QR Code. Stock Adjustments track all inventory changes. This relational model ensures data integrity across modules and enables the analytics module to generate accurate cross-module reports.

- **User** — Single record (shop owner). Has no direct links to business data; authenticates to access the system.
- **Client** — Has many Prescriptions, Orders, and SMS Logs. Core entity for customer management.
- **Prescription** — Belongs to one Client. Stores optical parameters and prescribing doctor name.
- **Product** — Has one QR Code and many Stock Adjustments. Categorized as eyewear, lenses, or accessories.
- **Order** — Belongs to one Client. Has many OrderItems, Payments, and optionally Repairs.
- **Payment** — Belongs to one Order. Supports full or partial payment with cash-only tracking.
- **Repair** — Belongs to one Order. Tracks montage service type, status, and turnaround time.
- **SMS Log** — Belongs to one Client. Records all sent notifications for audit and retry purposes.
- **Stock Adjustment** — Belongs to one Product. Logs quantity changes with reasons (sale, restock, adjustment, damage).

---

## 7. Development Phases and Priority

The development of Sofien Optic should follow a phased approach, starting with the most critical and frequently-used modules and progressively adding more advanced features. This approach allows the shop owner to start using the platform as early as possible and provides opportunities to gather real-world feedback that can inform the design of later phases. Each phase builds on the previous one, and the transition between phases should be seamless without requiring data migration or system reconfiguration.

### 7.1 Phase 1: Foundation (MVP)

The first phase focuses on establishing the core infrastructure and the two most essential modules: Client Profile and Stock Management. These modules form the foundation upon which all other features depend. The authentication system must be implemented to secure the platform, the database schema must be designed and deployed, and the responsive layout framework must be established. The stock management module should include the QR code generation feature from the start, as it is a core differentiator of the platform. The client profile module should support basic client registration, prescription recording, and purchase history tracking. A simple manual sale recording feature should be available to allow the owner to start tracking transactions immediately.

### 7.2 Phase 2: Operations

The second phase adds the operational modules that transform the platform from a simple data recording tool into a full business management system. This includes the complete order management system with support for all three walk-in scenarios (new eyewear purchase, remounting, and direct sale), the billing and invoicing module with partial payment tracking, and the repair and montage service module. The QR code scanning feature for rapid purchase initiation should also be implemented in this phase, connecting the stock module to the order workflow. By the end of this phase, the owner should be able to manage the complete lifecycle of every customer interaction through the platform.

### 7.3 Phase 3: Communication and Intelligence

The third phase introduces the SMS notification system and the analytics and reports module. The SMS integration requires selecting an SMS API provider, implementing the notification trigger logic (sending messages when orders or repairs are marked as complete), and building the manual message-sending interface. The analytics module should include the dashboard with visual charts, the date-range filtering for all reports, and the export functionality. This phase adds significant value to the platform by automating client communication and providing the owner with business intelligence that was previously unavailable.

### 7.4 Phase 4: Polish and Optimization

The final phase focuses on refining the user experience, optimizing performance, and addressing any issues identified during real-world usage. This includes improving the mobile UI based on the owner's feedback, adding keyboard shortcuts and other power-user features for desktop use, optimizing database queries for faster report generation, and implementing the data import tool for migrating existing client and stock data. Any remaining bilingual translation gaps should be closed in this phase, and the SMS templates should be refined based on actual client responses.

*Table 2: Development Phases Summary*

| Phase | Modules | Key Deliverables |
|-------|---------|------------------|
| Phase 1: Foundation | Auth, Client Profile, Stock Mgmt, QR Generation | Database schema, responsive layout, basic CRUD |
| Phase 2: Operations | Orders, Billing, Repair Module, QR Scanning | Full order lifecycle, partial payments |
| Phase 3: Communication | SMS Notifications, Analytics & Reports | Automated alerts, dashboard, export |
| Phase 4: Polish | UX refinement, Data Import, Performance | Data migration, optimization, translations |

---

## 8. Assumptions and Constraints

### 8.1 Assumptions

This document is based on several assumptions that should be validated before and during development. First, it is assumed that the shop has reliable internet access at the physical location, as the platform is cloud-based and requires an active internet connection to function. If internet connectivity is unreliable, an offline-first architecture with data synchronization may need to be considered, which would significantly increase the complexity of the system.

Second, it is assumed that the shop owner (who is also the developer) has access to the development tools and skills needed to build and maintain the platform, or has the budget to hire a developer if needed. Third, it is assumed that the existing client and stock data can be structured to fit the database schema designed for this platform. If the existing data is in a highly unstructured format (handwritten notes, for example), the data migration process may take longer than anticipated and should be planned accordingly.

### 8.2 Constraints

The platform is constrained to a single-user model, meaning it cannot be extended to support multiple shops, multiple users per shop, or role-based access control without significant architectural changes. This is an intentional design decision to keep the system simple and focused. The cash-only payment constraint means the billing module does not need to handle electronic payments, but it also means the platform cannot automatically reconcile payments with bank statements or digital payment records.

The bilingual requirement (English and French) adds a layer of complexity to the frontend development, as every user-facing string must be maintained in two languages. The SMS notification feature depends on the availability and reliability of a third-party SMS API provider, which introduces an external dependency that the platform cannot fully control. Finally, the QR code scanning feature depends on the quality of the device camera and the physical condition of the printed QR code labels, which may degrade over time in a retail environment.

---

## 9. Glossary

The following table defines the key terms used throughout this document to ensure consistent understanding of the domain-specific vocabulary. These terms reflect the optical retail industry and the specific business context of the Sofien Optic platform.

*Table 3: Glossary of Terms*

| Term | Definition |
|------|-----------|
| Eyewear | A complete frame (with or without demo lenses) sold as a product in the shop. |
| Lenses | Prescription or non-prescription lenses sold individually or fitted into frames. |
| Montage | The process of fitting new lenses into an eyewear frame. |
| Remounting | A service where a client brings their own frame for new lenses. |
| Prescription | Optical parameters (SPH, CYL, Axis, ADD, PD) issued by a doctor, including the doctor's name. |
| QR Code | A scannable code auto-generated for each stock item for quick identification. |
| Turnaround | The expected time to complete an order or repair service. |
| TND | Tunisian Dinar, the official currency used for all transactions. |
| SPH | Sphere, the main lens power correction in a prescription. |
| CYL | Cylinder, the astigmatism correction value in a prescription. |
| ADD | Addition, the reading power added to the distance prescription. |
| PD | Pupillary Distance, the distance between the centers of the pupils. |