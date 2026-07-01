-- BASE SCHEMA — apply this first, then every file in database/migrations/ in
-- numeric order (001_, 002_, ...). Do not edit column definitions here to
-- reflect later changes; add a migration instead.
-- =============================================================================
-- Still Waters — Authoritative Database Schema
-- =============================================================================
-- Target: the NEW dedicated Supabase project (not the shared MSG project).
-- Reconstructed from the api/ backend (every .from()/.insert()/.rpc() call),
-- since no CREATE TABLE ever lived in the repo. This file is now the source
-- of truth — apply it, then seed scriptures + devotionals.
--
-- Auth model: Sunday CPiD is the primary gate; Supabase email/password (GoTrue)
-- is retained as a fallback. Both resolve to an auth.users row, which public.users
-- links to via auth_id. cpid_identities maps a Sunday cpid -> that auth user.
--
-- Security posture (post-incident rule, 2026-05): every table has RLS enabled,
-- ALL privileges revoked from anon + authenticated, and access limited to the
-- service_role the Node API authenticates as. Run top-to-bottom in the SQL editor.
-- =============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Generate a unique SW-###### community code
create or replace function public.gen_sw_code()
returns text language plpgsql as $$
declare
  code text;
begin
  loop
    code := 'SW-' || lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.users where sw_code = code);
  end loop;
  return code;
end $$;

create or replace function public.users_set_sw_code()
returns trigger language plpgsql as $$
begin
  if new.sw_code is null then
    new.sw_code := public.gen_sw_code();
  end if;
  return new;
end $$;

-- =============================================================================
-- SCRIPTURE
-- =============================================================================
create table public.bible_books (
  id                    serial primary key,
  name                  text not null,
  abbreviation          text,
  testament             text check (testament in ('old','new')),
  book_order            int,
  is_canonical          boolean not null default true,
  is_deuterocanonical   boolean not null default false,
  is_extra_biblical     boolean not null default false,
  created_at            timestamptz not null default now()
);

create table public.scripture_verses (
  id            uuid primary key default gen_random_uuid(),
  book_id       int references public.bible_books(id) on delete set null,
  chapter       int,
  verse_start   int,
  verse_end     int,
  reference     text,
  text_esv      text,
  text_niv      text,
  text_kjv      text,
  text_nasb     text,
  text_nlt      text,
  search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(reference,'') || ' ' ||
      coalesce(text_esv,'')  || ' ' ||
      coalesce(text_kjv,'')  || ' ' ||
      coalesce(text_niv,'')  || ' ' ||
      coalesce(text_nasb,'') || ' ' ||
      coalesce(text_nlt,''))
  ) stored,
  created_at    timestamptz not null default now()
);
create index scripture_verses_search_idx on public.scripture_verses using gin (search_vector);
create index scripture_verses_reference_idx on public.scripture_verses (reference);

create table public.scripture_topics (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,
  description  text,
  created_at   timestamptz not null default now()
);

create table public.scripture_topic_mappings (
  id             uuid primary key default gen_random_uuid(),
  scripture_id   uuid references public.scripture_verses(id) on delete cascade,
  topic_id       uuid references public.scripture_topics(id) on delete cascade,
  relevance_score numeric default 1.0,
  context_notes  text,
  unique (scripture_id, topic_id)
);

-- =============================================================================
-- USERS  (linked to auth.users via auth_id)
-- =============================================================================
create table public.users (
  id                       uuid primary key default gen_random_uuid(),
  auth_id                  uuid unique references auth.users(id) on delete cascade,
  email                    text,
  display_name             text,
  avatar                   text,
  timezone                 text default 'UTC',
  version                  text default 'esv',        -- preferred bible version
  sw_code                  text unique,               -- community code (auto-generated)
  current_streak           int not null default 0,
  longest_streak           int not null default 0,
  last_active_at           timestamptz,
  notification_preferences jsonb not null default '{}'::jsonb,
  -- Subscription / Stripe
  subscription_tier        text not null default 'free',
  subscription_status      text not null default 'active',
  stripe_customer_id       text,
  subscription_id          text,
  trial_ends_at            timestamptz,
  current_period_end       timestamptz,
  -- Admin
  is_admin                 boolean not null default false,
  admin_level              text,
  -- Lifecycle
  deleted_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index users_auth_id_idx on public.users (auth_id);
create index users_sw_code_idx on public.users (sw_code);
create index users_stripe_customer_idx on public.users (stripe_customer_id);
create trigger users_sw_code_trg   before insert on public.users
  for each row execute function public.users_set_sw_code();
create trigger users_updated_at_trg before update on public.users
  for each row execute function public.set_updated_at();

-- Sunday CPiD identity mapping (primary sign-in)
create table public.cpid_identities (
  id          uuid primary key default gen_random_uuid(),
  cpid        text not null unique,
  auth_id     uuid references auth.users(id) on delete cascade,
  user_id     uuid references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  last_login_at timestamptz
);
create index cpid_identities_user_idx on public.cpid_identities (user_id);

-- =============================================================================
-- CONVERSATIONS
-- =============================================================================
create table public.conversations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  title            text,
  initial_mood     text,
  primary_topic    text,
  started_at       timestamptz not null default now(),
  last_message_at  timestamptz,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index conversations_user_idx on public.conversations (user_id);
create trigger conversations_updated_at_trg before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.conversation_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  role             text not null check (role in ('user','assistant','system')),
  content          text not null,
  sequence_number  int not null,
  scriptures_cited jsonb,
  topics_addressed jsonb,
  created_at       timestamptz not null default now(),
  unique (conversation_id, sequence_number)
);
create index conversation_messages_conv_idx on public.conversation_messages (conversation_id);

