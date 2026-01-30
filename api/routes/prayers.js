/**
 * Prayers Routes
 * Handles prayer requests with community visibility
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// GET /api/prayers - Get prayers based on view type
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { view = 'journal', limit = 20, offset = 0 } = req.query;
    // view: 'journal' (my private), 'community' (friends), 'public'

    let prayers = [];

    if (view === 'journal') {
      // Get user's own prayers (all visibilities)
      const { data, error } = await supabase
        .from('prayer_requests')
        .select(`
          id,
          content,
          visibility,
          is_anonymous,
          category,
          is_answered,
          answered_at,
          answer_notes,
          created_at
        `)
        .eq('user_id', req.userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (error) throw error;
      prayers = data || [];

    } else if (view === 'community') {
      // Get prayers from friends (visibility = 'community' or 'public')
      
      // First get friend IDs
      const { data: connections } = await supabase
        .from('user_connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${req.userId},recipient_id.eq.${req.userId}`)
        .eq('status', 'accepted');

      const friendIds = connections?.map(c => 
        c.requester_id === req.userId ? c.recipient_id : c.requester_id
      ) || [];

      // Include self for community view
      friendIds.push(req.userId);

      if (friendIds.length > 0) {
        const { data, error } = await supabase
          .from('prayer_requests')
          .select(`
            id,
            user_id,
            content,
            visibility,
            is_anonymous,
            category,
            is_answered,
            created_at,
            users!inner(display_name, sw_code)
          `)
          .in('user_id', friendIds)
          .in('visibility', ['community', 'public'])
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(offset, offset + parseInt(limit) - 1);

        if (error) throw error;
        prayers = data || [];
      }

    } else if (view === 'public') {
      // Get all public prayers
      const { data, error } = await supabase
        .from('prayer_requests')
        .select(`
          id,
          user_id,
          content,
          visibility,
          is_anonymous,
          category,
          is_answered,
          created_at,
          users!inner(display_name, sw_code)
        `)
        .eq('visibility', 'public')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (error) throw error;
      prayers = data || [];
    }

    // Get prayer counts for all returned prayers
    const prayerIds = prayers.map(p => p.id);
    
    let prayCounts = {};
    let userPrayed = {};

    if (prayerIds.length > 0) {
      // Get pray counts
      const { data: interactions } = await supabase
        .from('prayer_interactions')
        .select('prayer_id')
        .in('prayer_id', prayerIds)
        .eq('interaction_type', 'prayed');

      interactions?.forEach(i => {
        prayCounts[i.prayer_id] = (prayCounts[i.prayer_id] || 0) + 1;
      });

      // Check which ones current user has prayed for
      const { data: userInteractions } = await supabase
        .from('prayer_interactions')
        .select('prayer_id')
        .in('prayer_id', prayerIds)
        .eq('user_id', req.userId)
        .eq('interaction_type', 'prayed');

      userInteractions?.forEach(i => {
        userPrayed[i.prayer_id] = true;
      });
    }

    // Format response
    const formattedPrayers = prayers.map(p => ({
      id: p.id,
      content: p.content,
      visibility: p.visibility,
      category: p.category,
      is_answered: p.is_answered,
      answered_at: p.answered_at,
      answer_notes: p.answer_notes,
      created_at: p.created_at,
      is_own: p.user_id === req.userId,
      author: p.is_anonymous ? {
        display_name: 'Anonymous',
        sw_code: null
      } : {
        display_name: p.users?.display_name || 'A fellow believer',
        sw_code: p.users?.sw_code
      },
      pray_count: prayCounts[p.id] || 0,
      has_prayed: userPrayed[p.id] || false
    }));

    res.json({ prayers: formattedPrayers });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// POST /api/prayers - Create a new prayer
// ============================================================================

router.post('/', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { content, visibility = 'private', is_anonymous = false, category } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Prayer content is required'
      });
    }

    const validVisibilities = ['private', 'community', 'public'];
    if (!validVisibilities.includes(visibility)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Visibility must be private, community, or public'
      });
    }

    const { data: prayer, error } = await supabase
      .from('prayer_requests')
      .insert({
        user_id: req.userId,
        content: content.trim(),
        visibility,
        is_anonymous,
        category: category || null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Prayer created',
      prayer
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/prayers/:id - Get single prayer
// ============================================================================

router.get('/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;

    const { data: prayer, error } = await supabase
      .from('prayer_requests')
      .select(`
        *,
        users!inner(display_name, sw_code)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !prayer) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prayer not found'
      });
    }

    // Check access
    if (prayer.visibility === 'private' && prayer.user_id !== req.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This prayer is private'
      });
    }

    if (prayer.visibility === 'community' && prayer.user_id !== req.userId) {
      // Check if connected
      const { data: connection } = await supabase
        .from('user_connections')
        .select('id')
        .or(`and(requester_id.eq.${req.userId},recipient_id.eq.${prayer.user_id}),and(requester_id.eq.${prayer.user_id},recipient_id.eq.${req.userId})`)
        .eq('status', 'accepted')
        .single();

      if (!connection) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'This prayer is only visible to the community'
        });
      }
    }

    // Get interactions
    const { data: interactions } = await supabase
      .from('prayer_interactions')
      .select('user_id')
      .eq('prayer_id', id)
      .eq('interaction_type', 'prayed');

    const hasPrayed = interactions?.some(i => i.user_id === req.userId);

    res.json({
      prayer: {
        ...prayer,
        author: prayer.is_anonymous ? {
          display_name: 'Anonymous'
        } : {
          display_name: prayer.users.display_name,
          sw_code: prayer.users.sw_code
        },
        pray_count: interactions?.length || 0,
        has_prayed: hasPrayed
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PATCH /api/prayers/:id - Update prayer
// ============================================================================

router.patch('/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { content, visibility, is_anonymous, category, is_answered, answer_notes } = req.body;

    // Verify ownership
    const { data: existing } = await supabase
      .from('prayer_requests')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prayer not found'
      });
    }

    const updates = {};
    if (content !== undefined) updates.content = content.trim();
    if (visibility !== undefined) updates.visibility = visibility;
    if (is_anonymous !== undefined) updates.is_anonymous = is_anonymous;
    if (category !== undefined) updates.category = category;
    if (is_answered !== undefined) {
      updates.is_answered = is_answered;
      if (is_answered) {
        updates.answered_at = new Date().toISOString();
      }
    }
    if (answer_notes !== undefined) updates.answer_notes = answer_notes;

    const { data: prayer, error } = await supabase
      .from('prayer_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ prayer });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// DELETE /api/prayers/:id - Soft delete prayer
// ============================================================================

router.delete('/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;

    const { data, error } = await supabase
      .from('prayer_requests')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prayer not found'
      });
    }

    res.json({ message: 'Prayer deleted' });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// POST /api/prayers/:id/pray - Mark as prayed for
// ============================================================================

router.post('/:id/pray', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;

    // Verify prayer exists and is accessible
    const { data: prayer } = await supabase
      .from('prayer_requests')
      .select('id, user_id, visibility')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (!prayer) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prayer not found'
      });
    }

    // Check access for non-public prayers
    if (prayer.visibility === 'community' && prayer.user_id !== req.userId) {
      const { data: connection } = await supabase
        .from('user_connections')
        .select('id')
        .or(`and(requester_id.eq.${req.userId},recipient_id.eq.${prayer.user_id}),and(requester_id.eq.${prayer.user_id},recipient_id.eq.${req.userId})`)
        .eq('status', 'accepted')
        .single();

      if (!connection) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot pray for this prayer'
        });
      }
    }

    // Check if already prayed
    const { data: existing } = await supabase
      .from('prayer_interactions')
      .select('id')
      .eq('prayer_id', id)
      .eq('user_id', req.userId)
      .eq('interaction_type', 'prayed')
      .single();

    if (existing) {
      return res.status(400).json({
        error: 'Already prayed',
        message: 'You have already prayed for this request'
      });
    }

    // Create interaction
    const { error } = await supabase
      .from('prayer_interactions')
      .insert({
        prayer_id: id,
        user_id: req.userId,
        interaction_type: 'prayed'
      });

    if (error) throw error;

    // Get new count
    const { data: interactions } = await supabase
      .from('prayer_interactions')
      .select('id')
      .eq('prayer_id', id)
      .eq('interaction_type', 'prayed');

    res.json({
      message: 'Prayer recorded 🙏',
      pray_count: interactions?.length || 1
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/prayers/categories - Get available categories
// ============================================================================

router.get('/meta/categories', async (req, res, next) => {
  res.json({
    categories: [
      { id: 'gratitude', name: 'Gratitude', emoji: '🙏' },
      { id: 'healing', name: 'Healing', emoji: '💚' },
      { id: 'guidance', name: 'Guidance', emoji: '🧭' },
      { id: 'family', name: 'Family', emoji: '👨‍👩‍👧‍👦' },
      { id: 'work', name: 'Work & Career', emoji: '💼' },
      { id: 'relationships', name: 'Relationships', emoji: '❤️' },
      { id: 'faith', name: 'Faith & Growth', emoji: '✨' },
      { id: 'provision', name: 'Provision', emoji: '🍞' },
      { id: 'peace', name: 'Peace & Comfort', emoji: '🕊️' },
      { id: 'other', name: 'Other', emoji: '📝' }
    ]
  });
});

module.exports = router;
