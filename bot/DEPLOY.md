# Bot Deployment Guide

## Opsi A: Fly.io ✅ (Tested & Working)

### Install Fly CLI
```bash
# macOS
brew install flyctl
```

### Setup pertama kali
```bash
# Login
fly auth login

# Dari dalam folder bot/
cd bot

# Buat app (nama harus unik di Fly.io)
fly apps create store-dashboard-bot

# Buat volume untuk persist session WhatsApp — WAJIB sebelum deploy pertama
fly volumes create wa_session --region sin --size 1

# Set semua env vars sebagai secrets
fly secrets set \
  ALLOWED_WA_NUMBERS="628xxx,248xxxxxx" \
  AI_PROVIDER="openrouter" \
  OPENROUTER_API_KEY="sk-or-xxxx" \
  OPENROUTER_MODEL="openai/gpt-4o-mini" \
  NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Deploy pertama
fly deploy

# Lihat log + scan QR WhatsApp
fly logs
```

> Setelah QR terscan dan bot terhubung, session tersimpan di volume `/data/session` dan
> tidak perlu scan ulang meskipun bot di-restart atau redeploy.

### Update kode (rutin)
```bash
cd bot
fly deploy          # update machine yang sudah ada, volume tetap aman
```

### Update dependencies (tambah package baru)
```bash
cd bot
# Hapus machine lama yang stopped dulu agar volume bisa di-attach ke machine baru
fly machine list    # catat ID machine yang stopped
fly machine destroy <machine-id>
fly deploy --no-cache
```

> Gunakan `--no-cache` hanya saat ada perubahan `package.json`.
> Tanpa `--no-cache`, Fly.io pakai cache Docker layer sehingga lebih cepat.

### Reset session WhatsApp (scan QR ulang)
```bash
fly ssh console
rm -rf /data/session/*
exit
fly machine restart
fly logs            # QR muncul di sini
```

### Perintah Fly.io berguna
```bash
fly status                      # status machine
fly logs                        # log realtime
fly logs --tail                 # follow log
fly machine list                # lihat semua machine + ID
fly machine restart             # restart bot
fly machine destroy <id>        # hapus machine
fly secrets list                # lihat nama env vars (tanpa nilai)
fly ssh console                 # masuk ke container via SSH
fly volumes list                # cek volume session
```

### AI Provider
Ollama hanya bisa dipakai saat development lokal — tidak bisa dari Fly.io.
Untuk production gunakan cloud provider:

| Provider | Model | Biaya |
|----------|-------|-------|
| OpenRouter | `openai/gpt-4o-mini` | ~$0.0001/pesan |
| OpenRouter | `google/gemma-3-4b-it:free` | Gratis |
| Anthropic | `claude-haiku-4-5-20251001` | ~$0.0002/pesan |

Ganti model tanpa redeploy:
```bash
fly secrets set OPENROUTER_MODEL="google/gemma-3-4b-it:free"
```

---

## Opsi B: VPS + PM2

### Requirement
- Ubuntu 22.04+
- Node.js 20+ (`nvm install 20`)
- PM2 (`npm install -g pm2`)

### Setup pertama kali
```bash
# Clone repo ke VPS
git clone <repo-url> /opt/store-bot
cd /opt/store-bot/bot

# Install dependencies
npm install

# Copy dan isi env
cp ../bot.env.example .env
nano .env   # isi semua nilai

# Buat folder logs
mkdir -p logs

# Jalankan bot
pm2 start ecosystem.config.cjs

# Lihat QR code untuk scan
pm2 logs wa-bot --lines 50

# Simpan agar auto-start saat VPS reboot
pm2 save
pm2 startup   # ikuti instruksi yang muncul
```

### Perintah PM2 berguna
```bash
pm2 status              # status semua process
pm2 logs wa-bot         # lihat log realtime
pm2 restart wa-bot      # restart bot
pm2 stop wa-bot         # stop bot
```

### Update bot
```bash
cd /opt/store-bot
git pull origin main
cd bot && npm install   # kalau ada dependency baru
pm2 restart wa-bot
```

### Reset session WhatsApp (scan QR ulang)
```bash
rm -rf /opt/store-bot/bot/session
pm2 restart wa-bot
pm2 logs wa-bot --lines 30   # QR muncul di sini
```

---

## Tips

- **Session backup** — backup folder session (`/data/session` di Fly.io, `./session` di VPS) agar tidak perlu scan QR ulang
- **Jangan expose port publik** — bot hanya butuh koneksi keluar ke WhatsApp + Supabase + AI provider
- **Ganti secrets tanpa redeploy** — `fly secrets set KEY=value` otomatis restart machine
