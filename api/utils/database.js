/**
 * Database Utilities
 * Common database operations and helpers for Yeshua Guide
 */

// ============================================================================
// SCRIPTURE UTILITIES
// ============================================================================

/**
 * Get scriptures by topic name with user preferences
 * @param {Object} supabase - Supabase client
 * @param {string} topicName - Topic name (e.g., 'Anxiety', 'Grief')
 * @param {Object} options - Options for retrieval
 * @returns {Promise<Array>} Array of scripture objects
 */
async function getScripturesByTopic(supabase, topicName, options = {}) {
  const {
    version = 'esv',
    limit = 5,
    includeApocrypha = false,
    excludeIds = []
  } = options;

  try {
    // First, get the topic ID
    const { data: topic } = await supabase
      .from('scripture_topics')
      .select('id')
      .ilike('name', topicName)
      .single();

    if (!topic) {
      return [];
    }

    // Get scripture mappings with book info
    let query = supabase
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
          text_nasb,
          text_nlt,
          book:book_id (
            name,
            testament,
            is_canonical,
            is_deuterocanonical
          )
        )
      `)
      .eq('topic_id', topic.id)
      .order('relevance_score', { ascending: false })
      .limit(limit + excludeIds.length);

    const { data: mappings, error } = await query;

    if (error) throw error;

    // Filter and format results
    const versionKey = `text_${version.toLowerCase()}`;
    
    return (mappings || [])
      .filter(m => {
        // Exclude already cited scriptures
        if (excludeIds.includes(m.scripture.id)) return false;
        
        // Filter by canonical preference
        if (!includeApocrypha && !m.scripture.book.is_canonical) return false;
        
        return true;
      })
      .slice(0, limit)
      .map(m => ({
        id: m.scripture.id,
        reference: m.scripture.reference,
        text: m.scripture[versionKey] || m.scripture.text_esv,
        relevanceScore: m.relevance_score,
        contextNotes: m.context_notes,
        book: m.scripture.book.name,
        testament: m.scripture.book.testament
      }));
  } catch (err) {
    console.error('Error fetching scriptures by topic:', err);
    return [];
  }
}

/**
 * Search scriptures with full-text search
 * @param {Object} supabase - Supabase client
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of scripture results
 */
async function searchScriptures(supabase, query, options = {}) {
  const {
    version = 'esv',
    limit = 20,
    includeApocrypha = false,
    testament = null
  } = options;

  try {
    const versionKey = `text_${version.toLowerCase()}`;
    
    let dbQuery = supabase
      .from('scripture_verses')
      .select(`
        id,
        reference,
        chapter,
        verse_start,
        verse_end,
        ${versionKey},
        book:book_id (
          id,
          name,
          abbreviation,
          testament,
          is_canonical,
          is_deuterocanonical
        )
      `)
      .textSearch('search_vector', query.trim())
      .limit(limit);

    const { data: results, error } = await dbQuery;

    if (error) throw error;

    return (results || [])
      .filter(r => {
        if (!includeApocrypha && !r.book.is_canonical) return false;
        if (testament && r.book.testament !== testament) return false;
        return true;
      })
      .map(r => ({
        id: r.id,
        reference: r.reference,
        text: r[versionKey],
        chapter: r.chapter,
        verseStart: r.verse_start,
        verseEnd: r.verse_end,
        book: {
          id: r.book.id,
          name: r.book.name,
          abbreviation: r.book.abbreviation,
          testament: r.book.testament
        }
      }));
  } catch (err) {
    console.error('Error searching scriptures:', err);
    return [];
  }
}

/**
 * Get random scripture for daily devotional
 * @param {Object} supabase - Supabase client  
 * @param {Object} options - Options
 * @returns {Promise<Object|null>} Random scripture
 */
async function getRandomScripture(supabase, options = {}) {
  const {
    topicName = null,
    version = 'esv',
    includeApocrypha = false
  } = options;

  try {
    const versionKey = `text_${version.toLowerCase()}`;

    if (topicName) {
      // Get random from specific topic
      const scriptures = await getScripturesByTopic(supabase, topicName, {
        version,
        limit: 50,
        includeApocrypha
      });

      if (scriptures.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * scriptures.length);
      return scriptures[randomIndex];
    } else {
      // Get from general pool of well-known verses
      const wellKnownTopics = ['Hope', 'Peace', 'Faith', 'Love of God', 'Grace'];
      const randomTopic = wellKnownTopics[Math.floor(Math.random() * wellKnownTopics.length)];
      
      return getRandomScripture(supabase, { topicName: randomTopic, version, includeApocrypha });
    }
  } catch (err) {
    console.error('Error getting random scripture:', err);
    return null;
  }
}

// ============================================================================
// USER UTILITIES
// ============================================================================

/**
 * Get user with all preferences
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object
 */
async function getUserWithPreferences(supabase, userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return user;
  } catch (err) {
    console.error('Error fetching user:', err);
    return null;
  }
}

/**
 * Update user streak for activity
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} activityType - Type of activity
 * @returns {Promise<Object>} Updated streak info
 */
async function updateUserStreak(supabase, userId, activityType) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Upsert today's activity
    const { error: upsertError } = await supabase
      .from('user_streaks')
      .upsert({
        user_id: userId,
        streak_date: today,
        activity_type: activityType
      }, {
        onConflict: 'user_id,streak_date,activity_type'
      });

    if (upsertError) throw upsertError;

    // Calculate current streak
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('streak_date')
      .eq('user_id', userId)
      .order('streak_date', { ascending: false })
      .limit(365);

    let currentStreak = 0;
    let checkDate = new Date(today);

    const uniqueDates = [...new Set((streaks || []).map(s => s.streak_date))];

    for (const dateStr of uniqueDates) {
      const streakDate = dateStr;
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (streakDate === checkDateStr) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Update user
    const { data: user } = await supabase
      .from('users')
      .select('longest_streak')
      .eq('id', userId)
      .single();

    const longestStreak = Math.max(currentStreak, user?.longest_streak || 0);

    await supabase
      .from('users')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { currentStreak, longestStreak };
  } catch (err) {
    console.error('Error updating streak:', err);
    return { currentStreak: 0, longestStreak: 0 };
  }
}

// ============================================================================
// ANALYTICS UTILITIES
// ============================================================================

/**
 * Log user analytics
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {Object} metrics - Metrics to log
 */
async function logUserAnalytics(supabase, userId, metrics) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Try to update existing record
    const { data: existing } = await supabase
      .from('user_analytics_daily')
      .select('*')
      .eq('user_id', userId)
      .eq('analytics_date', today)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from('user_analytics_daily')
        .update({
          conversations_started: existing.conversations_started + (metrics.conversationsStarted || 0),
          messages_sent: existing.messages_sent + (metrics.messagesSent || 0),
          devotionals_completed: existing.devotionals_completed + (metrics.devotionalsCompleted || 0),
          prayers_submitted: existing.prayers_submitted + (metrics.prayersSubmitted || 0),
          prayers_offered: existing.prayers_offered + (metrics.prayersOffered || 0),
          scriptures_viewed: existing.scriptures_viewed + (metrics.scripturesViewed || 0),
          time_in_app_minutes: existing.time_in_app_minutes + (metrics.timeInAppMinutes || 0),
          primary_mood: metrics.primaryMood || existing.primary_mood,
          primary_topics: [...new Set([...(existing.primary_topics || []), ...(metrics.topics || [])])]
        })
        .eq('id', existing.id);
    } else {
      // Create new
      await supabase
        .from('user_analytics_daily')
        .insert({
          user_id: userId,
          analytics_date: today,
          conversations_started: metrics.conversationsStarted || 0,
          messages_sent: metrics.messagesSent || 0,
          devotionals_completed: metrics.devotionalsCompleted || 0,
          prayers_submitted: metrics.prayersSubmitted || 0,
          prayers_offered: metrics.prayersOffered || 0,
          scriptures_viewed: metrics.scripturesViewed || 0,
          time_in_app_minutes: metrics.timeInAppMinutes || 0,
          primary_mood: metrics.primaryMood || null,
          primary_topics: metrics.topics || []
        });
    }
  } catch (err) {
    console.error('Error logging analytics:', err);
  }
}

// ============================================================================
// NOTIFICATION UTILITIES
// ============================================================================

/**
 * Send notification to user
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {Object} notification - Notification details
 */
async function sendNotification(supabase, userId, notification) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: notification.title,
        body: notification.body,
        notification_type: notification.type || 'general',
        action_type: notification.actionType || null,
        action_id: notification.actionId || null,
        action_data: notification.actionData || null,
        scheduled_for: notification.scheduledFor || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error sending notification:', err);
    return null;
  }
}

/**
 * Send crisis alert (for support team)
 * @param {Object} supabase - Supabase client
 * @param {Object} details - Crisis details
 */
async function sendCrisisAlert(supabase, details) {
  const { userId, conversationId, crisisLevel, triggerContent } = details;

  try {
    // Log the crisis event
    console.warn('CRISIS ALERT:', {
      userId,
      conversationId,
      crisisLevel,
      timestamp: new Date().toISOString()
    });

    // In production, this would:
    // 1. Create support ticket
    // 2. Alert on-call pastoral support
    // 3. Log for compliance

    // Send supportive notification to user
    await sendNotification(supabase, userId, {
      title: 'We\'re Here For You',
      body: 'We noticed you might be going through a difficult time. Remember, you\'re not alone. Professional support is available 24/7 at 988 (Suicide & Crisis Lifeline).',
      type: 'crisis_support',
      actionType: 'conversation',
      actionId: conversationId,
      actionData: { crisisLevel }
    });

    return true;
  } catch (err) {
    console.error('Error sending crisis alert:', err);
    return false;
  }
}

// ============================================================================
// DEVOTIONAL UTILITIES
// ============================================================================

/**
 * Get today's devotional for user
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Today's devotional
 */
async function getTodayDevotional(supabase, userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user has an active series
    const { data: progress } = await supabase
      .from('devotional_progress')
      .select(`
        *,
        series:series_id (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (progress) {
      // Get next day in series
      const { data: content } = await supabase
        .from('devotional_content')
        .select('*')
        .eq('series_id', progress.series_id)
        .eq('day_number', progress.current_day)
        .single();

      if (content) {
        return {
          type: 'series',
          series: progress.series,
          dayNumber: progress.current_day,
          totalDays: progress.series.total_days,
          ...content
        };
      }
    }

    // Get standalone devotional for today (rotating through available)
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    const { data: standalones } = await supabase
      .from('devotional_content')
      .select('*')
      .is('series_id', null)
      .order('id');

    if (standalones && standalones.length > 0) {
      const index = dayOfYear % standalones.length;
      return {
        type: 'standalone',
        ...standalones[index]
      };
    }

    return null;
  } catch (err) {
    console.error('Error getting today devotional:', err);
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Scripture
  getScripturesByTopic,
  searchScriptures,
  getRandomScripture,
  
  // User
  getUserWithPreferences,
  updateUserStreak,
  
  // Analytics
  logUserAnalytics,
  
  // Notifications
  sendNotification,
  sendCrisisAlert,
  
  // Devotional
  getTodayDevotional
};
