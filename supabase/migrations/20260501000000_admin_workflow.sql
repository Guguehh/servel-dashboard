create table if not exists public.admin_change_requests (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  actor_role text not null check (actor_role in ('aguila', 'halcon', 'buho')),
  kind text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado')),
  approver_email text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists admin_change_requests_status_idx on public.admin_change_requests (status);
create index if not exists admin_change_requests_created_at_idx on public.admin_change_requests (created_at desc);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  actor_role text not null check (actor_role in ('aguila', 'halcon', 'buho')),
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

alter table public.admin_change_requests enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "authenticated read admin_change_requests" on public.admin_change_requests;
create policy "authenticated read admin_change_requests"
on public.admin_change_requests for select
to authenticated
using (true);

drop policy if exists "authenticated write admin_change_requests" on public.admin_change_requests;
create policy "authenticated write admin_change_requests"
on public.admin_change_requests for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read admin_audit_log" on public.admin_audit_log;
create policy "authenticated read admin_audit_log"
on public.admin_audit_log for select
to authenticated
using (true);

drop policy if exists "authenticated write admin_audit_log" on public.admin_audit_log;
create policy "authenticated write admin_audit_log"
on public.admin_audit_log for all
to authenticated
using (true)
with check (true);
