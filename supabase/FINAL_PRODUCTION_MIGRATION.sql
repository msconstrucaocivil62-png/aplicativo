-- O PROFISSIONAL CERTO 5.0 — recursos finais de produção
begin;

create table if not exists public.opc_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references public.profiles(id) on delete cascade,
  plano text not null check (plano in ('monthly','semiannual','annual')),
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled','rejected')),
  valor numeric(12,2) not null check (valor >= 0),
  inicia_em timestamptz,
  vence_em timestamptz,
  mercado_pago_preference_id text,
  mercado_pago_payment_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists opc_subscriptions_profissional_idx on public.opc_subscriptions(profissional_id, created_at desc);

create table if not exists public.opc_support_tickets (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  assunto text not null,
  mensagem text not null,
  resposta text,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.opc_payment_events (
  id bigint generated always as identity primary key,
  provider text not null default 'mercado_pago',
  provider_event_id text,
  payment_id text,
  payload jsonb not null default '{}'::jsonb,
  processed boolean default false,
  created_at timestamptz default now(),
  unique(provider, provider_event_id)
);

alter table public.opc_subscriptions enable row level security;
alter table public.opc_support_tickets enable row level security;
alter table public.opc_payment_events enable row level security;

drop policy if exists opc_subscriptions_read on public.opc_subscriptions;
create policy opc_subscriptions_read on public.opc_subscriptions for select to authenticated
using (profissional_id = auth.uid() or public.is_admin());

drop policy if exists opc_support_read on public.opc_support_tickets;
create policy opc_support_read on public.opc_support_tickets for select to authenticated
using (usuario_id = auth.uid() or public.is_admin());

drop policy if exists opc_support_insert on public.opc_support_tickets;
create policy opc_support_insert on public.opc_support_tickets for insert to authenticated
with check (usuario_id = auth.uid());

drop policy if exists opc_support_admin_update on public.opc_support_tickets;
create policy opc_support_admin_update on public.opc_support_tickets for update to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Eventos de pagamento são exclusivamente do backend (service role).

commit;
