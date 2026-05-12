#!/bin/bash
# setup-invitia.sh
# Jalankan sekali di folder project Anda
# Usage: bash setup-invitia.sh

set -e

echo "🚀 Setting up Invitia..."

# ── 1. Create Next.js project ─────────────────────────────────
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

echo "✅ Next.js project created"

# ── 2. Install dependencies ───────────────────────────────────
npm install prisma @prisma/client
npm install next-auth
npm install @dnd-kit/core @dnd-kit/sortable   # drag-drop section reorder nanti
npm install -D @types/node

echo "✅ Dependencies installed"

# ── 3. Prisma init ────────────────────────────────────────────
npx prisma init --datasource-provider postgresql

echo "✅ Prisma initialized"

# ── 4. Folder structure ───────────────────────────────────────
mkdir -p src/templates
mkdir -p src/app/i/\[slug\]
mkdir -p src/components
mkdir -p src/lib
mkdir -p public/og

echo "✅ Folder structure created"

# ── 5. .env.local ─────────────────────────────────────────────
cat > .env.local << 'EOF'
# Database (ganti dengan URL PostgreSQL Anda)
DATABASE_URL="postgresql://user:password@localhost:5432/invitia"

# Auth
NEXTAUTH_SECRET="ganti-dengan-random-string-panjang"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Invitia"
EOF

echo "✅ .env.local created"

# ── 6. .gitignore tambahan ────────────────────────────────────
cat >> .gitignore << 'EOF'

# Invitia specific
.env.local
.env.production
/prisma/migrations/
EOF

echo "✅ .gitignore updated"

# ── 7. Git init & push ────────────────────────────────────────
git init
git add .
git commit -m "feat: initial Invitia setup

- Next.js 14 + TypeScript + Tailwind
- Prisma + PostgreSQL
- NextAuth
- Folder structure: templates, app/i/[slug], components, lib"

git branch -M main
git remote add origin https://github.com/yasanegara/invsaas.git
git push -u origin main

echo ""
echo "✅ Done! Repo pushed to GitHub."
echo ""
echo "Next steps:"
echo "  1. Copy files dari Claude ke folder yang sesuai (lihat COPY_FILES.md)"
echo "  2. Edit .env.local dengan database URL Anda"
echo "  3. npx prisma migrate dev"
echo "  4. npm run dev"
