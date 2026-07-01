-- =============================================================================
-- 001b_scripture_normalize.sql
-- Run AFTER 001_scriptures_seed.sql and BEFORE the KJV import (api/scripts/import_kjv.mjs).
-- Prepares the topical rows so the KJV import dedupes cleanly. Idempotent.
-- =============================================================================

-- 1) Complete the tuple for single verses (the topical seed left verse_end NULL,
--    which would otherwise dodge the dedup and duplicate verses like John 3:16).
update public.scripture_verses
set verse_end = verse_start
where verse_end is null;

-- 2) Regenerate topical references from the canonical book name so they match the
--    KJV import's naming (e.g. 'Psalm 23:1' -> 'Psalms 23:1').
update public.scripture_verses sv
set reference = bb.name || ' ' || sv.chapter || ':' || sv.verse_start
  || case when sv.verse_end is not null and sv.verse_end <> sv.verse_start
          then '-' || sv.verse_end else '' end
from public.bible_books bb
where bb.id = sv.book_id
  and sv.text_esv is not null;

-- 3) Unique key: makes the KJV import idempotent and dedupes single-verse overlaps.
create unique index if not exists scripture_verses_ref_uidx
  on public.scripture_verses (book_id, chapter, verse_start, verse_end);
