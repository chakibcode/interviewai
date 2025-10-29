# InterviewAI Backend

FastAPI backend for InterviewAI.

## Local development

- Start server: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Docs: `http://localhost:8000/docs`

## Supabase Storage

Configure environment variables:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (required for bucket operations and signed URLs)
- Buckets (create in Supabase Storage):
  - `SUPABASE_BUCKET_CVS` (default `cvs`)
  - `SUPABASE_BUCKET_DOCS` (default `documents`)
  - `SUPABASE_BUCKET_PROFILE_PHOTOS` (default `profile-photos`)

Endpoints:
- `GET /storage/supabase/health` — verifies Supabase storage connectivity.
- `POST /cv/upload` — uploads CV (PDF) and extracts data
- `POST /profile/photo/upload_s3` — uploads profile photo (jpeg/png).

## Profiles ↔ CV linkage

The backend best-effort updates `profiles.cv_id` to reference the most recent CV (`cvs.cv_id`).

If your `profiles` table does not yet have a `cv_id` column, apply the migration in `supabase/schema.sql` which:

- Adds `profiles.cv_id uuid` (nullable)
- Adds a foreign key to `public.cvs(cv_id)` with `ON DELETE SET NULL`
- Creates `idx_profiles_cv_id` for faster lookups

Run the updated `supabase/schema.sql` in the Supabase SQL Editor using a service role to update your schema.

## Google Drive

Set:
- `GOOGLE_SERVICE_ACCOUNT_FILE`
- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_OAUTH_CLIENT_FILE`
- `GOOGLE_OAUTH_TOKEN_FILE`

The backend uploads PDFs to Drive if configured and falls back to OAuth if service account is unavailable.

## Notes

- Upload size limit controlled by `MAX_UPLOAD_MB` in config.
- Allowed types via `ALLOWED_UPLOAD_MIME_TYPES`.
- Local CV files are stored at `uploads/{user_id}/{file-stem}/cv.pdf`.
- Ensure Supabase buckets exist and are private; signed URLs are generated for access.