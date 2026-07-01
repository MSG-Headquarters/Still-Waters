/**
 * import_kjv.mjs — one-time full KJV import into scripture_verses.
 *
 * Loads all ~31,100 KJV verses so the Bible reader has complete text.
 * Dedupes against the curated topical verses via ON CONFLICT (upsert/ignore),
 * so run 001b_scripture_normalize.sql FIRST (it creates the unique key).
 *
 * Run from the api/ directory (which has @supabase/supabase-js installed):
 *   $env:SUPABASE_URL="https://xhxlghrzrxbzyjittqdf.supabase.co"
 *   $env:SUPABASE_SERVICE_KEY="<service_role key for the NEW project>"
 *   node scripts/import_kjv.mjs
 *
 * Idempotent: re-running inserts nothing new (duplicates are ignored).
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const KJV_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';
const BATCH = 500;

if (!URL || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY (for the NEW project) before running.');
  process.exit(1);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

// 1) Load bible_books -> map by canonical order (must be seeded first: 000)
const { data: books, error: be } = await supabase
  .from('bible_books').select('id,name,book_order').order('book_order');
if (be) { console.error('Failed to load bible_books:', be.message); process.exit(1); }
if (!books || books.length !== 66) {
  console.error(`Expected 66 books in bible_books, found ${books?.length ?? 0}. Run 000_bible_books_seed.sql first.`);
  process.exit(1);
}
const byOrder = new Map(books.map(b => [b.book_order, b]));

// 2) Fetch KJV source (66 books, canonical order, chapters[][] of verse strings)
console.log('Fetching KJV source...');
const res = await fetch(KJV_URL);
if (!res.ok) { console.error('Fetch failed:', res.status); process.exit(1); }
const data = JSON.parse((await res.text()).replace(/^\uFEFF/, '')); // strip BOM
if (data.length !== 66) { console.error(`KJV JSON has ${data.length} books, expected 66.`); process.exit(1); }

// 3) Build rows: one per verse, book_id via canonical order, braces stripped
const rows = [];
data.forEach((b, i) => {
  const bk = byOrder.get(i + 1);
  b.chapters.forEach((ch, ci) => {
    ch.forEach((vt, vi) => {
      const chapter = ci + 1, verse = vi + 1;
      rows.push({
        book_id: bk.id,
        chapter,
        verse_start: verse,
        verse_end: verse,
        reference: `${bk.name} ${chapter}:${verse}`,
        text_kjv: String(vt).replace(/[{}]/g, '').trim(),
      });
    });
  });
});
console.log(`Prepared ${rows.length} verses. Upserting in batches of ${BATCH}...`);

// 4) Batched upsert; ignoreDuplicates relies on scripture_verses_ref_uidx (001b)
let done = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await supabase
    .from('scripture_verses')
    .upsert(batch, { onConflict: 'book_id,chapter,verse_start,verse_end', ignoreDuplicates: true });
  if (error) { console.error(`Batch at row ${i} failed:`, error.message); process.exit(1); }
  done += batch.length;
  if (done % 5000 < BATCH) console.log(`  ${done}/${rows.length}`);
}

const { count } = await supabase
  .from('scripture_verses').select('*', { count: 'exact', head: true });
console.log(`Done. scripture_verses now holds ${count} rows.`);
