create table if not exists public.price_types (
  code text primary key,
  label text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.price_types enable row level security;

drop policy if exists "authenticated read price_types" on public.price_types;
create policy "authenticated read price_types"
on public.price_types for select
to authenticated
using (true);

drop policy if exists "authenticated write price_types" on public.price_types;
create policy "authenticated write price_types"
on public.price_types for all
to authenticated
using (true)
with check (true);

insert into public.price_types (code, label, description)
values
  ('fijo', 'Fijo', 'Cobro por servicio.'),
  ('por_hora', 'Por hora', 'Cobro por hora de trabajo.'),
  ('rango', 'Por rango', 'Cobro por cantidad/rangos.')
on conflict (code) do nothing;

alter table public.services
  add column if not exists base_price_type text;

alter table public.services
  drop constraint if exists services_base_price_type_check;

alter table public.services
  alter column base_price_type set default 'fijo';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'services_base_price_type_fkey'
  ) then
    alter table public.services
      add constraint services_base_price_type_fkey
      foreign key (base_price_type) references public.price_types (code);
  end if;
end $$;

