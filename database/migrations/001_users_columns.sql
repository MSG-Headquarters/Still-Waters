-- =============================================================================
-- 001_users_columns.sql — reconcile public.users with what the backend expects.
-- The reconstructed schema named the version column 'version' (backend reads
-- 'preferred_bible_version') and omitted several profile-preference fields, so
-- profile updates failed and the KJV reader fell back to blank ESV. Idempotent.
-- =============================================================================

do $$
begin
  -- version -> preferred_bible_version
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='users' and column_name='version')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='users' and column_name='preferred_bible_version') then
    alter table public.users rename column version to preferred_bible_version;
  end if;
  -- avatar -> avatar_url
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='users' and column_name='avatar')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='users' and column_name='avatar_url') then
    alter table public.users rename column avatar to avatar_url;
  end if;
end $$;

alter table public.users
  add column if not exists preferred_bible_version text default 'kjv',
  add column if not exists avatar_url             text,
  add column if not exists bio                    text,
  add column if not exists denomination           text,
  add column if not exists include_apocrypha      boolean default false,
  add column if not exists include_extra_biblical boolean default false,
  add column if not exists daily_devotional_time  text,
  add column if not exists profile_visibility     text default 'public',
  add column if not exists prayer_requests_visible boolean default true,
  add column if not exists show_streak            boolean default true,
  add column if not exists anonymous_by_default   boolean default false,
  add column if not exists total_conversations    integer default 0,
  add column if not exists password_hash          text;

-- KJV is the only fully-seeded translation for beta; default to it and backfill.
alter table public.users alter column preferred_bible_version set default 'kjv';
update public.users set preferred_bible_version = 'kjv' where preferred_bible_version is null;
