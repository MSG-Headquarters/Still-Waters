/**
 * Groups Routes
 * Handles Bible study groups, membership, messages, and events
 */

const express = require('express');
const router = express.Router();
const { requireGroupAdmin, requireGroupMember } = require('../middleware/auth');

// ============================================================================
// GROUP CRUD
// ============================================================================

// GET /api/groups - List groups (public + user's groups)
router.get('/', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { limit = 20, offset = 0, filter = 'all' } = req.query;
    
    let query;
    
    if (filter === 'mine') {
      // Get user's groups
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', req.userId)
        .eq('status', 'active');
      
      const groupIds = memberships?.map(m => m.group_id) || [];
      
      query = supabase
        .from('study_groups')
        .select(`
          *,
          current_book:current_book_id (name, abbreviation)
        `)
        .in('id', groupIds)
        .is('deleted_at', null);
    } else {
      // Get public groups
      query = supabase
        .from('study_groups')
        .select(`
          *,
          current_book:current_book_id (name, abbreviation)
        `)
        .eq('is_public', true)
        .is('deleted_at', null);
    }
    
    const { data: groups, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      groups,
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

// POST /api/groups - Create a new group
router.post('/', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const {
      name,
      description,
      avatarEmoji,
      coverImageUrl,
      currentBookId,
      currentStudyTopic,
      studyPace = 'weekly',
      isPublic = false,
      requiresApproval = true,
      maxMembers = 20
    } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Group name is required'
      });
    }
    
    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .insert({
        name: name.trim(),
        description: description || null,
        avatar_emoji: avatarEmoji || '📖',
        cover_image_url: coverImageUrl || null,
        current_book_id: currentBookId || null,
        current_study_topic: currentStudyTopic || null,
        study_pace: studyPace,
        is_public: isPublic,
        requires_approval: requiresApproval,
        max_members: maxMembers,
        created_by: req.userId,
        member_count: 1
      })
      .select()
      .single();
    
    if (groupError) throw groupError;
    
    // Add creator as owner
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: req.userId,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      });
    
    if (memberError) throw memberError;
    
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/:id - Get group details
router.get('/:groupId', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId } = req.params;
    
    const { data: group, error } = await supabase
      .from('study_groups')
      .select(`
        *,
        current_book:current_book_id (id, name, abbreviation, chapter_count),
        creator:created_by (id, display_name, avatar_url)
      `)
      .eq('id', groupId)
      .is('deleted_at', null)
      .single();
    
    if (error || !group) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Group not found'
      });
    }
    
    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('role, status')
      .eq('group_id', groupId)
      .eq('user_id', req.userId)
      .single();
    
    // Get member list (limited)
    const { data: members } = await supabase
      .from('group_members')
      .select(`
        role,
        joined_at,
        user:user_id (id, display_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })
      .limit(10);
    
    res.json({
      group,
      membership: membership || null,
      members: members || [],
      isMember: !!membership && membership.status === 'active'
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/groups/:groupId - Update group (admin only)
router.patch('/:groupId', requireGroupAdmin, async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId } = req.params;
    const updates = {};
    
    const allowedFields = [
      'name', 'description', 'avatar_emoji', 'cover_image_url',
      'current_book_id', 'current_study_topic', 'study_pace',
      'is_public', 'requires_approval', 'max_members'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Convert camelCase to snake_case
        const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates[snakeField] = req.body[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No updates provided'
      });
    }
    
    const { data: group, error } = await supabase
      .from('study_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ group });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/groups/:groupId - Delete group (owner only)
router.delete('/:groupId', requireGroupAdmin, async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId } = req.params;
    
    // Verify user is owner
    if (req.groupMembership.role !== 'owner') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the group owner can delete the group'
      });
    }
    
    const { error } = await supabase
      .from('study_groups')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', groupId);
    
    if (error) throw error;
    
    res.json({ message: 'Group deleted', id: groupId });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// MEMBERSHIP
// ============================================================================

// POST /api/groups/:groupId/join - Request to join group
router.post('/:groupId/join', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId } = req.params;
    
    // Check if group exists
    const { data: group } = await supabase
      .from('study_groups')
      .select('id, requires_approval, max_members, member_count')
      .eq('id', groupId)
      .is('deleted_at', null)
      .single();
    
    if (!group) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Group not found'
      });
    }
    
    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', req.userId)
      .single();
    
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: existing.status === 'active' 
          ? 'Already a member' 
          : 'Request already pending'
      });
    }
    
    // Check capacity
    if (group.member_count >= group.max_members) {
      return res.status(400).json({
        error: 'Group full',
        message: 'This group has reached its member limit'
      });
    }
    
    // Create membership
    const status = group.requires_approval ? 'pending' : 'active';
    
    const { data: membership, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: req.userId,
        role: 'member',
        status,
        joined_at: status === 'active' ? new Date().toISOString() : null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Notify group admins if pending
    if (status === 'pending') {
      const { data: admins } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .in('role', ['owner', 'admin']);
      
      for (const admin of admins || []) {
        await supabase
          .from('notifications')
          .insert({
            user_id: admin.user_id,
            title: 'New join request',
            body: `${req.user.display_name} wants to join your group`,
            notification_type: 'group_join_request',
            action_type: 'group',
            action_id: groupId
          });
      }
    }
    
    res.status(201).json({
      membership,
      message: status === 'pending' 
        ? 'Join request sent' 
        : 'Successfully joined group'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:groupId/members/:userId/approve - Approve join request
router.post('/:groupId/members/:userId/approve', requireGroupAdmin, async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId, userId } = req.params;
    
    const { data: membership, error } = await supabase
      .from('group_members')
      .update({
        status: 'active',
        joined_at: new Date().toISOString()
      })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select()
      .single();
    
    if (error || !membership) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Pending membership not found'
      });
    }
    
    // Notify the user
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Join request approved',
        body: 'Your request to join the group was approved!',
        notification_type: 'group_approved',
        action_type: 'group',
        action_id: groupId
      });
    
    res.json({ membership, message: 'Member approved' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/groups/:groupId/members/:userId - Remove member or leave
router.delete('/:groupId/members/:userId', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId, userId } = req.params;
    
    // Check permissions
    const isRemovingSelf = userId === req.userId;
    
    if (!isRemovingSelf) {
      // Need admin permissions to remove others
      const { data: adminCheck } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', req.userId)
        .single();
      
      if (!adminCheck || !['owner', 'admin'].includes(adminCheck.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only admins can remove members'
        });
      }
    }
    
    // Can't remove the owner
    const { data: targetMember } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
    
    if (targetMember?.role === 'owner' && isRemovingSelf) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Owner cannot leave. Transfer ownership first.'
      });
    }
    
    const { error } = await supabase
      .from('group_members')
      .update({ status: 'removed' })
      .eq('group_id', groupId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.json({
      message: isRemovingSelf ? 'Left group' : 'Member removed',
      userId
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// MESSAGES
// ============================================================================

// GET /api/groups/:groupId/messages - Get group messages
router.get('/:groupId/messages', requireGroupMember, async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId } = req.params;
    const { limit = 50, before } = req.query;
    
    let query = supabase
      .from('group_messages')
      .select(`
        *,
        user:user_id (id, display_name, avatar_url),
        scripture:scripture_id (id, reference)
      `)
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (before) {
      query = query.lt('created_at', before);
    }
    
    const { data: messages, error } = await query;
    
    if (error) throw error;
    
    // Update last active
    await supabase
      .from('group_members')
      .update({ last_active_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .eq('user_id', req.userId);
    
    res.json({ messages: messages.reverse() }); // Return in chronological order
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:groupId/messages - Send message
router.post('/:groupId/messages', requireGroupMember, async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId } = req.params;
    const { 
      content, 
      messageType = 'text', 
      scriptureId, 
      scriptureReference,
      parentMessageId 
    } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Message content is required'
      });
    }
    
    const { data: message, error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: req.userId,
        content: content.trim(),
        message_type: messageType,
        scripture_id: scriptureId || null,
        scripture_reference: scriptureReference || null,
        parent_message_id: parentMessageId || null
      })
      .select(`
        *,
        user:user_id (id, display_name, avatar_url)
      `)
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:groupId/messages/:messageId/react - React to message
router.post('/:groupId/messages/:messageId/react', requireGroupMember, async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId, messageId } = req.params;
    const { emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Emoji is required'
      });
    }
    
    // Check if already reacted with this emoji
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', req.userId)
      .eq('emoji', emoji)
      .single();
    
    if (existing) {
      // Remove reaction
      await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id);
      
      return res.json({ message: 'Reaction removed', action: 'removed' });
    }
    
    // Add reaction
    const { data: reaction, error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: req.userId,
        emoji
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update message reaction counts
    const { data: counts } = await supabase
      .from('message_reactions')
      .select('emoji')
      .eq('message_id', messageId);
    
    const reactionCounts = {};
    for (const r of counts || []) {
      reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
    }
    
    await supabase
      .from('group_messages')
      .update({ reaction_counts: reactionCounts })
      .eq('id', messageId);
    
    res.status(201).json({ reaction, action: 'added' });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// EVENTS
// ============================================================================

// GET /api/groups/:groupId/events - Get group events
router.get('/:groupId/events', requireGroupMember, async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId } = req.params;
    const { upcoming = true } = req.query;
    
    let query = supabase
      .from('group_events')
      .select(`
        *,
        creator:created_by (id, display_name, avatar_url),
        rsvps:event_rsvps (
          status,
          user:user_id (id, display_name, avatar_url)
        )
      `)
      .eq('group_id', groupId)
      .is('cancelled_at', null)
      .order('scheduled_at', { ascending: true });
    
    if (upcoming === 'true' || upcoming === true) {
      query = query.gte('scheduled_at', new Date().toISOString());
    }
    
    const { data: events, error } = await query;
    
    if (error) throw error;
    
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:groupId/events - Create event
router.post('/:groupId/events', requireGroupAdmin, async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { groupId } = req.params;
    const {
      title,
      description,
      eventType = 'bible_study',
      scheduledAt,
      durationMinutes = 60,
      timezone,
      isVirtual = true,
      meetingUrl,
      locationAddress,
      scriptureFocus,
      discussionQuestions,
      maxAttendees
    } = req.body;
    
    if (!title || !scheduledAt) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Title and scheduled time are required'
      });
    }
    
    const { data: event, error } = await supabase
      .from('group_events')
      .insert({
        group_id: groupId,
        created_by: req.userId,
        title: title.trim(),
        description: description || null,
        event_type: eventType,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        timezone: timezone || req.user.timezone,
        is_virtual: isVirtual,
        meeting_url: meetingUrl || null,
        location_address: locationAddress || null,
        scripture_focus: scriptureFocus || null,
        discussion_questions: discussionQuestions || null,
        max_attendees: maxAttendees || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Auto-RSVP creator as going
    await supabase
      .from('event_rsvps')
      .insert({
        event_id: event.id,
        user_id: req.userId,
        status: 'going'
      });
    
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:groupId/events/:eventId/rsvp - RSVP to event
router.post('/:groupId/events/:eventId/rsvp', requireGroupMember, async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { eventId } = req.params;
    const { status = 'going' } = req.body;
    
    const validStatuses = ['going', 'maybe', 'not_going'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad request',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Upsert RSVP
    const { data: rsvp, error } = await supabase
      .from('event_rsvps')
      .upsert({
        event_id: eventId,
        user_id: req.userId,
        status,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'event_id,user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ rsvp });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
