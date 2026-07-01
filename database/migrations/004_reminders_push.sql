-- =============================================================================
-- 004_reminders_push.sql  [DORMANT SCAFFOLDING — no app code uses this yet]
-- Architecture for prayer/devotional reminders via Web Push + a cron-driven
-- schedule. The in-app inbox already exists (public.notifications). RLS-locked.
-- =============================================================================

-- Web Push subscriptions (service worker Push API; iOS 16.4+ for installed PWAs)
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  unique (user_id, endpoint)
);

-- Per-user recurring reminders; a scheduler (cron-job.org) reads due rows and sends
create table if not exists public.reminder_schedules (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  reminder_type  text not null,          -- prayer | devotional | scripture
  time_of_day    time,
  days_of_week   int[] default '{0,1,2,3,4,5,6}',  -- 0=Sun..6=Sat
  timezone       text default 'UTC',
  message        text,
  enabled        boolean not null default true,
  last_sent_at   timestamptz,
  next_run_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists reminder_schedules_due_idx on public.reminder_schedules (next_run_at) where enabled;
create trigger reminder_schedules_updated_at before update on public.reminder_schedules
  for each row execute function public.set_updated_at();

-- Security: RLS on, nothing to anon/authenticated, all to service_role.
do $$
declare t text;
begin
  for t in select unnest(array['push_subscriptions','reminder_schedules']) loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('revoke all on public.%I from anon, authenticated;', t);
    execute format('grant all on public.%I to service_role;', t);
  end loop;
end $$;
