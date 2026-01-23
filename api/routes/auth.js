/**
 * Auth Routes
 * Handles authentication (login, signup, token refresh)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { email, password, displayName } = req.body;
    
    if (!email || !password || !displayName) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Email, password, and display name are required'
      });
    }
    
    // Create auth user with Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (authError) throw authError;
    
    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        display_name: displayName
      })
      .select()
      .single();
    
    if (userError) throw userError;
    
    // Generate JWT
    const token = jwt.sign(
      { sub: authData.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user,
      token,
      message: 'Account created successfully'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Email and password are required'
      });
    }
    
    // Verify with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }
    
    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .is('deleted_at', null)
      .single();
    
    if (userError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User profile not found'
      });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { sub: authData.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update last active
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);
    
    res.json({
      user,
      token,
      message: 'Login successful'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Generate new access token
    const token = jwt.sign(
      { sub: decoded.sub, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token });
  } catch (err) {
    res.status(401).json({
      error: 'Invalid refresh token',
      message: 'Please log in again'
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const supabase = req.app.get('supabase');
    const { email } = req.body;
    
    await supabase.auth.resetPasswordForEmail(email);
    
    res.json({
      message: 'If an account exists with this email, you will receive a password reset link.'
    });
  } catch (err) {
    // Don't reveal if email exists
    res.json({
      message: 'If an account exists with this email, you will receive a password reset link.'
    });
  }
});

module.exports = router;
