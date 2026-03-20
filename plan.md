# Plan: Reusable Dashboard System

## Masalah saat ini

| Issue | Detail |
|---|---|
| Hardcoded business data | Nama "Sourdoughmu_ya", telp `087722...`, bank BRI, nama pemilik di invoice PDF |
| Modul spesifik bakery | `adonan/`, `batch-po/` — tidak relevan untuk bisnis lain |
| Currency hardcoded | Format Rupiah di `DashboardClient.tsx` |
| Sidebar statis | Navigasi tidak menyesuaikan modul yang aktif |
| Tidak ada branding system | Logo, warna primer hardcoded Indigo |
| Single-tenant | Satu Supabase project = satu bisnis |

---

## Phase 1 — Business Config Layer ✅ TODO
*Prioritas tertinggi*

Centralize semua data bisnis ke satu tempat, baca dari `store_info` table (sudah ada) + env vars.

**File baru: `lib/config.ts`**
```
BusinessConfig {
  name, logo, phone, currency, locale,
  bank_name, bank_account, bank_holder,
  invoice_closing_message, whatsapp_greeting_template,
  primary_color, modules_enabled[]
}
```

- Server Component fetch sekali di layout, pass via React Context
- Invoice PDF & WhatsApp template baca dari config ini
- `store-info/` page jadi UI untuk edit config ini

**Effort:** ~2-3 hari

---

## Phase 2 — Module System ⬜ TODO

Buat setiap fitur opt-in. Bisnis non-bakery tidak perlu `adonan` dan `batch-po`.

**File baru: `lib/modules.ts`**
```ts
type ModuleId = 'orders' | 'products' | 'customers' | 'inventory' |
  'financial' | 'deliveries' | 'adonan' | 'batch-po' | 'testimonials'

// Enabled via store_info atau env var
const ENABLED_MODULES = process.env.NEXT_PUBLIC_MODULES?.split(',')
```

- **Sidebar** jadi dynamic — hanya tampilkan modul yang aktif
- **Dashboard widgets** sudah punya registry, tinggal hubungkan ke modules
- Preset per bisnis: `bakery`, `retail`, `cafe`, `service`

**Effort:** ~3-4 hari

---

## Phase 3 — Theme & Branding ⬜ TODO

CSS variables untuk warna, logo dari Cloudinary (sudah terpasang).

**Perubahan:**
- `globals.css` — tambah `--color-primary`, `--color-sidebar`
- `StoreInfoForm` — tambah color picker + logo upload
- Sidebar & stat cards baca dari CSS variables
- Hapus hardcoded `indigo-500/600`

**Effort:** ~1-2 hari

---

## Phase 4 — Multi-tenant Architecture ⬜ TODO

**Pilihan A — One codebase, multiple deployments** (Simpler, recommended untuk awal)
- Fork repo per klien, isi `.env` berbeda
- Supabase project berbeda per klien
- RLS sudah ada, cukup isolasi natural

**Pilihan B — True multi-tenancy** (Lebih kompleks)
- Tambah kolom `business_id` di semua tabel
- Extend RLS policy dengan `business_id`
- Satu Supabase project, banyak bisnis
- Cocok jika ingin jual sebagai SaaS

**Rekomendasi:** Mulai dengan Pilihan A dulu, migrasi ke B kalau sudah ada 5+ klien.

**Effort A:** ~1 hari | **Effort B:** ~1 minggu

---

## Phase 5 — Setup Wizard ⬜ TODO

Halaman `/setup` yang muncul saat `store_info` kosong:

1. Nama bisnis & logo
2. Pilih preset modul (Bakery / Retail / Cafe / Custom)
3. Info kontak & pembayaran
4. Pilih warna tema
5. Done → redirect ke dashboard

**Effort:** ~2-3 hari

---

## Phase 6 — Packaging sebagai Template ⬜ TODO

- Buat `SETUP.md` — panduan deployment untuk klien baru
- Script `scripts/setup-tenant.sh` — auto create Supabase project + apply schema
- Pisahkan `schema.sql` menjadi: `schema-core.sql` + `schema-adonan.sql` (module-specific)
- Rename repo jadi `store-dashboard-template`

---

## Urutan Eksekusi

```
Phase 1 (Config Layer)      ← SEDANG DIKERJAKAN
  → Phase 3 (Branding)      ← bisa paralel dengan Phase 2
  → Phase 2 (Modules)
  → Phase 5 (Setup Wizard)
  → Phase 4A (Multi-deploy) atau Phase 4B (SaaS)
  → Phase 6 (Packaging)
```

---

## Total Estimasi Effort

| Phase | Status | Effort | Nilai |
|---|---|---|---|
| 1 — Config Layer | 🔄 In Progress | 2-3 hari | Kritikal |
| 2 — Module System | ⬜ TODO | 3-4 hari | Tinggi |
| 3 — Branding | ⬜ TODO | 1-2 hari | Tinggi |
| 4A — Multi-deploy | ⬜ TODO | 1 hari | Medium |
| 5 — Setup Wizard | ⬜ TODO | 2-3 hari | Medium |
| 6 — Packaging | ⬜ TODO | 1 hari | Low |
