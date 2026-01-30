/**
 * Community Routes
 * Handles friend connections via SW codes
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// GET /api/community/me - Get current user's SW code and stats
// ============================================================================

router.get('/me', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');

    const { data: user, error } = await supabase
      .from('users')
      .select('id, sw_code, display_name')
      .eq('id', req.userId)
      .single();

    if (error) throw error;

    // Get connection counts
    const { data: connections } = await supabase
      .from('user_connections')
      .select('id, status')
      .or(`requester_id.eq.${req.userId},recipient_id.eq.${req.userId}`);

    const accepted = connections?.filter(c => c.status === 'accepted').length || 0;
    const pending = connections?.filter(c => c.status === 'pending').length || 0;

    res.json({
      sw_code: user.sw_code,
      display_name: user.display_name,
      community_size: accepted,
      pending_requests: pending
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/community/connections - List all connections
// ============================================================================

router.get('/connections', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { status = 'accepted' } = req.query;

    // Get connections where user is either requester or recipient
    const { data: connections, error } = await supabase
      .from('user_connections')
      .select(`
        id,
        status,
        created_at,
        accepted_at,
        requester_id,
        recipient_id
      `)
      .or(`requester_id.eq.${req.userId},recipient_id.eq.${req.userId}`)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get friend details
    const friendIds = connections.map(c => 
      c.requester_id === req.userId ? c.recipient_id : c.requester_id
    );

    const { data: friends } = await supabase
      .from('users')
      .select('id, display_name, sw_code')
      .in('id', friendIds);

    const friendMap = {};
    friends?.forEach(f => friendMap[f.id] = f);

    const result = connections.map(c => {
      const friendId = c.requester_id === req.userId ? c.recipient_id : c.requester_id;
      const friend = friendMap[friendId] || {};
      return {
        id: c.id,
        status: c.status,
        connected_since: c.accepted_at,
        is_requester: c.requester_id === req.userId,
        friend: {
          id: friendId,
          display_name: friend.display_name || 'Unknown',
          sw_code: friend.sw_code
        }
      };
    });

    res.json({ connections: result });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/community/pending - Get pending friend requests
// ============================================================================

router.get('/pending', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');

    // Get incoming requests (where user is recipient)
    const { data: incoming, error: inErr } = await supabase
      .from('user_connections')
      .select(`
        id,
        created_at,
        requester_id
      `)
      .eq('recipient_id', req.userId)
      .eq('status', 'pending');

    if (inErr) throw inErr;

    // Get requester details
    const requesterIds = incoming.map(r => r.requester_id);
    const { data: requesters } = await supabase
      .from('users')
      .select('id, display_name, sw_code')
      .in('id', requesterIds);

    const requesterMap = {};
    requesters?.forEach(r => requesterMap[r.id] = r);

    const incomingRequests = incoming.map(r => ({
      id: r.id,
      created_at: r.created_at,
      from: {
        id: r.requester_id,
        display_name: requesterMap[r.requester_id]?.display_name || 'Unknown',
        sw_code: requesterMap[r.requester_id]?.sw_code
      }
    }));

    // Get outgoing requests (where user is requester)
    const { data: outgoing, error: outErr } = await supabase
      .from('user_connections')
      .select(`
        id,
        created_at,
        recipient_id
      `)
      .eq('requester_id', req.userId)
      .eq('status', 'pending');

    if (outErr) throw outErr;

    const recipientIds = outgoing.map(r => r.recipient_id);
    const { data: recipients } = await supabase
      .from('users')
      .select('id, display_name, sw_code')
      .in('id', recipientIds);

    const recipientMap = {};
    recipients?.forEach(r => recipientMap[r.id] = r);

    const outgoingRequests = outgoing.map(r => ({
      id: r.id,
      created_at: r.created_at,
      to: {
        id: r.recipient_id,
        display_name: recipientMap[r.recipient_id]?.display_name || 'Unknown',
        sw_code: recipientMap[r.recipient_id]?.sw_code
      }
    }));

    res.json({
      incoming: incomingRequests,
      outgoing: outgoingRequests
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// POST /api/community/connect - Send friend request by SW code
// ============================================================================

router.post('/connect', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { sw_code } = req.body;

    if (!sw_code) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'SW code is required'
      });
    }

    // Normalize the code (uppercase, trim)
    const normalizedCode = sw_code.toUpperCase().trim();

    // Find user by SW code
    const { data: targetUser, error: findError } = await supabase
      .from('users')
      .select('id, display_name, sw_code')
      .eq('sw_code', normalizedCode)
      .single();

    if (findError || !targetUser) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No user found with that SW code'
      });
    }

    // Can't add yourself
    if (targetUser.id === req.userId) {
      return res.status(400).json({
        error: 'Bad request',
        message: "You can't add yourself as a friend"
      });
    }

    // Check if connection already exists (in either direction)
    const { data: existing } = await supabase
      .from('user_connections')
      .select('id, status')
      .or(`and(requester_id.eq.${req.userId},recipient_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},recipient_id.eq.${req.userId})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({
          error: 'Already connected',
          message: 'You are already connected with this person'
        });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({
          error: 'Request pending',
          message: 'A friend request is already pending'
        });
      }
      if (existing.status === 'blocked') {
        return res.status(400).json({
          error: 'Cannot connect',
          message: 'Unable to connect with this user'
        });
      }
    }

    // Create connection request
    const { data: connection, error: createError } = await supabase
      .from('user_connections')
      .insert({
        requester_id: req.userId,
        recipient_id: targetUser.id,
        status: 'pending'
      })
      .select()
      .single();

    if (createError) throw createError;

    res.status(201).json({
      message: 'Friend request sent',
      connection: {
        id: connection.id,
        to: {
          display_name: targetUser.display_name,
          sw_code: targetUser.sw_code
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PATCH /api/community/connections/:id - Accept/decline request
// ============================================================================

router.patch('/connections/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { action } = req.body; // 'accept', 'decline', 'block'

    if (!['accept', 'decline', 'block'].includes(action)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Action must be accept, decline, or block'
      });
    }

    // Verify user is the recipient of this request
    const { data: connection, error: findError } = await supabase
      .from('user_connections')
      .select('*')
      .eq('id', id)
      .eq('recipient_id', req.userId)
      .eq('status', 'pending')
      .single();

    if (findError || !connection) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Friend request not found'
      });
    }

    const updates = {
      status: action === 'accept' ? 'accepted' : action === 'block' ? 'blocked' : 'declined',
      updated_at: new Date().toISOString()
    };

    if (action === 'accept') {
      updates.accepted_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from('user_connections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: action === 'accept' ? 'Friend request accepted!' : `Request ${action}ed`,
      connection: updated
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// DELETE /api/community/connections/:id - Remove connection
// ============================================================================

router.delete('/connections/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;

    // Verify user is part of this connection
    const { data: connection, error: findError } = await supabase
      .from('user_connections')
      .select('*')
      .eq('id', id)
      .or(`requester_id.eq.${req.userId},recipient_id.eq.${req.userId}`)
      .single();

    if (findError || !connection) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Connection not found'
      });
    }

    // Delete the connection
    const { error: deleteError } = await supabase
      .from('user_connections')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Connection removed' });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/community/search/:code - Look up user by SW code
// ============================================================================

router.get('/search/:code', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { code } = req.params;

    const normalizedCode = code.toUpperCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, display_name, sw_code')
      .eq('sw_code', normalizedCode)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No user found with that SW code'
      });
    }

    // Check if already connected
    const { data: connection } = await supabase
      .from('user_connections')
      .select('id, status')
      .or(`and(requester_id.eq.${req.userId},recipient_id.eq.${user.id}),and(requester_id.eq.${user.id},recipient_id.eq.${req.userId})`)
      .single();

    res.json({
      user: {
        display_name: user.display_name,
        sw_code: user.sw_code,
        is_self: user.id === req.userId
      },
      connection_status: connection?.status || null
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
