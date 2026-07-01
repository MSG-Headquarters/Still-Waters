-- =============================================================================
-- 005_alrd_campaign_links.sql  [DORMANT SCAFFOLDING — no app code uses this yet]
-- THIN link layer only. Money movement (donations, payouts, receipts, Stripe
-- Connect) lives in the separate "A Little Red Door" 501(c)(3) entity, NOT here.
-- Still Waters only references a campaign hosted there so the prayer wall can
-- surface it. No financial columns beyond a display goal. RLS-locked.
-- =============================================================================

create table if not exists public.prayer_campaigns (
  id                   uuid primary key default gen_random_uuid(),
  prayer_request_id    uuid references public.prayer_requests(id) on delete set null,
  created_by           uuid references public.users(id) on delete set null,
  title                text not null,
  cause_description    text,
  goal_amount_cents    bigint,           -- display only; ALRD is source of truth
  currency             text default 'usd',
  external_provider    text default 'a_little_red_door',
  external_campaign_id text,             -- id in the ALRD giving system
  external_url         text,             -- where donations actually happen
  status               text default 'draft',  -- draft | pending | active | closed
  is_featured          boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists prayer_campaigns_status_idx on public.prayer_campaigns (status) where status='active';
create trigger prayer_campaigns_updated_at before update on public.prayer_campaigns
  for each row execute function public.set_updated_at();

-- Security: RLS on, nothing to anon/authenticated, all to service_role.
alter table public.prayer_campaigns enable row level security;
revoke all on public.prayer_campaigns from anon, authenticated;
grant all on public.prayer_campaigns to service_role;
