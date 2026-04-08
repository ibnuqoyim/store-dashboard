# Store Dashboard — Deployment Guide

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Cloudinary](https://cloudinary.com) account (free tier works)

---

## New Client Setup Checklist

> Use this checklist every time you onboard a new business onto this dashboard.

- [ ] 1. Fork & clone the repository
- [ ] 2. Create a **new** Supabase project (one project per business)
- [ ] 3. Apply the database schema (core + selected modules)
- [ ] 4. Create a **new** Cloudinary account or sub-account (one per business)
- [ ] 5. Configure environment variables (`.env.local`)
- [ ] 6. Configure Cloudinary upload preset
- [ ] 7. Run the setup wizard (`/setup`)
- [ ] 8. Deploy to Vercel (or other platform)

---

## 1. Fork & Clone

1. Fork this repository on GitHub.
2. Clone your fork locally:

```bash
git clone https://github.com/<your-username>/store-dashboard.git
cd store-dashboard
npm install
```

---

## 2. Create Supabase Project

> **Important:** Each business must have its own Supabase project. Never share a project between clients — data is not isolated between businesses in the same project.

1. Go to [supabase.com](https://supabase.com) and create a **new project**.
2. Once the project is ready, open **Project Settings → API**.
3. Copy the **Project URL** and the **anon / public** key — you will need them in step 5.

---

## 3. Apply Database Schema

Open the **SQL Editor** inside your Supabase project and run the files below **in order**.

### Step 3a — Core schema (required for every business)

Paste and run the contents of **`schema/core.sql`**.

This creates: `store_info`, `products`, `customers`, `orders`, `order_items`, `deliveries`, `shipping_rates`, `financial_transactions`, `operational_expenses`, and all associated triggers and RLS policies.

### Step 3b — Module schema (run only what the business needs)

| Module | Schema file | When to use |
|---|---|---|
| Dough / Adonan | `schema/modules/adonan.sql` | Bakeries that track dough batches |
| Batch Pre-orders | `schema/modules/batch-po.sql` | Businesses that run pre-order campaigns |
| Inventory | `schema/modules/inventory.sql` | Businesses that track raw materials or packaging stock |
| Testimonials | `schema/modules/testimonials.sql` | Any store that wants to display customer reviews |

Paste and run each relevant file in the SQL Editor **after** `core.sql`.

> **Note:** `schema/modules/inventory.sql` depends on `financial_transactions` (created by `core.sql`). Always apply `core.sql` first.

### Preset reference

| Business type | Recommended modules |
|---|---|
| Sourdough bakery | adonan, batch-po, inventory, testimonials |
| General retail | inventory, testimonials |
| Café / food service | inventory, testimonials |
| Service business | *(none — core is sufficient)* |

---

## 4. Create Cloudinary Account

> **Important:** Each business should have its own Cloudinary account (or a separate sub-account). Do not share credentials between clients.

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier is sufficient).
2. Note your **Cloud name** from the dashboard top-left.
3. Go to **Settings → API Keys** and copy the **API Key** and **API Secret**.

---

## 5. Configure Environment

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

| Variable | Where to find it | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | **Yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/public key | **Yes** |
| `CLOUDINARY_URL` | Cloudinary → Settings → API Keys (format: `cloudinary://key:secret@cloudname`) | **Yes** |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary → Dashboard → Cloud name | **Yes** |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Name of the upload preset you create in step 6 (default: `products`) | **Yes** |
| `NEXT_PUBLIC_STORE_NAME` | Fallback store name shown before setup wizard runs | Optional |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Fallback brand color hex (default: `#6366f1`) | Optional |
| `NEXT_PUBLIC_STORE_MODULES` | Comma-separated fallback module IDs (see `.env.example` for valid values) | Optional |

> The optional variables are **fallbacks** used before the store owner runs the setup wizard. Once the wizard is complete, the database values take priority.

---

## 6. Configure Cloudinary Upload Preset

1. Log in to [cloudinary.com](https://cloudinary.com).
2. Go to **Settings → Upload → Upload presets**.
3. Click **Add upload preset**.
4. Set the preset name to `products` and the **Signing Mode** to **Unsigned**.
5. Save the preset.

This allows the dashboard to upload product images and store logos directly from the browser without a backend signature step.

---

## 7. Run Setup Wizard

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Since `store_info` is empty, the dashboard will redirect to the setup wizard automatically.

The wizard walks through:
1. **Business identity** — store name, logo upload, brand color
2. **Modules** — select a preset or pick modules individually
3. **Contact & payment** — WhatsApp number, bank account for invoices
4. **Confirmation** — review and save to database

Once saved, the dashboard is ready to use.

---

## 8. Deploy

### Vercel (recommended)

1. Push your fork to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. In **Project Settings → Environment Variables**, add every variable from your `.env.local` file.
4. Deploy. Vercel detects Next.js automatically.

### Other platforms (Railway, Render, Fly.io, etc.)

Set the same environment variables in the platform's settings, then run:

```bash
npm run build && npm start
```

---

## Updating an Existing Deployment

### Applying a new schema migration

When a new migration is released in `schema/migrations/`, run it in the Supabase SQL Editor for each affected deployment.

Migration files are **safe to run multiple times** (they use `IF EXISTS` / `IF NOT EXISTS` guards).

| Migration file | What it does | When to run |
|---|---|---|
| `schema/migrations/001_strengthen_rls.sql` | Locks down all tables to authenticated users only (was `FOR ALL USING (true)`) | All existing deployments |
| `schema/migrations/002_widget_config.sql` | Adds `widget_config` column to `store_info` for per-store dashboard layout | All existing deployments |
| `schema/migrations/003_product_cost_price.sql` | Adds `cost_price` (HPP) column to `products` for profit/loss reporting | All existing deployments |

### Re-running the setup wizard

If the store owner needs to change the business name, modules, or branding after initial setup, they can do so via **Store Info** (in the sidebar). To reset completely and re-run the wizard, delete the row from `store_info` in Supabase → the next page load will redirect to `/setup` automatically.

---

## Architecture Notes

- **One Supabase project per business** — RLS is enforced at the authenticated-user level, not at the row level across tenants. Each business gets its own isolated database.
- **One Cloudinary account per business** — keeps image storage and billing separate.
- **Modules are opt-in** — only install the schema files and enable the modules that the business actually needs. Unused tables are never created.
- **All RLS policies require `auth.role() = 'authenticated'`** — unauthenticated requests are rejected at the database level, not just the application level. The only exception is `testimonials` (SELECT is public so reviews can be embedded on a public website).
