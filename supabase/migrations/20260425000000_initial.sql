-- Phase 1 Supabase schema for the District Cover intake MVP.
-- Source: PRD.md Section 11 and docs/specs/2026-04-25-phase1-worksplit.md.

create extension if not exists pgcrypto;

create table if not exists public.brokers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.brokers enable row level security;

drop policy if exists "brokers_select_own_row" on public.brokers;
create policy "brokers_select_own_row"
  on public.brokers
  for select
  using (auth.uid() = id);

drop policy if exists "brokers_insert_own_row" on public.brokers;
create policy "brokers_insert_own_row"
  on public.brokers
  for insert
  with check (auth.uid() = id);

drop policy if exists "brokers_update_own_row" on public.brokers;
create policy "brokers_update_own_row"
  on public.brokers
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  business_name text not null,
  owner_name text not null,
  owner_contact text,
  telegram_chat_id bigint,
  intake_token text not null unique,
  intake_status text not null default 'pending'
    check (intake_status in ('pending', 'in_progress', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_broker_id_idx on public.clients(broker_id);
create index if not exists clients_intake_token_idx on public.clients(intake_token);
create index if not exists clients_intake_status_idx on public.clients(intake_status);

alter table public.clients enable row level security;

drop policy if exists "brokers_select_own_clients" on public.clients;
create policy "brokers_select_own_clients"
  on public.clients
  for select
  using (broker_id = auth.uid());

drop policy if exists "brokers_insert_own_clients" on public.clients;
create policy "brokers_insert_own_clients"
  on public.clients
  for insert
  with check (broker_id = auth.uid());

drop policy if exists "brokers_update_own_clients" on public.clients;
create policy "brokers_update_own_clients"
  on public.clients
  for update
  using (broker_id = auth.uid())
  with check (broker_id = auth.uid());

drop policy if exists "brokers_delete_own_clients" on public.clients;
create policy "brokers_delete_own_clients"
  on public.clients
  for delete
  using (broker_id = auth.uid());

create table if not exists public.intake_data (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  section_a jsonb not null default '{}'::jsonb,
  section_b jsonb not null default '{}'::jsonb,
  section_c jsonb not null default '{}'::jsonb,
  section_d jsonb not null default '{}'::jsonb,
  section_e jsonb not null default '{}'::jsonb,
  current_question_key text,
  updated_at timestamptz not null default now()
);

create index if not exists intake_data_client_id_idx on public.intake_data(client_id);

alter table public.intake_data enable row level security;

drop policy if exists "brokers_select_own_intake" on public.intake_data;
create policy "brokers_select_own_intake"
  on public.intake_data
  for select
  using (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_insert_own_intake" on public.intake_data;
create policy "brokers_insert_own_intake"
  on public.intake_data
  for insert
  with check (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_update_own_intake" on public.intake_data;
create policy "brokers_update_own_intake"
  on public.intake_data
  for update
  using (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_type text not null check (file_type in ('photo', 'pdf')),
  label text,
  telegram_file_id text,
  uploaded_at timestamptz not null default now()
);

create index if not exists uploads_client_id_idx on public.uploads(client_id);
create index if not exists uploads_uploaded_at_idx on public.uploads(uploaded_at);

alter table public.uploads enable row level security;

drop policy if exists "brokers_select_own_uploads" on public.uploads;
create policy "brokers_select_own_uploads"
  on public.uploads
  for select
  using (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_insert_own_uploads" on public.uploads;
create policy "brokers_insert_own_uploads"
  on public.uploads
  for insert
  with check (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_update_own_uploads" on public.uploads;
create policy "brokers_update_own_uploads"
  on public.uploads
  for update
  using (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_delete_own_uploads" on public.uploads;
create policy "brokers_delete_own_uploads"
  on public.uploads
  for delete
  using (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

create table if not exists public.readiness_scores (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  total_score integer not null check (total_score between 0 and 100),
  documentation_score integer not null check (documentation_score between 0 and 25),
  safety_score integer not null check (safety_score between 0 and 25),
  property_score integer not null check (property_score between 0 and 20),
  claims_score integer not null check (claims_score between 0 and 20),
  neighborhood_score integer not null check (neighborhood_score between 0 and 10),
  score_details jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now()
);

create index if not exists readiness_scores_client_id_idx on public.readiness_scores(client_id);
create index if not exists readiness_scores_total_score_idx on public.readiness_scores(total_score);

alter table public.readiness_scores enable row level security;

drop policy if exists "brokers_select_own_scores" on public.readiness_scores;
create policy "brokers_select_own_scores"
  on public.readiness_scores
  for select
  using (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_insert_own_scores" on public.readiness_scores;
create policy "brokers_insert_own_scores"
  on public.readiness_scores
  for insert
  with check (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_update_own_scores" on public.readiness_scores;
create policy "brokers_update_own_scores"
  on public.readiness_scores
  for update
  using (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_delete_own_scores" on public.readiness_scores;
create policy "brokers_delete_own_scores"
  on public.readiness_scores
  for delete
  using (
    exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.broker_id = auth.uid()
    )
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

drop trigger if exists intake_updated_at on public.intake_data;
create trigger intake_updated_at
  before update on public.intake_data
  for each row
  execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('client-uploads', 'client-uploads', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "brokers_read_own_client_upload_objects" on storage.objects;
create policy "brokers_read_own_client_upload_objects"
  on storage.objects
  for select
  using (
    bucket_id = 'client-uploads'
    and exists (
      select 1
      from public.clients c
      where c.id::text = (storage.foldername(name))[1]
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_create_own_client_upload_objects" on storage.objects;
create policy "brokers_create_own_client_upload_objects"
  on storage.objects
  for insert
  with check (
    bucket_id = 'client-uploads'
    and exists (
      select 1
      from public.clients c
      where c.id::text = (storage.foldername(name))[1]
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_update_own_client_upload_objects" on storage.objects;
create policy "brokers_update_own_client_upload_objects"
  on storage.objects
  for update
  using (
    bucket_id = 'client-uploads'
    and exists (
      select 1
      from public.clients c
      where c.id::text = (storage.foldername(name))[1]
        and c.broker_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'client-uploads'
    and exists (
      select 1
      from public.clients c
      where c.id::text = (storage.foldername(name))[1]
        and c.broker_id = auth.uid()
    )
  );

drop policy if exists "brokers_delete_own_client_upload_objects" on storage.objects;
create policy "brokers_delete_own_client_upload_objects"
  on storage.objects
  for delete
  using (
    bucket_id = 'client-uploads'
    and exists (
      select 1
      from public.clients c
      where c.id::text = (storage.foldername(name))[1]
        and c.broker_id = auth.uid()
    )
  );
