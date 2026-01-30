/**
 * STILL WATERS - Faith Companion API
 * Main Server Entry Point
 * Version 1.1.0 - With Stripe Subscriptions
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const conversationRoutes = require('./routes/conversations');
const devotionalRoutes = require('./routes/devotionals');
const scriptureRoutes = require('./routes/scriptures');
const prayerRoutes = require('./routes/prayers');
const groupRoutes = require('./routes/groups');
const notificationRoutes = require('./routes/notifications');
const subscriptionRoutes = require('./routes/subscriptions');
const webhookRoutes = require('./routes/webhooks');
const communityRoutes = require('./routes/community');
const adminRoutes = require('./routes/admin');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { attachSubscription, checkMessageLimit } = require('./middleware/subscription');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3006;

// ============================================================================
// WEBHOOK ROUTE (Must be before body parsing middleware!)
// ============================================================================

// Stripe webhooks need raw body for signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Body parsing (AFTER webhook route which needs raw body)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please wait before making more requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Stricter rate limit for AI conversations (expensive)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: {
    error: 'Message limit reached',
    message: 'Please wait a moment before sending more messages'
  }
});

app.use('/api/conversations/*/messages', aiLimiter);

// ============================================================================
// DATABASE & AI CLIENT INITIALIZATION
// ============================================================================

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Make clients available to routes
app.set('supabase', supabase);
app.set('anthropic', anthropic);

// ============================================================================
// HEALTH CHECK ROUTES
// ============================================================================

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'still-waters-api',
    version: '1.1.0',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check (protected)
app.get('/health/detailed', authenticateToken, async (req, res) => {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const dbStatus = error ? 'unhealthy' : 'healthy';
    
    // Check Stripe connection
    let stripeStatus = 'healthy';
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.products.list({ limit: 1 });
      } else {
        stripeStatus = 'not configured';
      }
    } catch (e) {
      stripeStatus = 'unhealthy';
    }
    
    res.json({
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      service: 'still-waters-api',
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        ai: 'healthy',
        stripe: stripeStatus
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/community', authenticateToken, attachSubscription, communityRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Webhook routes (no auth required, uses signature verification)
app.use('/api/webhooks/stripe', webhookRoutes);

// Public routes
app.use('/api/auth', authRoutes);

// Subscription routes (protected)
app.use('/api/subscriptions', authenticateToken, subscriptionRoutes);

// Protected routes with subscription awareness
app.use('/api/users', authenticateToken, attachSubscription, userRoutes);
app.use('/api/conversations', authenticateToken, attachSubscription, conversationRoutes);
app.use('/api/devotionals', authenticateToken, attachSubscription, devotionalRoutes);
app.use('/api/scriptures', authenticateToken, attachSubscription, scriptureRoutes);
app.use('/api/prayers', authenticateToken, attachSubscription, prayerRoutes);
app.use('/api/groups', authenticateToken, attachSubscription, groupRoutes);
app.use('/api/notifications', authenticateToken, attachSubscription, notificationRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🕊️  STILL WATERS API                                        ║
║   Faith Companion Backend Service                             ║
║                                                               ║
║   Server running on port ${PORT}                                ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║                                                               ║
║   Endpoints:                                                  ║
║   • Health:        http://localhost:${PORT}/health              ║
║   • API:           http://localhost:${PORT}/api                 ║
║   • Subscriptions: http://localhost:${PORT}/api/subscriptions   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
