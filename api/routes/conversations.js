/**
 * Conversations Routes
 * Handles AI-powered faith conversations
 */

const express = require('express');
const router = express.Router();
const {
  CRISIS_LEVELS,
  detectCrisisSignals,
  detectTopics,
  generateResponse
} = require('../services/aiService');

// ============================================================================
// GET /api/conversations - List user's conversations
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { limit = 20, offset = 0, includeDeleted = false } = req.query;

    let query = supabase
      .from('conversations')
      .select(`
        id,
        title,
        initial_mood,
        primary_topic,
        message_count,
        scriptures_referenced,
        started_at,
        last_message_at,
        created_at,
        updated_at,
        deleted_at
      `)
      .eq('user_id', req.userId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (includeDeleted !== 'true' && includeDeleted !== true) {
      query = query.is('deleted_at', null);
    }

    const { data: conversations, error, count } = await query;

    if (error) throw error;

    res.json({
      conversations,
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
// POST /api/conversations - Start a new conversation
// ============================================================================

router.post('/', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { mood, topic, title } = req.body;

    // Validate mood if provided
    const validMoods = ['grateful', 'struggling', 'seeking', 'anxious', 'strong', 'questioning'];
    if (mood && !validMoods.includes(mood)) {
      return res.status(400).json({
        error: 'Invalid mood',
        message: `Mood must be one of: ${validMoods.join(', ')}`
      });
    }

    // Create conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: req.userId,
        title: title || 'New Conversation',
        initial_mood: mood || null,
        primary_topic: topic || null,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update user streak
    await updateUserStreak(supabase, req.userId, 'conversation');

    res.status(201).json({
      conversation,
      message: 'Conversation started'
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/conversations/:id - Get conversation with messages
// ============================================================================

router.get('/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { includeMessages = true } = req.query;

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Conversation not found'
      });
    }

    let messages = [];
    if (includeMessages === 'true' || includeMessages === true) {
      const { data: msgData, error: msgError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('sequence_number', { ascending: true });

      if (msgError) throw msgError;
      messages = msgData;
    }

    res.json({
      conversation,
      messages
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// POST /api/conversations/:id/messages - Send a message (AI response)
// ============================================================================

router.post('/:id/messages', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const anthropic = req.app.get('anthropic');
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Message content is required'
      });
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Conversation not found'
      });
    }

    // Get message history
    const { data: messageHistory, error: msgError } = await supabase
      .from('conversation_messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('sequence_number', { ascending: true });

    if (msgError) throw msgError;

    // Get next sequence number
    const nextSequence = (messageHistory?.length || 0) + 1;

    // Detect topics for scripture retrieval
    const topics = detectTopics(content, conversation.primary_topic);

    // Get relevant scriptures
    const scriptures = await getRelevantScriptures(supabase, topics, req.user);

    // Save user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: id,
        role: 'user',
        content: content.trim(),
        sequence_number: nextSequence
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Generate AI response
    const aiResult = await generateResponse(anthropic, {
      user: req.user,
      conversation,
      messageHistory: messageHistory || [],
      newMessage: content,
      scriptures
    });

    // Save assistant message
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: id,
        role: 'assistant',
        content: aiResult.content,
        sequence_number: nextSequence + 1,
        scriptures_cited: aiResult.scriptures,
        topics_addressed: aiResult.topics
      })
      .select()
      .single();

    if (assistantMsgError) throw assistantMsgError;

    // Update conversation metadata
    await supabase
      .from('conversations')
      .update({
        message_count: nextSequence + 1,
        last_message_at: new Date().toISOString(),
        primary_topic: conversation.primary_topic || aiResult.topics[0],
        scriptures_referenced: (conversation.scriptures_referenced || 0) + aiResult.scriptures.length
      })
      .eq('id', id);

    // If flagged for review, create notification for support team
    if (aiResult.flagForReview) {
      await flagConversationForReview(supabase, id, req.userId, aiResult.crisisLevel);
    }

    // Update user stats
    await supabase
      .from('users')
      .update({
        total_conversations: req.user.total_conversations + 1
      })
      .eq('id', req.userId);

    res.status(201).json({
      userMessage,
      assistantMessage,
      crisisLevel: aiResult.crisisLevel,
      flaggedForReview: aiResult.flagForReview
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PATCH /api/conversations/:id - Update conversation (title, mood, topic, deleted_at)
// ============================================================================

router.patch('/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { title, mood, topic, deleted_at } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (mood !== undefined) updates.initial_mood = mood;
    if (topic !== undefined) updates.primary_topic = topic;
    if (deleted_at !== undefined) updates.deleted_at = deleted_at;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No updates provided'
      });
    }

    // For soft delete/restore, we need different query
    let query = supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId);

    // Only filter by deleted_at if we're not trying to restore
    if (deleted_at !== null) {
      query = query.is('deleted_at', null);
    }

    const { data: conversation, error } = await query.select().single();

    if (error) {
      console.error('PATCH error:', error);
      throw error;
    }

    if (!conversation) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Conversation not found'
      });
    }

    res.json({ conversation });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// DELETE /api/conversations/:id - Soft delete conversation
