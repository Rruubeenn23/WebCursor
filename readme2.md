# Fitness & Nutrition Hub

Next.js 14 (App Router) + Supabase + Tailwind + Radix UI.

## Quickstart

```bash
pnpm i
cp .env.example .env.local
# Fill envs: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, APP_URL, etc.

# Database (Supabase or local Postgres)
psql "$DATABASE_URL" -f database/000_init.sql
psql "$DATABASE_URL" -f database/010_policies.sql
psql "$DATABASE_URL" -f database/020_seed.sql

pnpm dev
