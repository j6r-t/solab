# Project Context

**Project:** Sofien Optic — POS/ERP for an optical shop (Tunisia)  
**Stack:** Next.js 16, Tailwind v4, shadcn/ui (Radix), Prisma + SQLite, Zustand, jose (JWT), bcryptjs  
**Language:** TypeScript (strict)  
**i18n:** French (primary) + English — custom `useTranslation` hook with JSON files  

---

## Session Log

### 2026-07-07 — Session 1: Full Codebase Analysis

**Objective:** Rebuild project context from the codebase after losing previous conversation history.

- Analyzed entire codebase (50+ source files, ~15K lines of TypeScript/CSS/JSON)
- Created `context.md` as the project's permanent technical knowledge base
- Key findings documented:
  - 22 Prisma models, 13+ enums, 35 API routes, 21 feature modules
  - SPA architecture via Zustand view-store (no URL routing)
  - Three-tier layered architecture: Controller → Service → Repository
  - Security gaps: most API routes unprotected, hardcoded JWT secret fallback
  - Thin repositories add indirection without query encapsulation
  - No data caching, no pagination, no form library
  - SMS integration is a no-op stub

---
