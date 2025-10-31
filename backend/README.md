# InterviewAI Backend

FastAPI backend for InterviewAI.

## Local development

- Start server: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Docs: `http://localhost:8000/docs`

## Secrets & Environment Variables

Configure sensitive values via environment variables (or a `.env` file loaded at runtime). Do not hardcode secrets in source code.

- `OPENAI_API_KEY` — OpenAI API key
- `OPENAI_MODEL` — model name (e.g., `gpt-4o-mini`)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `SUPABASE_BUCKET_CVS` — Storage bucket for CV PDFs (default `cv2interviewBucket`)
- `SUPABASE_BUCKET_DOCS` — Storage bucket for documents
- `SUPABASE_BUCKET_PROFILE_PHOTOS` — Storage bucket for profile photos
- `MAX_UPLOAD_MB` — max upload size in MB (default `2`)
- `GOOGLE_SERVICE_ACCOUNT_FILE` — path to service account JSON
- `GOOGLE_DRIVE_FOLDER_ID` — optional Drive folder ID for uploads
- `GOOGLE_OAUTH_CLIENT_FILE` — path to OAuth client JSON
- `GOOGLE_OAUTH_TOKEN_FILE` — path to OAuth token JSON (generated)
- `SUPABASE_ENDPOINT` — S3-compatible endpoint for Supabase Storage
- `ACCESS_KEY_ID` — S3 access key id
- `SERCET_ACCESS_KEY` — S3 secret access key (env name preserved as in code)

Example `.env` (do not commit):

```
OPENAI_API_KEY=sk-...your-key...
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
SUPABASE_BUCKET_CVS=cv2interviewBucket
SUPABASE_BUCKET_DOCS=documents
SUPABASE_BUCKET_PROFILE_PHOTOS=profile-photos
MAX_UPLOAD_MB=5
GOOGLE_SERVICE_ACCOUNT_FILE=/absolute/path/to/google.json
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_OAUTH_CLIENT_FILE=/absolute/path/to/google-oauth.json
GOOGLE_OAUTH_TOKEN_FILE=/absolute/path/to/token.json
SUPABASE_ENDPOINT=https://<project>.storage.supabase.co/storage/v1/s3
ACCESS_KEY_ID=...
SERCET_ACCESS_KEY=...
```

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