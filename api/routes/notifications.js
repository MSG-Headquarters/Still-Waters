/**
 * Notifications Routes
 * Handles user notifications
 */

const express = require('express');
const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { limit = 20, unreadOnly = false } = req.query;
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }
    
    const { data: notifications, error } = await query;
    
    if (error) throw error;
    
    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId)
      .eq('is_read', false);
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', req.userId)
      .eq('is_read', false);
    
    if (error) throw error;
    
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);
    
    if (error) throw error;
    
    res.json({ message: 'Notification deleted', id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
