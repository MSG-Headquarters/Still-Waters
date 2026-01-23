/**
 * Authentication Middleware
 * Handles JWT verification and user context injection
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get Supabase client from app
    const supabase = req.app.get('supabase');
    
    // Fetch full user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', decoded.sub)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or token invalid'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    // Update last active timestamp (non-blocking)
    supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)
      .then(() => {});

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }

    console.error('Auth middleware error:', err);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const supabase = req.app.get('supabase');
    
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', decoded.sub)
      .is('deleted_at', null)
      .single();

    req.user = user || null;
    req.userId = user?.id || null;
    
    next();
  } catch (err) {
    // Don't fail on optional auth
    req.user = null;
    req.userId = null;
    next();
  }
};

/**
 * Check if user is group admin/owner
 */
const requireGroupAdmin = async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const groupId = req.params.groupId || req.body.groupId;
    
    if (!groupId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Group ID required'
      });
    }

    const { data: membership, error } = await supabase
      .from('group_members')
      .select('role, status')
      .eq('group_id', groupId)
      .eq('user_id', req.userId)
      .single();

    if (error || !membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not a member of this group'
      });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin privileges required'
      });
    }

    req.groupMembership = membership;
    next();
  } catch (err) {
    console.error('Group admin check error:', err);
    return res.status(500).json({
      error: 'Server error',
      message: 'Error checking group permissions'
    });
  }
};

/**
 * Check if user is group member
 */
const requireGroupMember = async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const groupId = req.params.groupId || req.body.groupId;
    
    if (!groupId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Group ID required'
      });
    }

    const { data: membership, error } = await supabase
      .from('group_members')
      .select('role, status')
      .eq('group_id', groupId)
      .eq('user_id', req.userId)
      .eq('status', 'active')
      .single();

    if (error || !membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not an active member of this group'
      });
    }

    req.groupMembership = membership;
    next();
  } catch (err) {
    console.error('Group member check error:', err);
    return res.status(500).json({
      error: 'Server error',
      message: 'Error checking group membership'
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireGroupAdmin,
  requireGroupMember
};
