# Architecture Technique – AI Interview SaaS

## Stack recommandé
- Frontend/Backend: Next.js (App Router) en TypeScript strict
- Auth & Storage: Supabase
- Base de données: Postgres (via Supabase)
- Accès aux données: supabase-js (et tRPC optionnel pour DX typesafe)
- Styling: Tailwind CSS (ou CSS Modules selon préférence)
- Tests: Vitest/Jest (unit), Playwright (E2E)

## Schéma haut niveau
- UI Next.js → API Routes / Actions Server → Services externes (OCR, OpenAI) → Supabase (Storage + DB)
- Flux pipeline: Upload PDF → Stockage → OCR → Classification JSON → Persist JSONB → Simulation d’entretien

## Modules clés
- Auth: pages/protecteurs, hooks utilisateur
- Upload: composant dropzone + appel route `/api/cv/upload`
- Pipeline: orchestrateur `/api/cv/process` (queue/état)
- Classification: service OpenAI avec validation Zod
- Fiche CV: page détaillée basée sur JSONB
- Billing: intégration Stripe (webhooks)

## Routes/API proposées
- `POST /api/cv/upload`
  - Body: multipart (`file: PDF`)
  - Résultat: `original_pdf_url`, `cvId`
- `POST /api/cv/process`
  - Body: `{ cvId }`
  - Étapes: OCR (Mistral OCR) → classification (OpenAI) → upsert `cvs`
- `GET /api/cv/:id`
  - Résultat: objet JSON structuré (personnel, skills, education, expériences, langues)

## Prompt classification (exigence JSON strict)
- Le prompt doit exiger:
```
Vous êtes un système d'extraction de CV. Répondez STRICTEMENT en JSON valide correspondant au schéma.
{ "personal_data": { "name": "...", "email": "...", "phone": "..." },
  "skills": [ { "name": "...", "level": "..." } ],
  "education": [ { "institution": "...", "degree": "...", "years": "..." } ],
  "experiences": [ { "title": "...", "company": "...", "duration": "...", "description_summary": "..." } ],
  "languages": [ { "language": "...", "proficiency": "..." } ] }
```
- Validation côté serveur avec Zod pour garantir la conformité.

## Sécurité & clés
- Clés IA (OpenAI, OCR) uniquement côté serveur (API Routes / Edge Functions)
- RLS activé sur `cvs` avec `user_id = auth.uid()`
- Politique d’upload: bucket privé (signed URLs)

## Observabilité & erreurs
- Logs par étape: upload, OCR, classification, upsert
- Messages utilisateur clairs: corruption, OCR invalide, JSON non strict

## Performance
- ISR/SSR pour pages critiques
- Batch/queues si volumes élevés d’OCR
- Index JSONB sélectifs si nécessaire

## Structure Next.js suggérée
- `app/` (App Router)
- `app/(protected)/cvs/[id]/page.tsx` – fiche CV
- `app/upload/page.tsx` – upload
- `app/api/cv/upload/route.ts` – upload API
- `app/api/cv/process/route.ts` – pipeline API
- `lib/supabase/server.ts` – client serveur
- `lib/services/ocr.ts` – OCR
- `lib/services/classify.ts` – OpenAI + Zod
- `lib/db/cvs.ts` – accès table
- `components/ui/*` – composants réutilisables


## Stockage Supabase Storage
- Variables d’environnement backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_CVS`, `SUPABASE_BUCKET_DOCS`, `SUPABASE_BUCKET_PROFILE_PHOTOS`, `MAX_UPLOAD_MB`.
- `GET /storage/supabase/health` — vérifie la connectivité et liste des buckets (si autorisé).
- `POST /storage/supabase/upload` — upload générique (PDF/Word/images), bucket selon MIME ou paramètre `kind`.
- `POST /cv/upload_supabase` — upload CV (PDF/Word); PDF aussi sauvegardé localement + extraction Mistral; retourne URL signée.
- `POST /profile/photo/upload_supabase` — upload photo profil (JPEG/PNG); retourne URL signée.
- Remplacement de Google Drive: possible si l’on choisit de stocker uniquement dans Supabase.