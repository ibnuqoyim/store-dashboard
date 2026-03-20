#!/bin/bash
# =============================================================================
# setup-tenant.sh — Provision a new Store Dashboard tenant
# Usage: bash scripts/setup-tenant.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  Store Dashboard - New Tenant Setup"
echo "=============================================="
echo ""

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
read -rp "Project name (e.g. my-bakery): " PROJECT_NAME

read -rp "Supabase Project URL (https://<ref>.supabase.co): " SUPABASE_URL

read -rp "Supabase Anon Key: " SUPABASE_ANON_KEY

read -rp "Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME

read -rp "Cloudinary Upload Preset [products]: " CLOUDINARY_UPLOAD_PRESET
CLOUDINARY_UPLOAD_PRESET="${CLOUDINARY_UPLOAD_PRESET:-products}"

read -rp "Cloudinary API Key: " CLOUDINARY_API_KEY

read -rp "Cloudinary API Secret: " CLOUDINARY_API_SECRET

read -rp "Store display name (NEXT_PUBLIC_STORE_NAME) [My Store]: " STORE_NAME
STORE_NAME="${STORE_NAME:-My Store}"

read -rp "Primary brand color hex [#6366f1]: " PRIMARY_COLOR
PRIMARY_COLOR="${PRIMARY_COLOR:-#6366f1}"

# ---------------------------------------------------------------------------
# Create .env.local
# ---------------------------------------------------------------------------
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"
ENV_LOCAL="$PROJECT_ROOT/.env.local"

if [ ! -f "$ENV_EXAMPLE" ]; then
  echo ""
  echo "ERROR: .env.example not found at $ENV_EXAMPLE"
  exit 1
fi

echo ""
echo "Writing $ENV_LOCAL ..."

cp "$ENV_EXAMPLE" "$ENV_LOCAL"

# Substitute placeholders using sed
sed -i.bak \
  -e "s|https://<project-ref>.supabase.co|${SUPABASE_URL}|g" \
  -e "s|<anon-key>|${SUPABASE_ANON_KEY}|g" \
  -e "s|cloudinary://<api-key>:<api-secret>@<cloud-name>|cloudinary://${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}@${CLOUDINARY_CLOUD_NAME}|g" \
  -e "s|NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud-name>|NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}|g" \
  -e "s|NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=products|NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=${CLOUDINARY_UPLOAD_PRESET}|g" \
  -e "s|NEXT_PUBLIC_STORE_NAME=My Store|NEXT_PUBLIC_STORE_NAME=${STORE_NAME}|g" \
  -e "s|NEXT_PUBLIC_PRIMARY_COLOR=#6366f1|NEXT_PUBLIC_PRIMARY_COLOR=${PRIMARY_COLOR}|g" \
  "$ENV_LOCAL"

# Remove the backup file created by sed -i on macOS
rm -f "$ENV_LOCAL.bak"

echo ".env.local created successfully."

# ---------------------------------------------------------------------------
# Apply schema instructions
# ---------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  Next Step: Apply Database Schema"
echo "=============================================="
echo ""
echo "1. Open your Supabase project dashboard:"
echo "   ${SUPABASE_URL/supabase.co/supabase.com/project}"
echo ""
echo "2. Navigate to: SQL Editor"
echo ""
echo "3. Paste and run the contents of:"
echo "   schema/core.sql"
echo ""
echo "4. Then run any module files your business needs:"
echo "   schema/modules/adonan.sql      (dough/adonan tracking)"
echo "   schema/modules/batch-po.sql    (pre-order batches)"
echo "   schema/modules/inventory.sql   (raw material inventory)"
echo "   schema/modules/testimonials.sql (customer reviews)"
echo ""
echo "   See SETUP.md for the full module reference table."

# ---------------------------------------------------------------------------
# Install & run
# ---------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  Install Dependencies & Start Dev Server"
echo "=============================================="
echo ""
echo "Run the following commands in your project directory:"
echo ""
echo "  npm install"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000/setup"
echo "to complete your store configuration."

# ---------------------------------------------------------------------------
# Success
# ---------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  Setup Complete — Next Steps"
echo "=============================================="
echo ""
echo "  1. Apply schema/core.sql in the Supabase SQL Editor."
echo "  2. Apply any module SQL files you need."
echo "  3. Run: npm install && npm run dev"
echo "  4. Visit http://localhost:3000/setup to configure your store."
echo "  5. When ready to deploy, add all .env.local variables"
echo "     to your Vercel (or other platform) environment settings."
echo ""
echo "Project: ${PROJECT_NAME}"
echo "Store:   ${STORE_NAME}"
echo "Color:   ${PRIMARY_COLOR}"
echo ""
