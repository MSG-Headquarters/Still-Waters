/**
 * Scriptures Routes
 * Handles Bible search, verse lookup, and topic browsing
 */

const express = require('express');
const router = express.Router();

// GET /api/scriptures/search - Search scriptures
router.get('/search', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { q, version, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const versionColumn = `text_${(version || req.user.preferred_bible_version || 'esv').toLowerCase()}`;
    
    // Full-text search
    const { data: scriptures, error } = await supabase
      .from('scripture_verses')
      .select(`
        id,
        reference,
        ${versionColumn},
        book:book_id (name, testament)
      `)
      .textSearch('search_vector', q.trim())
      .limit(limit);
    
    if (error) throw error;
    
    res.json({
      scriptures: scriptures.map(s => ({
        id: s.id,
        reference: s.reference,
        text: s[versionColumn],
        book: s.book
      })),
      query: q
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/scriptures/reference/:ref - Get by reference
router.get('/reference/:ref', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { ref } = req.params;
    const { version } = req.query;
    
    const { data: scripture, error } = await supabase
      .from('scripture_verses')
      .select(`
        *,
        book:book_id (*)
      `)
      .eq('reference', ref)
      .single();
    
    if (error || !scripture) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Scripture reference not found'
      });
    }
    
    const versionColumn = `text_${(version || req.user.preferred_bible_version || 'esv').toLowerCase()}`;
    
    res.json({
      scripture: {
        id: scripture.id,
        reference: scripture.reference,
        text: scripture[versionColumn] || scripture.text_esv,
        book: scripture.book,
        chapter: scripture.chapter,
        verseStart: scripture.verse_start,
        verseEnd: scripture.verse_end
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/scriptures/topics - List all topics
router.get('/topics', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { category } = req.query;
    
    let query = supabase
      .from('scripture_topics')
      .select('*')
      .order('name');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data: topics, error } = await query;
    
    if (error) throw error;
    
    res.json({ topics });
  } catch (err) {
    next(err);
  }
});

// GET /api/scriptures/topics/:id - Get scriptures for topic
router.get('/topics/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { version, limit = 10 } = req.query;
    
    // Get topic
    const { data: topic, error: topicError } = await supabase
      .from('scripture_topics')
      .select('*')
      .eq('id', id)
      .single();
    
    if (topicError || !topic) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Topic not found'
      });
    }
    
    // Get mapped scriptures
    const { data: mappings, error: mappingError } = await supabase
      .from('scripture_topic_mappings')
      .select(`
        relevance_score,
        context_notes,
        scripture:scripture_id (
          id,
          reference,
          text_esv,
          text_niv,
          text_kjv,
          text_nasb
        )
      `)
      .eq('topic_id', id)
      .order('relevance_score', { ascending: false })
      .limit(limit);
    
    if (mappingError) throw mappingError;
    
    const versionColumn = `text_${(version || req.user.preferred_bible_version || 'esv').toLowerCase()}`;
    
    res.json({
      topic,
      scriptures: mappings.map(m => ({
        id: m.scripture.id,
        reference: m.scripture.reference,
        text: m.scripture[versionColumn] || m.scripture.text_esv,
        relevanceScore: m.relevance_score,
        contextNotes: m.context_notes
      }))
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/scriptures/books - List all Bible books
router.get('/books', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { testament, includeApocrypha, includeExtraBiblical } = req.query;
    
    let query = supabase
      .from('bible_books')
      .select('*')
      .order('book_order');
    
    if (testament) {
      query = query.eq('testament', testament);
    }
    
    // By default, only canonical books
    if (includeApocrypha !== 'true') {
      query = query.eq('is_deuterocanonical', false);
    }
    
    if (includeExtraBiblical !== 'true') {
      query = query.eq('is_extra_biblical', false);
    }
    
    const { data: books, error } = await query;
    
    if (error) throw error;
    
    res.json({ books });
  } catch (err) {
    next(err);
  }
});

// GET /api/scriptures/books/:id/chapters/:chapter - Get chapter verses
router.get('/books/:bookId/chapters/:chapter', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { bookId, chapter } = req.params;
    const { version } = req.query;
    
    const { data: verses, error } = await supabase
      .from('scripture_verses')
      .select('*')
      .eq('book_id', bookId)
      .eq('chapter', chapter)
      .order('verse_start');
    
    if (error) throw error;
    
    const versionColumn = `text_${(version || req.user.preferred_bible_version || 'esv').toLowerCase()}`;
    
    res.json({
      verses: verses.map(v => ({
        id: v.id,
        reference: v.reference,
        verse: v.verse_start,
        text: v[versionColumn] || v.text_esv
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
