# AGENTS.md — Single Source of Truth AI Agent Guidelines

## 📌 Project Overview
- **Repository:** `ibnuqoyim/store-dashboard`
- **Description:** Store & Bakery Management Dashboard (Orders, Invoices, Products, Customers, Inventory, Expenses, Deliveries, Batch PO, Bakery Dough Calculations).
- **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL + RLS), Tailwind CSS v4, Cloudinary.

## 🛠️ Verification & Quality Gate Commands
Always run local checks before opening a PR:
- `make verify` — Runs linting, TypeScript typecheck, and build check.
- `npm run lint` — Runs ESLint.
- `npm run build` — Validates Next.js production build.

## ⛔ Absolute Rules for AI Agents
1. **No Breaking RLS / Database Changes:** Never drop core tables or weaken Row Level Security policies.
2. **Double-Entry Financial Accuracy:** Money calculations must use presisi decimal & formatted currency utils (`formatCurrency`).
3. **Modular Architecture Integrity:** Keep module toggles intact in `lib/modules.ts` and respect store-specific configs.
4. **Clean Code & Small PRs:** Keep PRs atomic, focused, and under 250 lines of code change where possible.
