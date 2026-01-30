/**
 * Admin Routes
 * Dashboard and user management for administrators
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// MIDDLEWARE: Verify admin access
// ============================================================================

const requireAdmin = async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');

    const { data: user } = await supabase
      .from('users')
      .select('is_admin, admin_level')
      .eq('id', req.userId)
      .single();

    if (!user?.is_admin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    req.adminLevel = user.admin_level;
    next();
  } catch (err) {
    next(err);
  }
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// ============================================================================
// GET /api/admin/stats - Dashboard overview stats
// ============================================================================

router.get('/stats', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');

    // Get user count
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get users created in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);

    // Get conversation count
    const { count: convoCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // Get message count
    const { count: messageCount } = await supabase
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true });

    // Get prayer count
    const { count: prayerCount } = await supabase
      .from('prayer_requests')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // Get active users (users with activity in last 7 days)
    const { data: activeUsers } = await supabase
      .from('conversations')
      .select('user_id')
      .gte('last_message_at', sevenDaysAgo);
    
    const uniqueActiveUsers = new Set(activeUsers?.map(u => u.user_id)).size;

    // Get subscription breakdown
    const { data: subscriptions } = await supabase
      .from('users')
      .select('subscription_tier');

    const tierCounts = {};
    subscriptions?.forEach(u => {
      const tier = u.subscription_tier || 'free';
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });

    res.json({
      overview: {
        total_users: userCount || 0,
        new_users_7d: newUsers || 0,
        active_users_7d: uniqueActiveUsers,
        total_conversations: convoCount || 0,
        total_messages: messageCount || 0,
        total_prayers: prayerCount || 0
      },
      subscriptions: tierCounts
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/admin/users - List all users
// ============================================================================

router.get('/users', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { 
      limit = 50, 
      offset = 0, 
      search = '', 
      sort = 'created_at', 
      order = 'desc',
      tier = ''
    } = req.query;

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        display_name,
        sw_code,
        subscription_tier,
        subscription_status,
        created_at,
        last_login_at,
        total_conversations,
        current_streak,
        longest_streak,
        is_admin,
        admin_level
      `, { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%,sw_code.ilike.%${search}%`);
    }

    // Tier filter
    if (tier) {
      query = query.eq('subscription_tier', tier);
    }

    // Sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: users, error, count } = await query;

    if (error) throw error;

    res.json({
      users,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/admin/users/:id - Get user details
// ============================================================================

router.get('/users/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }

    // Get conversation count
    const { count: convoCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .is('deleted_at', null);

    // Get message count
    const { count: messageCount } = await supabase
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', supabase.from('conversations').select('id').eq('user_id', id));

    // Get prayer count
    const { count: prayerCount } = await supabase
      .from('prayer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .is('deleted_at', null);

    // Get community connections
    const { count: connectionCount } = await supabase
      .from('user_connections')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${id},recipient_id.eq.${id}`)
      .eq('status', 'accepted');

    // Remove sensitive fields
    delete user.password_hash;

    res.json({
      user,
      stats: {
        conversations: convoCount || 0,
        prayers: prayerCount || 0,
        connections: connectionCount || 0
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PATCH /api/admin/users/:id - Update user (admin actions)
// ============================================================================

router.patch('/users/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { 
      subscription_tier, 
      subscription_status, 
      is_admin, 
      admin_level,
      display_name 
    } = req.body;

    // Only super admins can modify admin status
    if ((is_admin !== undefined || admin_level !== undefined) && req.adminLevel !== 'super') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only super admins can modify admin status'
      });
    }

    const updates = {};
    if (subscription_tier !== undefined) updates.subscription_tier = subscription_tier;
    if (subscription_status !== undefined) updates.subscription_status = subscription_status;
    if (is_admin !== undefined) updates.is_admin = is_admin;
    if (admin_level !== undefined) updates.admin_level = admin_level;
    if (display_name !== undefined) updates.display_name = display_name;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No updates provided'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/admin/users/:id/conversations - User's conversations (metadata only)
// ============================================================================

router.get('/users/:id/conversations', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Note: We only return metadata, NOT message content (privacy)
    const { data: conversations, error, count } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        message_count,
        primary_topic,
        started_at,
        last_message_at,
        deleted_at
      `, { count: 'exact' })
      .eq('user_id', id)
      .order('last_message_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      conversations,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      note: 'Message content is not included for privacy'
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/admin/activity - Recent platform activity
// ============================================================================

router.get('/activity', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { limit = 50 } = req.query;

    // Get recent conversations
    const { data: recentConvos } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        started_at,
        users!inner(display_name, sw_code)
      `)
      .order('started_at', { ascending: false })
      .limit(parseInt(limit));

    // Get recent signups
    const { data: recentSignups } = await supabase
      .from('users')
      .select('id, display_name, sw_code, created_at')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    res.json({
      recent_conversations: recentConvos?.map(c => ({
        id: c.id,
        title: c.title,
        started_at: c.started_at,
        user: c.users?.display_name,
        sw_code: c.users?.sw_code
      })),
      recent_signups: recentSignups
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// POST /api/admin/users/:id/impersonate - Get impersonation token (super admin only)
// ============================================================================

router.post('/users/:id/impersonate', async (req, res, next) => {
  try {
    if (req.adminLevel !== 'super') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only super admins can impersonate users'
      });
    }

    // This would generate a temporary token for support purposes
    // Implementation depends on your auth system
    
    res.status(501).json({
      message: 'Impersonation not yet implemented',
      note: 'This feature requires additional security review'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
