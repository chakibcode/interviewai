-- Supabase schema for AI Interview SaaS
-- Table: cvs

create table if not exists public.cvs (
  cv_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_filename text,
  pdf_storage_path text,
  original_pdf_url text,
  cv_image_path text,
  text_extracted text,
  raw_extracted jsonb,
  filtered_extracted jsonb,
  skills jsonb default '[]'::jsonb,
  education jsonb default '[]'::jsonb,
  experiences jsonb default '[]'::jsonb,
  languages jsonb default '[]'::jsonb,
  authors jsonb default '[]'::jsonb,
  status text default 'uploaded',
  parse_model text,
  parse_confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration for existing installs: add/rename columns safely
DO $$
BEGIN
  -- Rename legacy id -> cv_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='cvs' AND column_name='id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='cvs' AND column_name='cv_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.cvs RENAME COLUMN id TO cv_id';
  END IF;

  -- Add missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='source_filename') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN source_filename text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='pdf_storage_path') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN pdf_storage_path text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='original_pdf_url') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN original_pdf_url text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='cv_image_path') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN cv_image_path text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='text_extracted') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN text_extracted text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='raw_extracted') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN raw_extracted jsonb';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='filtered_extracted') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN filtered_extracted jsonb';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='skills') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN skills jsonb DEFAULT ''[]''::jsonb';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='education') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN education jsonb DEFAULT ''[]''::jsonb';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='experiences') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN experiences jsonb DEFAULT ''[]''::jsonb';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='languages') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN languages jsonb DEFAULT ''[]''::jsonb';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='authors') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN authors jsonb DEFAULT ''[]''::jsonb';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='status') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN status text DEFAULT ''uploaded''';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='parse_model') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN parse_model text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='parse_confidence') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN parse_confidence numeric';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cvs' AND column_name='updated_at') THEN
    EXECUTE 'ALTER TABLE public.cvs ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now()';
  END IF;
END $$;

-- Helpful indexes
create index if not exists idx_cvs_user_id on public.cvs(user_id);
create index if not exists idx_cvs_created_at on public.cvs(created_at);
create index if not exists idx_cvs_status on public.cvs(status);
create index if not exists idx_cvs_parse_model on public.cvs(parse_model);
create index if not exists idx_cvs_filtered_gin on public.cvs using gin (filtered_extracted);

-- Enable Row Level Security
alter table public.cvs enable row level security;

-- Policies: owners can SELECT/INSERT/UPDATE/DELETE their rows
drop policy if exists "cvs_select_own" on public.cvs;
create policy "cvs_select_own" on public.cvs
  for select using (user_id = auth.uid());

drop policy if exists "cvs_insert_own" on public.cvs;
create policy "cvs_insert_own" on public.cvs
  for insert with check (user_id = auth.uid());

drop policy if exists "cvs_update_own" on public.cvs;
create policy "cvs_update_own" on public.cvs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "cvs_delete_own" on public.cvs;
create policy "cvs_delete_own" on public.cvs
  for delete using (user_id = auth.uid());

-- Trigger to keep updated_at in sync for cvs
create or replace function public.set_cvs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_cvs_updated_at on public.cvs;
create trigger trg_cvs_updated_at
before update on public.cvs
for each row
execute procedure public.set_cvs_updated_at();

-- Notes:
-- - Use a private Storage bucket for PDFs and generate signed URLs for client access.
-- - Service role or Edge Functions can bypass RLS when necessary (e.g., webhooks), never expose service keys client-side.

-- Storage policies for cv2interviewBucket
-- Note: storage.objects RLS is managed by Supabase automatically

-- Policy to allow authenticated users to upload files to cv2interviewBucket
drop policy if exists "cv2interviewBucket_upload" on storage.objects;
create policy "cv2interviewBucket_upload" on storage.objects
  for insert with check (
    bucket_id = 'cv2interviewBucket' 
    and auth.role() = 'authenticated'
  );

-- Policy to allow users to view their own files in cv2interviewBucket
drop policy if exists "cv2interviewBucket_select" on storage.objects;
create policy "cv2interviewBucket_select" on storage.objects
  for select using (
    bucket_id = 'cv2interviewBucket' 
    and auth.role() = 'authenticated'
  );

-- Policy to allow users to update their own files in cv2interviewBucket
drop policy if exists "cv2interviewBucket_update" on storage.objects;
create policy "cv2interviewBucket_update" on storage.objects
  for update using (
    bucket_id = 'cv2interviewBucket' 
    and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'cv2interviewBucket' 
    and auth.role() = 'authenticated'
  );

-- Policy to allow users to delete their own files in cv2interviewBucket
drop policy if exists "cv2interviewBucket_delete" on storage.objects;
create policy "cv2interviewBucket_delete" on storage.objects
  for delete using (
    bucket_id = 'cv2interviewBucket' 
    and auth.role() = 'authenticated'
  );

-- Table: profiles (SaaS user metadata)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free', -- free, pro, enterprise
  plan_status text not null default 'active', -- active, past_due, canceled
  billing_email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  onboarding_completed boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_plan on public.profiles(plan);

-- Link profiles to latest CV (optional association)
-- Migration-safe: add column and FK only if missing
DO $$
BEGIN
  -- Add cv_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='cv_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ADD COLUMN cv_id uuid';
  END IF;

  -- Add foreign key constraint if not present
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'profiles_cv_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles 
             ADD CONSTRAINT profiles_cv_id_fkey 
             FOREIGN KEY (cv_id) REFERENCES public.cvs(cv_id) 
             ON DELETE SET NULL';
  END IF;
END $$;

-- Helpful index for cv_id lookups
create index if not exists idx_profiles_cv_id on public.profiles(cv_id);

-- Row Level Security for profiles
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (user_id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Trigger to keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();