-- =============================================================================
-- 002_devotionals_columns.sql — align public.devotionals with the backend route
-- (routes/devotionals.js reads prayer_prompt, scripture_reference, scripture_text,
--  action_step). The reconstructed table had 'prayer' and lacked the rest.
-- Idempotent.
-- =============================================================================

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='devotionals' and column_name='prayer')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='devotionals' and column_name='prayer_prompt') then
    alter table public.devotionals rename column prayer to prayer_prompt;
  end if;
end $$;

alter table public.devotionals
  add column if not exists prayer_prompt             text,
  add column if not exists scripture_reference       text,
  add column if not exists scripture_text            text,
  add column if not exists action_step               text,
  add column if not exists tags                      text[] default '{}',
  add column if not exists estimated_reading_minutes integer;

-- Unique title so the devotional seed is idempotent / re-schedulable.
create unique index if not exists devotionals_title_uidx on public.devotionals (title);
