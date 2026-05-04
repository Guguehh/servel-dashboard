alter table public.price_types
  add column if not exists unit_label text;

alter table public.price_types
  add column if not exists allows_products boolean not null default true;

alter table public.services
  add column if not exists allows_products boolean not null default true;