// ============================================================================

router.delete('/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;

    const { data, error } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Conversation not found'
      });
    }

    res.json({
      message: 'Conversation deleted',
      id: id
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// POST /api/conversations/:id/save-reflection - Save a message as reflection
// ============================================================================

router.post('/:id/save-reflection', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { messageId, title, personalNotes, tags } = req.body;

    // Get the message
    const { data: message, error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('id', messageId)
      .eq('conversation_id', id)
      .single();

    if (msgError || !message) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Message not found'
      });
    }

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (!conversation) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Not your conversation'
      });
    }

    // Create saved reflection
    const { data: reflection, error } = await supabase
      .from('saved_reflections')
      .insert({
        user_id: req.userId,
        message_id: messageId,
        conversation_id: id,
        title: title || 'Saved Reflection',
        content: message.content,
        scripture_reference: message.scriptures_cited?.[0] || null,
        personal_notes: personalNotes || null,
        tags: tags || []
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ reflection });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get relevant scriptures based on detected topics
 */
async function getRelevantScriptures(supabase, topics, user) {
  try {
    // Get topic IDs
    const { data: topicRecords } = await supabase
      .from('scripture_topics')
      .select('id, name')
      .in('name', topics.map(t => t.charAt(0).toUpperCase() + t.slice(1)));

    if (!topicRecords || topicRecords.length === 0) {
      return [];
    }

    const topicIds = topicRecords.map(t => t.id);

    // Get scripture mappings
    const { data: mappings } = await supabase
      .from('scripture_topic_mappings')
      .select('scripture_id, relevance_score')
      .in('topic_id', topicIds)
      .order('relevance_score', { ascending: false })
      .limit(5);

    if (!mappings || mappings.length === 0) {
      return [];
    }

    // Get scripture texts
    const scriptureIds = mappings.map(m => m.scripture_id);
    const versionColumn = `text_${user.preferred_bible_version?.toLowerCase() || 'esv'}`;

    const { data: scriptures } = await supabase
      .from('scripture_verses')
      .select(`id, reference, ${versionColumn}`)
      .in('id', scriptureIds);

    return (scriptures || []).map(s => ({
      id: s.id,
      reference: s.reference,
      text: s[versionColumn] || s.text_esv
    }));
  } catch (err) {
    console.error('Error fetching scriptures:', err);
    return [];
  }
}

/**
 * Update user's streak
 */
async function updateUserStreak(supabase, userId, activityType) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if already logged today
    const { data: existing } = await supabase
      .from('user_streaks')
      .select('id')
      .eq('user_id', userId)
      .eq('streak_date', today)
      .eq('activity_type', activityType)
      .single();

    if (!existing) {
      // Log today's activity
      await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          streak_date: today,
          activity_type: activityType
        });

      // Calculate current streak
      const { data: streaks } = await supabase
        .from('user_streaks')
        .select('streak_date')
        .eq('user_id', userId)
        .order('streak_date', { ascending: false })
        .limit(365);

      let currentStreak = 0;
      let checkDate = new Date(today);

      for (const streak of streaks || []) {
        const streakDate = new Date(streak.streak_date);
        if (streakDate.toISOString().split('T')[0] === checkDate.toISOString().split('T')[0]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Update user streak
      const { data: user } = await supabase
        .from('users')
        .select('longest_streak')
        .eq('id', userId)
        .single();

      await supabase
        .from('users')
        .update({
          current_streak: currentStreak,
          longest_streak: Math.max(currentStreak, user?.longest_streak || 0)
        })
        .eq('id', userId);
    }
  } catch (err) {
    console.error('Error updating streak:', err);
  }
}

/**
 * Flag conversation for human review
 */
async function flagConversationForReview(supabase, conversationId, userId, crisisLevel) {
  try {
    // In production, this would:
    // 1. Create a support ticket
    // 2. Send notification to support team
    // 3. Log for compliance

    console.warn('CRISIS FLAG:', {
      conversationId,
      userId,
      crisisLevel,
      timestamp: new Date().toISOString()
    });

    // Create a system notification (would go to support dashboard)
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Your conversation has been noted',
        body: 'We noticed you might be going through a difficult time. Remember, professional support is available: 988 Suicide & Crisis Lifeline.',
        notification_type: 'crisis_support',
        action_type: 'conversation',
        action_id: conversationId,
        action_data: { crisisLevel }
      });
  } catch (err) {
    console.error('Error flagging conversation:', err);
  }
}

module.exports = router;
