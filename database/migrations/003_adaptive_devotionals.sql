-- =============================================================================
-- 003_adaptive_devotionals.sql  [DORMANT SCAFFOLDING — no app code uses this yet]
-- Architecture for onboarding baseline + adaptive/targeted devotionals tuned to a
-- user's themes over their first weeks. Activate post-launch. RLS-locked.
-- =============================================================================

-- Onboarding spiritual baseline captured at signup
create table if not exists public.user_spiritual_profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references public.users(id) on delete cascade,
  faith_stage           text,            -- seeker | new | growing | mature | leader
  focus_areas           text[] default '{}',   -- what they're wrestling with (maps to scripture_topics)
  growth_goals          text[] default '{}',
  denomination          text,
  onboarding_completed_at timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger user_spiritual_profiles_updated_at before update on public.user_spiritual_profiles
  for each row execute function public.set_updated_at();

-- Rolling theme signals derived from conversations/mood — feeds targeted selection
create table if not exists public.user_theme_signals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  theme          text not null,          -- e.g. 'Anxiety', 'Gratitude' (scripture_topics.name)
  signal_source  text default 'conversation',  -- conversation | mood | onboarding | manual
  weight         numeric default 1.0,
  detected_at    timestamptz not null default now()
);
create index if not exists user_theme_signals_user_idx on public.user_theme_signals (user_id, detected_at desc);

-- AI-generated / curated devotionals personalized to a user (distinct from the shared pool)
create table if not exists public.adaptive_devotionals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  for_date            date,
  theme               text,
  title               text,
  scripture_reference text,
  scripture_id        uuid references public.scripture_verses(id) on delete set null,
  reflection          text,
  prayer_prompt       text,
  action_step         text,
  source              text default 'generated',  -- generated | curated
  created_at          timestamptz not null default now(),
  unique (user_id, for_date)
);

-- The personalized first-weeks plan (sequence of devotionals for a user)
create table if not exists public.user_devotional_plans (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  day_index             int not null,
  scheduled_date        date,
  devotional_id         uuid references public.devotionals(id) on delete set null,
  adaptive_devotional_id uuid references public.adaptive_devotionals(id) on delete set null,
  status                text default 'pending',   -- pending | delivered | completed | skipped
  created_at            timestamptz not null default now(),
  unique (user_id, day_index)
);

-- Security: RLS on, nothing to anon/authenticated, all to service_role.
do $$
declare t text;
begin
  for t in select unnest(array['user_spiritual_profiles','user_theme_signals','adaptive_devotionals','user_devotional_plans']) loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('revoke all on public.%I from anon, authenticated;', t);
    execute format('grant all on public.%I to service_role;', t);
  end loop;
end $$;
