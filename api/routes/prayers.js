/**
 * Prayers Routes
 * Handles prayer requests, prayer wall, and personal prayer journal
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// PRAYER REQUESTS (Community)
// ============================================================================

// GET /api/prayers/requests - Get community prayer requests
router.get('/requests', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { limit = 20, offset = 0, category, visibility = 'community' } = req.query;
    
    let query = supabase
      .from('prayer_requests')
      .select(`
        id,
        title,
        content,
        category,
        visibility,
        is_anonymous,
        status,
        prayer_count,
        encouragement_count,
        created_at,
        user:user_id (
          id,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by visibility
    if (visibility === 'community') {
      query = query.eq('visibility', 'community');
    } else if (visibility === 'friends') {
      // Get user's friends
      const { data: relationships } = await supabase
        .from('user_relationships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${req.userId},addressee_id.eq.${req.userId}`)
        .eq('status', 'accepted');
      
      const friendIds = relationships?.map(r => 
        r.requester_id === req.userId ? r.addressee_id : r.requester_id
      ) || [];
      
      query = query.in('user_id', [...friendIds, req.userId]);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data: requests, error, count } = await query;
    
    if (error) throw error;
    
    // Hide user info for anonymous requests
    const processedRequests = requests.map(r => ({
      ...r,
      user: r.is_anonymous ? null : r.user
    }));
    
    res.json({
      requests: processedRequests,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/prayers/requests - Create prayer request
router.post('/requests', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { 
      title, 
      content, 
      category, 
      visibility = 'community', 
      isAnonymous = false,
      groupId,
      expiresAt 
    } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Prayer request content is required'
      });
    }
    
    // Validate visibility
    const validVisibilities = ['private', 'friends', 'group', 'community'];
    if (!validVisibilities.includes(visibility)) {
      return res.status(400).json({
        error: 'Bad request',
        message: `Visibility must be one of: ${validVisibilities.join(', ')}`
      });
    }
    
    // If group visibility, verify membership
    if (visibility === 'group') {
      if (!groupId) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Group ID required for group visibility'
        });
      }
      
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', req.userId)
        .eq('status', 'active')
        .single();
      
      if (!membership) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You must be a group member to post there'
        });
      }
    }
    
    const { data: request, error } = await supabase
      .from('prayer_requests')
      .insert({
        user_id: req.userId,
        title: title || null,
        content: content.trim(),
        category: category || null,
        visibility,
        is_anonymous: isAnonymous,
        group_id: groupId || null,
        expires_at: expiresAt || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
});

// GET /api/prayers/requests/:id - Get specific prayer request
router.get('/requests/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    
    const { data: request, error } = await supabase
      .from('prayer_requests')
      .select(`
        *,
        user:user_id (
          id,
          display_name,
          avatar_url
        ),
        interactions:prayer_interactions (
          id,
          interaction_type,
          message,
          is_anonymous,
          created_at,
          user:user_id (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error || !request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prayer request not found'
      });
    }
    
    // Check visibility permissions
    if (request.visibility === 'private' && request.user_id !== req.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This prayer request is private'
      });
    }
    
    // Hide user info for anonymous
    const processedRequest = {
      ...request,
      user: request.is_anonymous ? null : request.user,
      interactions: request.interactions?.map(i => ({
        ...i,
        user: i.is_anonymous ? null : i.user
      }))
    };
    
    res.json({ request: processedRequest });
  } catch (err) {
    next(err);
  }
});

// POST /api/prayers/requests/:id/pray - Pray for a request
router.post('/requests/:id/pray', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { message, isAnonymous = false } = req.body;
    
    // Verify request exists
    const { data: request } = await supabase
      .from('prayer_requests')
      .select('id, user_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prayer request not found'
      });
    }
    
    // Create interaction
    const { data: interaction, error } = await supabase
      .from('prayer_interactions')
      .insert({
        prayer_request_id: id,
        user_id: req.userId,
        interaction_type: 'prayed',
        message: message || null,
        is_anonymous: isAnonymous
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update user's total prayers offered
    await supabase
      .from('users')
      .update({
        total_prayers_offered: req.user.total_prayers_offered + 1
      })
      .eq('id', req.userId);
    
    // Update prayer streak
    await updatePrayerStreak(supabase, req.userId);
    
    // Create notification for request owner (if not anonymous and not self)
    if (!isAnonymous && request.user_id !== req.userId) {
      await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          title: 'Someone prayed for you',
          body: `${req.user.display_name} prayed for your request`,
          notification_type: 'prayer_received',
          action_type: 'prayer_request',
          action_id: id
        });
    }
    
    res.status(201).json({ interaction });
  } catch (err) {
    next(err);
  }
});

// POST /api/prayers/requests/:id/encourage - Send encouragement
router.post('/requests/:id/encourage', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { message, isAnonymous = false } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Encouragement message is required'
      });
    }
    
    // Verify request exists
    const { data: request } = await supabase
      .from('prayer_requests')
      .select('id, user_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prayer request not found'
      });
    }
    
    // Create interaction
    const { data: interaction, error } = await supabase
      .from('prayer_interactions')
      .insert({
        prayer_request_id: id,
        user_id: req.userId,
        interaction_type: 'encouraged',
        message: message.trim(),
        is_anonymous: isAnonymous
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Create notification for request owner
    if (request.user_id !== req.userId) {
      await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          title: 'You received encouragement',
          body: isAnonymous 
            ? 'Someone sent you an encouraging message'
            : `${req.user.display_name} sent you encouragement`,
          notification_type: 'encouragement_received',
          action_type: 'prayer_request',
          action_id: id
        });
    }
    
    res.status(201).json({ interaction });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/prayers/requests/:id/answered - Mark as answered
router.patch('/requests/:id/answered', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { testimony } = req.body;
    
    const { data: request, error } = await supabase
      .from('prayer_requests')
      .update({
        status: 'answered',
        answered_at: new Date().toISOString(),
        answered_testimony: testimony || null
      })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prayer request not found or not yours'
      });
    }
    
    res.json({ request });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/prayers/requests/:id - Delete prayer request
router.delete('/requests/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('prayer_requests')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prayer request not found or not yours'
      });
    }
    
    res.json({ message: 'Prayer request deleted', id });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PRAYER JOURNAL (Personal)
// ============================================================================

// GET /api/prayers/journal - Get personal prayer journal
router.get('/journal', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { limit = 20, offset = 0, entryType, answered } = req.query;
    
    let query = supabase
      .from('prayer_journal')
      .select(`
        *,
        scripture:scripture_id (
          id,
          reference
        )
      `, { count: 'exact' })
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (entryType) {
      query = query.eq('entry_type', entryType);
    }
    
    if (answered !== undefined) {
      query = query.eq('is_answered', answered === 'true');
    }
    
    const { data: entries, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      entries,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/prayers/journal - Create journal entry
router.post('/journal', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { 
      title, 
      content, 
      entryType = 'prayer', 
      scriptureId, 
      scriptureReference,
      sharedToGroupId 
    } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Journal entry content is required'
      });
    }
    
    const validTypes = ['prayer', 'gratitude', 'confession', 'intercession', 'praise'];
    if (!validTypes.includes(entryType)) {
      return res.status(400).json({
        error: 'Bad request',
        message: `Entry type must be one of: ${validTypes.join(', ')}`
      });
    }
    
    const { data: entry, error } = await supabase
      .from('prayer_journal')
      .insert({
        user_id: req.userId,
        title: title || null,
        content: content.trim(),
        entry_type: entryType,
        scripture_id: scriptureId || null,
        scripture_reference: scriptureReference || null,
        shared_to_group_id: sharedToGroupId || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update prayer streak
    await updatePrayerStreak(supabase, req.userId);
    
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
});

// GET /api/prayers/journal/:id - Get specific journal entry
router.get('/journal/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    
    const { data: entry, error } = await supabase
      .from('prayer_journal')
      .select(`
        *,
        scripture:scripture_id (
          id,
          reference,
          text_esv
        )
      `)
      .eq('id', id)
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .single();
    
    if (error || !entry) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Journal entry not found'
      });
    }
    
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/prayers/journal/:id - Update journal entry
router.patch('/journal/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { title, content, isAnswered, answeredNotes } = req.body;
    
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (isAnswered !== undefined) {
      updates.is_answered = isAnswered;
      if (isAnswered) {
        updates.answered_at = new Date().toISOString();
        if (answeredNotes) updates.answered_notes = answeredNotes;
      }
    }
    
    const { data: entry, error } = await supabase
      .from('prayer_journal')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!entry) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Journal entry not found'
      });
    }
    
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/prayers/journal/:id - Delete journal entry
router.delete('/journal/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('prayer_journal')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Journal entry not found'
      });
    }
    
    res.json({ message: 'Journal entry deleted', id });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// USER'S OWN REQUESTS
// ============================================================================

// GET /api/prayers/my-requests - Get user's own prayer requests
router.get('/my-requests', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { limit = 20, offset = 0, status } = req.query;
    
    let query = supabase
      .from('prayer_requests')
      .select(`
        *,
        interactions:prayer_interactions (
          id,
          interaction_type,
          created_at
        )
      `, { count: 'exact' })
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: requests, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      requests,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function updatePrayerStreak(supabase, userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from('user_streaks')
      .select('id')
      .eq('user_id', userId)
      .eq('streak_date', today)
      .eq('activity_type', 'prayer')
      .single();
    
    if (!existing) {
      await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          streak_date: today,
          activity_type: 'prayer'
        });
    }
  } catch (err) {
    console.error('Error updating prayer streak:', err);
  }
}

module.exports = router;
