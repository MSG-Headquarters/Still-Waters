/**
 * Request Logger Middleware
 * Logs incoming requests and response times for Yeshua Guide API
 */

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format duration for logging
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Request logger middleware
 */
function requestLogger(req, res, next) {
  // Generate request ID if not present
  req.requestId = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  
  // Record start time
  const startTime = Date.now();
  
  // Skip logging for health checks in production
  if (process.env.NODE_ENV === 'production' && req.path === '/health') {
    return next();
  }
  
  // Log request
  const logData = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']?.substring(0, 100),
    timestamp: new Date().toISOString()
  };
  
  // Add user ID if authenticated
  if (req.userId) {
    logData.userId = req.userId;
  }
  
  console.log(`→ ${req.method} ${req.path}`, JSON.stringify(logData));
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    // Log response
    const responseLog = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: formatDuration(duration),
      timestamp: new Date().toISOString()
    };
    
    // Log level based on status code
    if (res.statusCode >= 500) {
      console.error(`✗ ${res.statusCode} ${req.method} ${req.path} [${formatDuration(duration)}]`, JSON.stringify(responseLog));
    } else if (res.statusCode >= 400) {
      console.warn(`⚠ ${res.statusCode} ${req.method} ${req.path} [${formatDuration(duration)}]`, JSON.stringify(responseLog));
    } else {
      console.log(`✓ ${res.statusCode} ${req.method} ${req.path} [${formatDuration(duration)}]`);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and forwards to error handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Performance monitoring middleware
 * Logs slow requests
 */
function performanceMonitor(thresholdMs = 1000) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > thresholdMs) {
        console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${formatDuration(duration)}`, {
          requestId: req.requestId,
          userId: req.userId,
          duration
        });
      }
    });
    
    next();
  };
}

module.exports = {
  requestLogger,
  asyncHandler,
  performanceMonitor,
  generateRequestId
};