create table public.saved_reflections (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  message_id          uuid references public.conversation_messages(id) on delete set null,
  conversation_id     uuid references public.conversations(id) on delete set null,
  title               text,
  content             text,
  scripture_reference text,
  personal_notes      text,
  tags                text[] default '{}',
  created_at          timestamptz not null default now()
);
create index saved_reflections_user_idx on public.saved_reflections (user_id);

-- =============================================================================
-- PRAYER
-- =============================================================================
create table public.prayer_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  content       text not null,
  visibility    text not null default 'community' check (visibility in ('private','community','public')),
  is_anonymous  boolean not null default false,
  category      text,
  is_answered   boolean not null default false,
  answered_at   timestamptz,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index prayer_requests_user_idx on public.prayer_requests (user_id);
create index prayer_requests_visibility_idx on public.prayer_requests (visibility);
create trigger prayer_requests_updated_at_trg before update on public.prayer_requests
  for each row execute function public.set_updated_at();

create table public.prayer_interactions (
  id                uuid primary key default gen_random_uuid(),
  prayer_id         uuid not null references public.prayer_requests(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  interaction_type  text not null default 'prayed',
  created_at        timestamptz not null default now(),
  unique (prayer_id, user_id, interaction_type)
);
create index prayer_interactions_prayer_idx on public.prayer_interactions (prayer_id);

-- =============================================================================
-- COMMUNITY  (two parallel systems the backend uses: connections + relationships)
-- =============================================================================
create table public.user_connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.users(id) on delete cascade,
  recipient_id  uuid not null references public.users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (requester_id, recipient_id)
);
create index user_connections_recipient_idx on public.user_connections (recipient_id);
create index user_connections_requester_idx on public.user_connections (requester_id);
create trigger user_connections_updated_at_trg before update on public.user_connections
  for each row execute function public.set_updated_at();

create table public.user_relationships (
  id                 uuid primary key default gen_random_uuid(),
  requester_id       uuid not null references public.users(id) on delete cascade,
  addressee_id       uuid not null references public.users(id) on delete cascade,
  relationship_type  text default 'friend',
  status             text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (requester_id, addressee_id)
);
create index user_relationships_addressee_idx on public.user_relationships (addressee_id);
create trigger user_relationships_updated_at_trg before update on public.user_relationships
  for each row execute function public.set_updated_at();

-- =============================================================================
-- DEVOTIONALS  (API serves public.devotionals; see note about the seed below)
-- =============================================================================
create table public.devotionals (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  theme             text,
  content           text,
  reflection        text,
  prayer            text,
  scripture_id      uuid references public.scripture_verses(id) on delete set null,
  scheduled_date    date,
  day_of_year       int,
  difficulty_level  text,
  reading_time      int,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index devotionals_scheduled_idx on public.devotionals (scheduled_date) where is_active;
create index devotionals_day_of_year_idx on public.devotionals (day_of_year) where is_active;
create trigger devotionals_updated_at_trg before update on public.devotionals
  for each row execute function public.set_updated_at();

create table public.user_devotional_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  devotional_id       uuid not null references public.devotionals(id) on delete cascade,
  viewed_at           timestamptz not null default now(),
  completed_at        timestamptz,
  time_spent_seconds  int,
  personal_reflection text,
  rating              int check (rating between 1 and 5),
  shared_to_group_id  uuid,
  unique (user_id, devotional_id)
);
create index user_devotional_logs_user_idx on public.user_devotional_logs (user_id);

