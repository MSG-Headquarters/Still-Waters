/**
 * Devotionals Routes
 * Handles daily devotional content and user engagement
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// GET /api/devotionals/today - Get today's devotional
// ============================================================================

router.get('/today', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    
    // Get day of year for rotation
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Try to get scheduled devotional first
    const today = now.toISOString().split('T')[0];
    
    let { data: devotional, error } = await supabase
      .from('devotionals')
      .select(`
        *,
        scripture:scripture_id (
          id,
          reference,
          text_esv,
          text_niv,
          text_kjv,
          text_nasb
        )
      `)
      .eq('scheduled_date', today)
      .eq('is_active', true)
      .single();
    
    // If no scheduled devotional, get by day of year rotation
    if (!devotional) {
      const { data: rotationDevo, error: rotError } = await supabase
        .from('devotionals')
        .select(`
          *,
          scripture:scripture_id (
            id,
            reference,
            text_esv,
            text_niv,
            text_kjv,
            text_nasb
          )
        `)
        .eq('day_of_year', dayOfYear)
        .eq('is_active', true)
        .single();
      
      if (rotationDevo) {
        devotional = rotationDevo;
      }
    }
    
    // If still no devotional, get a random one
    if (!devotional) {
      const { data: randomDevo } = await supabase
        .from('devotionals')
        .select(`
          *,
          scripture:scripture_id (
            id,
            reference,
            text_esv,
            text_niv,
            text_kjv,
            text_nasb
          )
        `)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      devotional = randomDevo;
    }
    
    if (!devotional) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No devotional available for today'
      });
    }
    
    // Get the scripture text in user's preferred version
    const version = req.user.preferred_bible_version?.toLowerCase() || 'esv';
    const scriptureText = devotional.scripture?.[`text_${version}`] || 
                          devotional.scripture?.text_esv ||
                          devotional.scripture_text;
    
    // Check if user has already viewed today
    const { data: existingLog } = await supabase
      .from('user_devotional_logs')
      .select('id, completed_at')
      .eq('user_id', req.userId)
      .eq('devotional_id', devotional.id)
      .gte('viewed_at', today)
      .single();
    
    res.json({
      devotional: {
        id: devotional.id,
        title: devotional.title,
        scripture_reference: devotional.scripture_reference,
        scripture_text: scriptureText,
        reflection: devotional.reflection,
        prayer_prompt: devotional.prayer_prompt,
        action_step: devotional.action_step,
        themes: devotional.themes,
        reading_time_minutes: devotional.reading_time_minutes,
        author: devotional.author
      },
      userEngagement: existingLog ? {
        viewed: true,
        completed: !!existingLog.completed_at
      } : {
        viewed: false,
        completed: false
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/devotionals/:id - Get specific devotional
// ============================================================================

router.get('/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    
    const { data: devotional, error } = await supabase
      .from('devotionals')
      .select(`
        *,
        scripture:scripture_id (
          id,
          reference,
          text_esv,
          text_niv,
          text_kjv,
          text_nasb
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error || !devotional) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Devotional not found'
      });
    }
    
    // Get the scripture text in user's preferred version
    const version = req.user.preferred_bible_version?.toLowerCase() || 'esv';
    const scriptureText = devotional.scripture?.[`text_${version}`] || 
                          devotional.scripture?.text_esv ||
                          devotional.scripture_text;
    
    res.json({
      devotional: {
        ...devotional,
        scripture_text: scriptureText
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// POST /api/devotionals/:id/log - Log devotional engagement
// ============================================================================

router.post('/:id/log', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { completed, timeSpentSeconds, personalReflection, rating, sharedToGroupId } = req.body;
    
    // Verify devotional exists
    const { data: devotional } = await supabase
      .from('devotionals')
      .select('id')
      .eq('id', id)
      .single();
    
    if (!devotional) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Devotional not found'
      });
    }
    
    // Check for existing log today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingLog } = await supabase
      .from('user_devotional_logs')
      .select('id')
      .eq('user_id', req.userId)
      .eq('devotional_id', id)
      .gte('viewed_at', today)
      .single();
    
    let log;
    
    if (existingLog) {
      // Update existing log
      const updates = {};
      if (completed) updates.completed_at = new Date().toISOString();
      if (timeSpentSeconds) updates.time_spent_seconds = timeSpentSeconds;
      if (personalReflection) updates.personal_reflection = personalReflection;
      if (rating) updates.rating = rating;
      if (sharedToGroupId) updates.shared_to_group_id = sharedToGroupId;
      
      const { data, error } = await supabase
        .from('user_devotional_logs')
        .update(updates)
        .eq('id', existingLog.id)
        .select()
        .single();
      
      if (error) throw error;
      log = data;
    } else {
      // Create new log
      const { data, error } = await supabase
        .from('user_devotional_logs')
        .insert({
          user_id: req.userId,
          devotional_id: id,
          viewed_at: new Date().toISOString(),
          completed_at: completed ? new Date().toISOString() : null,
          time_spent_seconds: timeSpentSeconds || null,
          personal_reflection: personalReflection || null,
          rating: rating || null,
          shared_to_group_id: sharedToGroupId || null
        })
        .select()
        .single();
      
      if (error) throw error;
      log = data;
      
      // Update user streak
      await updateDevotionalStreak(supabase, req.userId);
    }
    
    res.status(201).json({ log });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// GET /api/devotionals/history - Get user's devotional history
// ============================================================================

router.get('/user/history', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { limit = 30, offset = 0 } = req.query;
    
    const { data: logs, error, count } = await supabase
      .from('user_devotional_logs')
      .select(`
        *,
        devotional:devotional_id (
          id,
          title,
          scripture_reference,
          themes
        )
      `, { count: 'exact' })
      .eq('user_id', req.userId)
      .order('viewed_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      logs,
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
// GET /api/devotionals/browse - Browse all devotionals
// ============================================================================

router.get('/browse/all', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { limit = 20, offset = 0, theme, difficulty } = req.query;
    
    let query = supabase
      .from('devotionals')
      .select(`
        id,
        title,
        scripture_reference,
        themes,
        reading_time_minutes,
        difficulty_level,
        author
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (theme) {
      query = query.contains('themes', [theme]);
    }
    
    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }
    
    const { data: devotionals, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      devotionals,
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

async function updateDevotionalStreak(supabase, userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already logged today
    const { data: existing } = await supabase
      .from('user_streaks')
      .select('id')
      .eq('user_id', userId)
      .eq('streak_date', today)
      .eq('activity_type', 'devotional')
      .single();
    
    if (!existing) {
      await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          streak_date: today,
          activity_type: 'devotional'
        });
    }
  } catch (err) {
    console.error('Error updating devotional streak:', err);
  }
}

module.exports = router;
