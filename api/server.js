/**
 * YESHUA GUIDE - Faith Companion API
 * Main Server Entry Point
 * Version 1.0.0
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

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3006;

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

// Body parsing
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
    service: 'yeshua-guide-api',
    version: '1.0.0',
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
    
    res.json({
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      service: 'yeshua-guide-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        ai: 'healthy' // Would add actual AI health check in production
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

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/conversations', authenticateToken, conversationRoutes);
app.use('/api/devotionals', authenticateToken, devotionalRoutes);
app.use('/api/scriptures', authenticateToken, scriptureRoutes);
app.use('/api/prayers', authenticateToken, prayerRoutes);
app.use('/api/groups', authenticateToken, groupRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

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
║   🕊️  YESHUA GUIDE API                                        ║
║   Faith Companion Backend Service                             ║
║                                                               ║
║   Server running on port ${PORT}                                ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║                                                               ║
║   Endpoints:                                                  ║
║   • Health: http://localhost:${PORT}/health                     ║
║   • API:    http://localhost:${PORT}/api                        ║
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