-- =============================================================================
-- STUDY GROUPS
-- =============================================================================
create table public.study_groups (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  avatar_emoji        text default '📖',
  cover_image_url     text,
  current_book_id     int references public.bible_books(id) on delete set null,
  current_study_topic text,
  study_pace          text,
  is_public           boolean not null default false,
  requires_approval   boolean not null default false,
  max_members         int,
  member_count        int not null default 1,
  created_by          uuid references public.users(id) on delete set null,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger study_groups_updated_at_trg before update on public.study_groups
  for each row execute function public.set_updated_at();

create table public.group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.study_groups(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner','admin','member')),
  status     text not null default 'active' check (status in ('pending','active','removed')),
  joined_at  timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);
create index group_members_group_idx on public.group_members (group_id);
create index group_members_user_idx on public.group_members (user_id);

create table public.group_messages (
  id                 uuid primary key default gen_random_uuid(),
  group_id           uuid not null references public.study_groups(id) on delete cascade,
  user_id            uuid references public.users(id) on delete set null,
  content            text not null,
  message_type       text default 'text',
  scripture_id       uuid references public.scripture_verses(id) on delete set null,
  scripture_reference text,
  parent_message_id  uuid references public.group_messages(id) on delete set null,
  reaction_counts    jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);
create index group_messages_group_idx on public.group_messages (group_id);

create table public.message_reactions (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.group_messages(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create table public.group_events (
  id                   uuid primary key default gen_random_uuid(),
  group_id             uuid not null references public.study_groups(id) on delete cascade,
  created_by           uuid references public.users(id) on delete set null,
  title                text not null,
  description          text,
  event_type           text,
  scheduled_at         timestamptz not null,
  duration_minutes     int,
  timezone             text,
  is_virtual           boolean not null default true,
  meeting_url          text,
  location_address     text,
  scripture_focus      text,
  discussion_questions jsonb,
  max_attendees        int,
  created_at           timestamptz not null default now()
);
create index group_events_group_idx on public.group_events (group_id);

create table public.event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.group_events(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  status     text not null default 'going' check (status in ('going','maybe','declined')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- =============================================================================
-- ENGAGEMENT: streaks, analytics, notifications, message usage
-- =============================================================================
create table public.user_streaks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  streak_date   date not null,
  activity_type text not null,
  created_at    timestamptz not null default now(),
  unique (user_id, streak_date, activity_type)
);
create index user_streaks_user_idx on public.user_streaks (user_id);

create table public.user_analytics_daily (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  analytics_date        date not null,
  conversations_started int not null default 0,
  messages_sent         int not null default 0,
  devotionals_completed int not null default 0,
  prayers_submitted     int not null default 0,
  prayers_offered       int not null default 0,
  scriptures_viewed     int not null default 0,
  time_in_app_minutes   int not null default 0,
  primary_mood          text,
  primary_topics        text[] default '{}',
  unique (user_id, analytics_date)
);
create index user_analytics_user_idx on public.user_analytics_daily (user_id);

create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  title             text not null,
  body              text,
  notification_type text default 'general',
  action_type       text,
  action_id         uuid,
  action_data       jsonb,
  is_read           boolean not null default false,
  scheduled_for     timestamptz default now(),
  created_at        timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id);
create index notifications_unread_idx on public.notifications (user_id) where is_read = false;

create table public.message_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  period_type   text not null check (period_type in ('weekly','monthly')),
  period_start  date not null,
  message_count int not null default 0,
  updated_at    timestamptz not null default now(),
  unique (user_id, period_type, period_start)
);
create index message_usage_user_idx on public.message_usage (user_id);

-- RPC the subscription middleware calls after each AI response
create or replace function public.increment_message_count(p_user_id uuid, p_period_type text)
returns void language plpgsql security definer as $$
declare
  p_start date;
begin
  if p_period_type = 'weekly' then
    p_start := date_trunc('week', now())::date;
  else
    p_start := date_trunc('month', now())::date;
  end if;

  insert into public.message_usage (user_id, period_type, period_start, message_count, updated_at)
  values (p_user_id, p_period_type, p_start, 1, now())
  on conflict (user_id, period_type, period_start)
  do update set message_count = public.message_usage.message_count + 1,
                updated_at = now();
end $$;

-- =============================================================================
-- SECURITY  (post-incident rule): RLS on everything, nothing to anon/authenticated,
-- everything to the service_role the API uses. service_role bypasses RLS, so the
-- backend is unaffected; anon/authenticated are denied by default.
-- =============================================================================
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('revoke all on public.%I from anon, authenticated;', t);
    execute format('grant all on public.%I to service_role;', t);
  end loop;
end $$;

-- Lock down function execution + future objects
revoke all on function public.increment_message_count(uuid, text) from anon, authenticated;
grant execute on function public.increment_message_count(uuid, text) to service_role;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;

-- =============================================================================
-- END. Next: seed bible_books + scriptures (001) and devotionals, then point
-- the Railway backend's SUPABASE_URL / ANON_KEY / SERVICE_KEY at this project.
-- =============================================================================
