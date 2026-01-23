/**
 * Error Handler Middleware
 */

const errorHandler = (err, req, res, next) => {
  // Log the error
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.userId,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details || undefined
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists'
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Referenced resource does not exist'
    });
  }

  // Anthropic API errors
  if (err.status && err.error) {
    return res.status(err.status).json({
      error: 'AI Service Error',
      message: 'Unable to process your request at this time'
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred',
    requestId: req.headers['x-request-id']
  });
};

module.exports = { errorHandler };


/**
 * Request Logger Middleware
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Generate request ID if not present
  req.requestId = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous',
      requestId: req.requestId,
      userAgent: req.headers['user-agent']?.substring(0, 50),
      ip: req.ip
    };

    if (logLevel === 'warn') {
      console.warn('Request:', logData);
    } else if (duration > 1000) {
      console.warn('Slow request:', logData);
    } else {
      console.log('Request:', logData);
    }
  });

  next();
};

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports.requestLogger = requestLogger;
