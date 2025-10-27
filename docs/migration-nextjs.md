# Plan de migration – Vite React → Next.js (App Router)

## Objectif
Passer de la landing Vite actuelle à une base Next.js prête pour Auth, Storage, API routes et pipeline IA.

## Étapes
1. Créer un nouveau dossier `app/` Next.js dans un repo dédié (ou monorepo):
   - `npx create-next-app@latest` avec TypeScript, App Router, Tailwind
2. Installer et configurer Supabase:
   - `npm install @supabase/supabase-js`
   - Créer `lib/supabase/server.ts` et `lib/supabase/client.ts`
3. Auth & RLS:
   - Activer RLS et appliquer le script `supabase/schema.sql`
   - Créer pages de login/signup et guards
4. Upload & Storage:
   - Créer bucket privé `cvs`
   - API `POST /api/cv/upload` (multipart), stockage et retour `cvId`
5. Pipeline:
   - API `POST /api/cv/process` orchestrant OCR (service Mistral OCR) puis classification (OpenAI) et upsert JSONB
   - Zod pour valider le JSON strict
6. UI Fiche CV:
   - Page `app/(protected)/cvs/[id]/page.tsx` lisant la table `cvs`
7. Billing (phase 2):
   - Intégration Stripe (portail, webhooks, limitations par plan)

## Migration des assets et composants
- Reprendre le style et les composants de la landing Vite (`src/components/*`) et les adapter à Next (`components/*`)
- Garder Tailwind et les variables CSS existantes

## Tests
- Vitest/Jest pour services (OCR, classification)
- Playwright pour upload → process → fiche CV

## Déploiement
- Vercel (idéal pour Next.js)
- Variables d’environnement sécurisées: `OPENAI_API_KEY`, `OCR_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (service côté serveur uniquement)

## Remarques
- On ne migre pas les packages vers React 19/Tailwind 4 tant que la base n’est pas stable
- Les clés IA ne doivent jamais être visibles côté client


## Option: Stockage Supabase Storage
- Variables d’environnement: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_CVS`, `SUPABASE_BUCKET_DOCS`, `SUPABASE_BUCKET_PROFILE_PHOTOS`, `MAX_UPLOAD_MB`.
- Routes analogues: `GET /api/storage/supabase/health`, `POST /api/storage/supabase/upload`, `POST /api/cv/upload_supabase`, `POST /api/profile/photo/upload_supabase`.