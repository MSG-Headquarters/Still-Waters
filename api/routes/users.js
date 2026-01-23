/**
 * Users Routes
 * Handles user profile management and relationships
 */

const express = require('express');
const router = express.Router();

// GET /api/users/me - Get current user profile
router.get('/me', async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me - Update current user profile
router.patch('/me', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const updates = {};
    
    const allowedFields = [
      'display_name', 'avatar_url', 'bio', 'denomination',
      'preferred_bible_version', 'include_apocrypha', 'include_extra_biblical',
      'daily_devotional_time', 'timezone', 'notification_preferences',
      'profile_visibility', 'prayer_requests_visible', 'show_streak',
      'anonymous_by_default'
    ];
    
    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (req.body[camelField] !== undefined) {
        updates[field] = req.body[camelField];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No updates provided'
      });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/stats - Get user statistics
router.get('/me/stats', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    
    // Get conversation count
    const { count: conversationCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId)
      .is('deleted_at', null);
    
    // Get prayer count
    const { count: prayerCount } = await supabase
      .from('prayer_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId);
    
    // Get devotional count
    const { count: devotionalCount } = await supabase
      .from('user_devotional_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId)
      .not('completed_at', 'is', null);
    
    // Get saved reflections count
    const { count: reflectionCount } = await supabase
      .from('saved_reflections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId);
    
    res.json({
      stats: {
        currentStreak: req.user.current_streak,
        longestStreak: req.user.longest_streak,
        totalConversations: conversationCount,
        totalPrayersOffered: prayerCount,
        devotionalsCompleted: devotionalCount,
        savedReflections: reflectionCount
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/friends - Get user's friends
router.get('/me/friends', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    
    const { data: relationships, error } = await supabase
      .from('user_relationships')
      .select(`
        id,
        relationship_type,
        created_at,
        requester:requester_id (id, display_name, avatar_url),
        addressee:addressee_id (id, display_name, avatar_url)
      `)
      .or(`requester_id.eq.${req.userId},addressee_id.eq.${req.userId}`)
      .eq('status', 'accepted');
    
    if (error) throw error;
    
    // Format to return the "other" person
    const friends = relationships.map(r => {
      const friend = r.requester.id === req.userId ? r.addressee : r.requester;
      return {
        id: r.id,
        friend,
        relationshipType: r.relationship_type,
        since: r.created_at
      };
    });
    
    res.json({ friends });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:userId/friend-request - Send friend request
router.post('/:userId/friend-request', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { userId } = req.params;
    
    if (userId === req.userId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Cannot send friend request to yourself'
      });
    }
    
    // Check if relationship exists
    const { data: existing } = await supabase
      .from('user_relationships')
      .select('id, status')
      .or(`and(requester_id.eq.${req.userId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${req.userId})`)
      .single();
    
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: existing.status === 'accepted' ? 'Already friends' : 'Request already exists'
      });
    }
    
    const { data: relationship, error } = await supabase
      .from('user_relationships')
      .insert({
        requester_id: req.userId,
        addressee_id: userId,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Notify the addressee
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'New friend request',
        body: `${req.user.display_name} wants to connect with you`,
        notification_type: 'friend_request',
        action_type: 'user',
        action_id: req.userId
      });
    
    res.status(201).json({ relationship });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/friend-requests/:id/accept - Accept friend request
router.post('/friend-requests/:id/accept', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    
    const { data: relationship, error } = await supabase
      .from('user_relationships')
      .update({ status: 'accepted' })
      .eq('id', id)
      .eq('addressee_id', req.userId)
      .eq('status', 'pending')
      .select()
      .single();
    
    if (error || !relationship) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Friend request not found'
      });
    }
    
    res.json({ relationship, message: 'Friend request accepted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
