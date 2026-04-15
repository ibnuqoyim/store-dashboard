# Store Dashboard

Dashboard manajemen toko berbasis web — orders, invoices, products, customers, inventory, financial reports, dan lainnya. Dirancang sebagai template multi-bisnis yang bisa di-deploy ulang untuk klien berbeda.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** — Auth + PostgreSQL + RLS
- **Tailwind CSS 4**
- **Cloudinary** — image uploads (products, logo)
- **jsPDF / html2pdf.js** — invoice PDF generation

## Quick Start (dev)

```bash
cp .env.example .env.local   # fill in your Supabase + Cloudinary credentials
npm install
npm run dev                   # http://localhost:3000
```

Buka `/setup` untuk konfigurasi awal bisnis (nama, modul, warna, bank info).

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # ESLint
```

## Deployment baru (klien baru)

Lihat **[SETUP.md](./SETUP.md)** untuk panduan lengkap:
1. Fork repo → isi `.env.local` (Supabase + Cloudinary credentials)
2. Apply `schema/core.sql` di Supabase SQL Editor
3. Apply `schema/modules/*.sql` sesuai modul yang dibutuhkan
4. `npm run dev` → buka `/setup` → isi wizard

## Struktur Utama

```
app/
  (auth)/login/         — halaman login
  (setup)/setup/        — wizard setup awal (muncul jika store_info kosong)
  (dashboard)/          — semua halaman dashboard (sidebar)
    page.tsx            — dashboard utama
    orders/             — manajemen order & invoice
    products/           — produk
    customers/          — pelanggan
    adonan/             — manajemen adonan (bakery)
    batch-po/           — pre-order batch (bakery)
    inventory/          — stok bahan baku
    deliveries/         — pengiriman
    shipping/           — tarif ongkir
    financial/          — laporan keuangan
    expenses/           — pengeluaran operasional
    testimonials/       — testimoni pelanggan
    store-info/         — pengaturan toko

components/             — semua UI components (flat)
lib/
  config.ts             — BusinessConfig type, DEFAULT_CONFIG, formatCurrency, getEnvDefaults
  modules.ts            — MODULE_REGISTRY, MODULE_PRESETS, getEnabledModules
  business-config-context.tsx — React Context untuk config toko
  widgetRegistry.ts     — registry widget dashboard
utils/supabase/         — Supabase SSR client (server.ts + client.ts)
schema/
  core.sql              — schema lengkap untuk semua jenis bisnis
  modules/              — schema tambahan per modul (adonan, inventory, dll)
migrations/             — history perubahan schema (referensi)
scripts/
  setup-tenant.sh       — setup .env.local untuk deployment baru
  seed.ts               — seed data untuk development
```

## Modul yang Tersedia

| Modul | Deskripsi | Preset |
|---|---|---|
| orders | Order & invoice management | Semua |
| products | Katalog produk | Semua |
| customers | Data pelanggan | Semua kecuali service |
| inventory | Stok bahan baku | Bakery, Retail |
| deliveries | Pengiriman order | Bakery, Retail |
| shipping | Tarif ongkir | Bakery, Retail |
| financial | Laporan keuangan | Semua |
| expenses | Pengeluaran operasional | Semua |
| adonan | Manajemen adonan | Bakery |
| batch-po | Pre-order batch | Bakery |
| testimonials | Testimoni pelanggan | Bakery, Cafe |

Modul aktif dikonfigurasi per toko di **Settings → Store Info → Modul Aktif**.

## Environment Variables

Lihat `.env.example` untuk daftar lengkap. Yang wajib:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```
