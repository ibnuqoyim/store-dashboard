# Migrations

File-file di folder ini adalah **history perubahan schema** sejak awal proyek — berguna sebagai referensi dan audit trail.

> **Untuk deployment baru**, gunakan `schema/core.sql` + `schema/modules/*.sql` — bukan file-file di sini. File-file tersebut sudah menggabungkan semua migration menjadi satu schema yang bersih.

---

## Index

| File | Deskripsi |
|---|---|
| `20260207_add_batch_po.sql` | Tambah tabel `batch_po`, kolom `orders.po_id` |
| `20260207_force_open_rls.sql` | Buka RLS semua tabel ke public access |
| `20260207_shipping_and_rls_fix.sql` | Tambah tabel `shipping_rates`, fix RLS orders/products |
| `20260209_create_customers_table.sql` | Tambah tabel `customers` |
| `20260209_add_customer_id_to_orders.sql` | Tambah kolom `orders.customer_id` FK ke customers |
| `20260317_add_image_url_to_products.sql` | Tambah kolom `products.image_url` |
| `20260318_create_store_info.sql` | Buat tabel `store_info` (identity, maps, hero, tagline, contact) |
| `20260318_create_testimonials.sql` | Buat tabel `testimonials` |
| `20260320_extend_store_info.sql` | Tambah kolom bank, invoice, WhatsApp, currency, locale |
| `20260320_add_modules_enabled.sql` | Tambah kolom `store_info.modules_enabled` |
| `20260320_add_branding.sql` | Tambah kolom `store_info.primary_color`, `logo_url` |
| `2024_create_financial_transactions.sql` | Buat tabel `financial_transactions` |
| `2025_create_financial_trigger.sql` | Trigger: order paid → insert income transaction |
| `2026_create_inventory.sql` | Buat tabel `inventory`, `inventory_transactions`, `operational_expenses` |
| `2027_create_expense_trigger.sql` | Trigger: expense → insert financial transaction |
| `2028_create_inventory_expense_trigger.sql` | Trigger: inventory purchase → insert expense transaction |
