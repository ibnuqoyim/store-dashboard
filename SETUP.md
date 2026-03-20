# Store Dashboard — Deployment Guide

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Cloudinary](https://cloudinary.com) account (free tier works)

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

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once the project is ready, open **Project Settings → API**.
3. Copy the **Project URL** and the **anon / public** key — you will need them in step 4.

---

## 3. Apply Database Schema

Open the **SQL Editor** inside your Supabase project and run the files below in order.

### Step 3a — Core schema (required for every business type)

Paste and run the contents of `schema/core.sql`.

This creates: `store_info`, `products`, `customers`, `orders`, `order_items`, `deliveries`, `shipping_rates`, `financial_transactions`, `operational_expenses`, and all associated triggers and RLS policies.

### Step 3b — Module schema (run only what your business needs)

| Module | Schema file | When to use |
|---|---|---|
| Dough / Adonan | `schema/modules/adonan.sql` | Bakeries that track dough batches |
| Batch Pre-orders | `schema/modules/batch-po.sql` | Businesses that run pre-order campaigns |
| Inventory | `schema/modules/inventory.sql` | Businesses that track raw materials or packaging stock |
| Testimonials | `schema/modules/testimonials.sql` | Any store that displays customer reviews |

Paste and run each relevant file in the SQL Editor after `core.sql`.

> **Note:** `schema/modules/inventory.sql` depends on `financial_transactions` (created by `core.sql`) to auto-record purchase expenses. Always apply `core.sql` first.

---

## 4. Configure Environment

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/public key |
| `CLOUDINARY_URL` | Cloudinary → Dashboard → API Keys |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary → Dashboard → Cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | See step 5 (default: `products`) |
| `NEXT_PUBLIC_STORE_NAME` | Your store's display name |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Brand color hex (default: `#6366f1`) |
| `NEXT_PUBLIC_STORE_MODULES` | Comma-separated module IDs (see `.env.example` for valid values) |

---

## 5. Configure Cloudinary

1. Log in to [cloudinary.com](https://cloudinary.com).
2. Go to **Settings → Upload → Upload presets**.
3. Click **Add upload preset**.
4. Set the preset name to `products` and the **Signing Mode** to **Unsigned**.
5. Save the preset.

This allows the dashboard to upload product images directly from the browser.

---

## 6. Run Setup Wizard

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000/setup](http://localhost:3000/setup) and follow the wizard to fill in your store's name, address, contact details, and branding.

The setup wizard saves everything to the `store_info` table in Supabase. Once saved, the database values take priority over the environment variable fallbacks.

---

## 7. Deploy

The recommended platform is [Vercel](https://vercel.com):

1. Import your GitHub repository into Vercel.
2. In **Project Settings → Environment Variables**, add every variable from your `.env.local` file.
3. Deploy. Vercel will detect Next.js automatically.

For other platforms (Railway, Render, Fly.io, etc.) the process is the same: set the environment variables and run `npm run build && npm start`.
