create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

drop policy if exists "authenticated read admin_settings" on public.admin_settings;
create policy "authenticated read admin_settings"
on public.admin_settings for select
to authenticated
using (true);

drop policy if exists "authenticated write admin_settings" on public.admin_settings;
create policy "authenticated write admin_settings"
on public.admin_settings for all
to authenticated
using (true)
with check (true);

