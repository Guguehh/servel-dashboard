-- Core application schema for Servel admin panel (categories/services/specialists)

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text not null default '',
  base_price_type text not null default 'fijo' check (base_price_type in ('fijo', 'por_hora', 'rango')),
  active boolean not null default true,
  base_price numeric,
  visit_price numeric,
  has_quantity_pricing boolean not null default false,
  price_ranges jsonb not null default '[]'::jsonb,
  min_price numeric,
  work_place text,
  previous_requirements text,
  products jsonb not null default '[]'::jsonb,
  duration integer,
  emergency jsonb not null default '[]'::jsonb,
  quote_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  phone text,
  role text not null default 'client' check (role in ('client', 'specialist', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.specialist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  verified boolean not null default false,
  rating numeric,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.specialist_services (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid references public.specialist (id) on delete cascade,
  service_id uuid references public.services (id) on delete cascade,
  name text,
  description text,
  has_quantity_pricing boolean not null default false,
  base_price numeric,
  visit_price numeric,
  min_price numeric,
  price_ranges jsonb not null default '[]'::jsonb,
  duration integer,
  emergencies boolean not null default false,
  products jsonb not null default '[]'::jsonb,
  previous_requirements text,
  active boolean not null default true,
  work_place text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.users enable row level security;
alter table public.specialist enable row level security;
alter table public.specialist_services enable row level security;

drop policy if exists "authenticated read categories" on public.categories;
create policy "authenticated read categories"
on public.categories for select
to authenticated
using (true);

drop policy if exists "authenticated write categories" on public.categories;
create policy "authenticated write categories"
on public.categories for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read services" on public.services;
create policy "authenticated read services"
on public.services for select
to authenticated
using (true);

drop policy if exists "authenticated write services" on public.services;
create policy "authenticated write services"
on public.services for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read users" on public.users;
create policy "authenticated read users"
on public.users for select
to authenticated
using (true);

drop policy if exists "authenticated write users" on public.users;
create policy "authenticated write users"
on public.users for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read specialist" on public.specialist;
create policy "authenticated read specialist"
on public.specialist for select
to authenticated
using (true);

drop policy if exists "authenticated write specialist" on public.specialist;
create policy "authenticated write specialist"
on public.specialist for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read specialist_services" on public.specialist_services;
create policy "authenticated read specialist_services"
on public.specialist_services for select
to authenticated
using (true);

drop policy if exists "authenticated write specialist_services" on public.specialist_services;
create policy "authenticated write specialist_services"
on public.specialist_services for all
to authenticated
using (true)
with check (true);
