/**
 * import_kjv.mjs — one-time full KJV import into scripture_verses.
 *
 * Dependency-free: uses Node's built-in fetch against the Supabase REST API,
 * so there's nothing to `npm install` and no client to crash on exit.
 * Dedupes against the curated topical verses via PostgREST on_conflict, so run
 * database/seeds/001b_scripture_normalize.sql FIRST (it creates the unique key).
 *
 * Run from anywhere:
 *   $env:SUPABASE_URL="https://xhxlghrzrxbzyjittqdf.supabase.co"
 *   $env:SUPABASE_SERVICE_KEY="<service_role secret for the NEW project>"
 *   node import_kjv.mjs
 *
 * Idempotent: re-running inserts nothing new (duplicates are ignored).
 */
const URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY || '';
const KJV_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';
const BATCH = 500;

console.log('--- Still Waters KJV import ---');
console.log('Node        :', process.version);
console.log('SUPABASE_URL:', URL ? URL : '(MISSING)');
console.log('SERVICE_KEY :', KEY ? `set (len ${KEY.length}, starts "${KEY.slice(0, 6)}...")` : '(MISSING)');

if (!URL || !KEY) {
  console.error('\nERROR: set SUPABASE_URL and SUPABASE_SERVICE_KEY (the service_role secret) in THIS terminal, then re-run.');
  process.exit(1);
}

const rest = (path) => `${URL}/rest/v1/${path}`;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function main() {
  console.log('\nLoading bible_books...');
  const bRes = await fetch(rest('bible_books?select=id,name,book_order&order=book_order'), { headers });
  if (!bRes.ok) { console.error('Failed to load bible_books:', bRes.status, await bRes.text()); process.exit(1); }
  const books = await bRes.json();
  if (!Array.isArray(books) || books.length !== 66) {
    console.error(`Expected 66 books, got ${books?.length ?? 0}. Run 000_bible_books_seed.sql first.`); process.exit(1);
  }
  const byOrder = new Map(books.map((b) => [b.book_order, b]));
  console.log(`  ${books.length} books loaded.`);

  console.log('Fetching KJV source...');
  const kRes = await fetch(KJV_URL);
  if (!kRes.ok) { console.error('KJV fetch failed:', kRes.status); process.exit(1); }
  const data = JSON.parse((await kRes.text()).replace(/^\uFEFF/, ''));
  if (data.length !== 66) { console.error(`KJV JSON has ${data.length} books, expected 66.`); process.exit(1); }

  const rows = [];
  data.forEach((b, i) => {
    const bk = byOrder.get(i + 1);
    b.chapters.forEach((ch, ci) => {
      ch.forEach((vt, vi) => {
        const chapter = ci + 1, verse = vi + 1;
        rows.push({
          book_id: bk.id, chapter, verse_start: verse, verse_end: verse,
          reference: `${bk.name} ${chapter}:${verse}`,
          text_kjv: String(vt).replace(/[{}]/g, '').trim(),
        });
      });
    });
  });
  console.log(`Prepared ${rows.length} verses. Upserting in batches of ${BATCH}...`);

  const target = rest('scripture_verses?on_conflict=book_id,chapter,verse_start,verse_end');
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const r = await fetch(target, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify(batch),
    });
    if (!r.ok) { console.error(`\nBatch at row ${i} failed:`, r.status, await r.text()); process.exit(1); }
    done += batch.length;
    if (done % 5000 < BATCH) console.log(`  ${done}/${rows.length}`);
  }

  const cRes = await fetch(rest('scripture_verses?select=id'), { headers: { ...headers, Prefer: 'count=exact', Range: '0-0' } });
  const cr = cRes.headers.get('content-range') || '';
  console.log(`\nDone. scripture_verses total: ${cr.split('/')[1] || '(check SQL editor)'}`);
  process.exit(0);
}

main().catch((e) => { console.error('\nUnexpected error:', e?.message || e); process.exit(1); });
