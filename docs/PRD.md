# PRD – AI Interview SaaS

## 1. Contexte et Objectif
- Nom du projet: à déterminer (ex. SkillParse, InterviewFlow)
- Objectif: permettre à l’utilisateur de téléverser un CV (PDF), d’en extraire le texte (OCR), de le structurer via IA en JSON fiable, puis d’utiliser ces données pour des simulations d’entretiens.
- Principes "Lovable":
  - Clarté & Lisibilité: TypeScript strict, conventions sémantiques, fonctions pures quand possible
  - Modulaire & Testable: séparation UI / logique métier / accès données
  - Performant: faible latence sur OCR et classification IA
  - Bien documenté: READMEs, docs API, JSDoc sur fonctions critiques

## 2. Personas & Cas d’usage
- Candidat junior: veut identifier compétences manquantes et s’entraîner
- Professionnel confirmé: veut générer des questions ciblées et se préparer
- Recruteur/coach: veut auditer et conseiller

Cas d’usage clés:
- Téléverser un PDF et visualiser l’état du traitement (upload → OCR → classification → structuration JSON)
- Consulter la fiche CV structurée (données personnelles, skills, éducation, expériences, langues)
- Lancer une simulation d’entretien basée sur les données structurées

## 3. Plans & Limitations
- Free: 1 CV, 20 questions per month, one roadmap for one skill
- Starter: Free plan + 50 questions per month by voice, 50 analyse response by voice, a roadmap for 3 skills, 
- Pro:  120 questions per month by voice or virtual assistant, 120 analyse response by voice  export JSON/CSV
- Enterprise: illimité, priorités, SSO, support, show best condidats based on skills.

## 4. Fonctionnalités prioritaires
- Auth via Supabase Auth
- Stockage via Supabase Storage
- OU Supabase Storage côté serveur, URLs signées

Tech stack updates:
- supabase (client Python pour Storage)

Risques:
- Mauvaise configuration Supabase Storage: buckets privés, tests `/storage/supabase/health`
- Sécurité: RLS, gestion des clés côté serveur
- Observabilité: logs pipeline, traces erreurs
- Scalabilité: ISR/SSR pour pages, queues si besoin

## 7. Dépendances critiques
- Next.js (App Router), TypeScript strict
- Supabase (Auth, Storage, DB)
- OpenAI SDK (classification)
- Service OCR (Mistral OCR / API externe)
- boto3 (client S3 pour Backblaze B2)

## 8. Risques & Mitigations
- OCR imprécis: fallback, messages clairs, ré-essai
- JSON non strict: prompts avec schéma, validation Zod
- Confidentialité: chiffrage côté stockage si requis
- Mauvaise configuration buckets B2: politique privée, tests `/storage/b2/health`

## 9. Roadmap initiale
- Semaine 1: Setup Next.js + Supabase, table `cvs`, Auth, upload
- Semaine 2: Intégration OCR + classification JSON
- Semaine 3: UI fiche CV, simulation d’entretien v1
- Semaine 4: Plans & billing, tests E2E pipeline