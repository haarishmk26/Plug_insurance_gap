-- Brokers are Supabase Auth users with a profile
create table public.brokers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

alter table public.brokers enable row level security;
create policy "brokers_own_row" on public.brokers
  using (auth.uid() = id);

-- Clients (business owners) belong to a broker
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid references public.brokers(id) on delete cascade not null,
  business_name text not null,
  owner_name text not null,
  owner_contact text,
  telegram_chat_id bigint,
  intake_token text unique not null,
  intake_status text not null default 'pending'
    check (intake_status in ('pending', 'in_progress', 'complete')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;
create policy "brokers_own_clients" on public.clients
  using (broker_id = auth.uid());

-- ACORD 125 intake answers stored per section
create table public.intake_data (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade unique not null,
  section_a jsonb not null default '{}',
  section_b jsonb not null default '{}',
  section_c jsonb not null default '{}',
  section_d jsonb not null default '{}',
  section_e jsonb not null default '{}',
  current_question_key text,
  updated_at timestamptz default now()
);

alter table public.intake_data enable row level security;
create policy "brokers_own_intake" on public.intake_data
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_id and c.broker_id = auth.uid()
    )
  );

-- Uploaded files (photos + PDFs)
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  storage_path text not null,
  file_name text not null,
  file_type text not null check (file_type in ('photo', 'pdf')),
  label text,
  telegram_file_id text,
  uploaded_at timestamptz default now()
);

alter table public.uploads enable row level security;
create policy "brokers_own_uploads" on public.uploads
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_id and c.broker_id = auth.uid()
    )
  );

-- Readiness scores (one per client, recalculated on demand)
create table public.readiness_scores (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade unique not null,
  total_score integer not null check (total_score between 0 and 100),
  documentation_score integer not null check (documentation_score between 0 and 25),
  safety_score integer not null check (safety_score between 0 and 25),
  property_score integer not null check (property_score between 0 and 20),
  claims_score integer not null check (claims_score between 0 and 20),
  neighborhood_score integer not null check (neighborhood_score between 0 and 10),
  score_details jsonb not null default '{}',
  calculated_at timestamptz default now()
);

alter table public.readiness_scores enable row level security;
create policy "brokers_own_scores" on public.readiness_scores
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_id and c.broker_id = auth.uid()
    )
  );

-- Trigger: update clients.updated_at on row change
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger intake_updated_at before update on public.intake_data
  for each row execute function public.set_updated_at();
