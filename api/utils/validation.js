/**
 * Validation Utilities
 * Input validation and sanitization for Yeshua Guide API
 */

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const VALID_MOODS = ['grateful', 'struggling', 'seeking', 'anxious', 'strong', 'questioning'];
const VALID_BIBLE_VERSIONS = ['ESV', 'NIV', 'KJV', 'NASB', 'NLT'];
const VALID_VISIBILITIES = ['public', 'friends', 'private', 'community', 'group'];
const VALID_PRAYER_TYPES = ['request', 'praise', 'thanksgiving', 'intercession', 'confession'];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate mood selection
 * @param {string} mood - Mood to validate
 * @returns {Object} Validation result
 */
function validateMood(mood) {
  if (!mood) {
    return { valid: true, value: null };
  }
  
  const normalized = mood.toLowerCase().trim();
  
  if (!VALID_MOODS.includes(normalized)) {
    return {
      valid: false,
      error: `Invalid mood. Must be one of: ${VALID_MOODS.join(', ')}`
    };
  }
  
  return { valid: true, value: normalized };
}

/**
 * Validate Bible version
 * @param {string} version - Version to validate
 * @returns {Object} Validation result
 */
function validateBibleVersion(version) {
  if (!version) {
    return { valid: true, value: 'ESV' };
  }
  
  const normalized = version.toUpperCase().trim();
  
  if (!VALID_BIBLE_VERSIONS.includes(normalized)) {
    return {
      valid: false,
      error: `Invalid Bible version. Must be one of: ${VALID_BIBLE_VERSIONS.join(', ')}`
    };
  }
  
  return { valid: true, value: normalized };
}

/**
 * Validate visibility setting
 * @param {string} visibility - Visibility to validate
 * @returns {Object} Validation result
 */
function validateVisibility(visibility) {
  if (!visibility) {
    return { valid: true, value: 'private' };
  }
  
  const normalized = visibility.toLowerCase().trim();
  
  if (!VALID_VISIBILITIES.includes(normalized)) {
    return {
      valid: false,
      error: `Invalid visibility. Must be one of: ${VALID_VISIBILITIES.join(', ')}`
    };
  }
  
  return { valid: true, value: normalized };
}

/**
 * Validate message content
 * @param {string} content - Message content
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateMessageContent(content, options = {}) {
  const { maxLength = 10000, minLength = 1, required = true } = options;
  
  if (!content || content.trim().length === 0) {
    if (required) {
      return { valid: false, error: 'Message content is required' };
    }
    return { valid: true, value: null };
  }
  
  const trimmed = content.trim();
  
  if (trimmed.length < minLength) {
    return { valid: false, error: `Message must be at least ${minLength} character(s)` };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Message cannot exceed ${maxLength} characters` };
  }
  
  return { valid: true, value: trimmed };
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  if (trimmed.length > 255) {
    return { valid: false, error: 'Email cannot exceed 255 characters' };
  }
  
  return { valid: true, value: trimmed };
}

/**
 * Validate display name
 * @param {string} name - Name to validate
 * @returns {Object} Validation result
 */
function validateDisplayName(name) {
  if (!name) {
    return { valid: false, error: 'Display name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Display name cannot exceed 100 characters' };
  }
  
  // Basic profanity/inappropriate content check
  const inappropriatePatterns = [
    /\b(admin|support|yeshua|jesus|god|christ)\b/i
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'This display name is not allowed' };
    }
  }
  
  return { valid: true, value: trimmed };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password cannot exceed 128 characters' };
  }
  
  // Check for at least one number and one letter
  if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter and one number' };
  }
  
  return { valid: true, value: password };
}

/**
 * Validate UUID
 * @param {string} id - UUID to validate
 * @returns {Object} Validation result
 */
function validateUUID(id) {
  if (!id) {
    return { valid: false, error: 'ID is required' };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  
  return { valid: true, value: id.toLowerCase() };
}

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validation result
 */
function validatePagination(params) {
  const { limit = 20, offset = 0 } = params;
  
  const parsedLimit = parseInt(limit, 10);
  const parsedOffset = parseInt(offset, 10);
  
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    return { valid: false, error: 'Limit must be between 1 and 100' };
  }
  
  if (isNaN(parsedOffset) || parsedOffset < 0) {
    return { valid: false, error: 'Offset must be 0 or greater' };
  }
  
  return {
    valid: true,
    value: {
      limit: parsedLimit,
      offset: parsedOffset
    }
  };
}

/**
 * Validate prayer request
 * @param {Object} prayer - Prayer request object
 * @returns {Object} Validation result
 */
function validatePrayerRequest(prayer) {
  const errors = [];
  
  // Validate content
  const contentResult = validateMessageContent(prayer.content, {
    maxLength: 2000,
    minLength: 10,
    required: true
  });
  if (!contentResult.valid) {
    errors.push(contentResult.error);
  }
  
  // Validate visibility
  if (prayer.visibility) {
    const visResult = validateVisibility(prayer.visibility);
    if (!visResult.valid) {
      errors.push(visResult.error);
    }
  }
  
  // Validate prayer type
  if (prayer.type && !VALID_PRAYER_TYPES.includes(prayer.type.toLowerCase())) {
    errors.push(`Invalid prayer type. Must be one of: ${VALID_PRAYER_TYPES.join(', ')}`);
  }
  
  // Validate tags
  if (prayer.tags) {
    if (!Array.isArray(prayer.tags)) {
      errors.push('Tags must be an array');
    } else if (prayer.tags.length > 10) {
      errors.push('Cannot have more than 10 tags');
    } else {
      for (const tag of prayer.tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          errors.push('Each tag must be a string of 50 characters or less');
          break;
        }
      }
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    value: {
      content: contentResult.value,
      visibility: prayer.visibility?.toLowerCase() || 'private',
      type: prayer.type?.toLowerCase() || 'request',
      tags: prayer.tags || [],
      isAnonymous: prayer.isAnonymous || false
    }
  };
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize HTML content (strip all tags)
 * @param {string} content - Content to sanitize
 * @returns {string} Sanitized content
 */
function sanitizeHTML(content) {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize for SQL-like injection (basic)
 * Note: Always use parameterized queries as primary defense
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (!input) return '';
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .trim();
}

/**
 * Normalize whitespace
 * @param {string} content - Content to normalize
 * @returns {string} Normalized content
 */
function normalizeWhitespace(content) {
  if (!content) return '';
  return content
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

/**
 * Create validation middleware
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
function createValidationMiddleware(schema) {
  return (req, res, next) => {
    const errors = [];
    
    // Validate body fields
    if (schema.body) {
      for (const [field, validator] of Object.entries(schema.body)) {
        const result = validator(req.body[field]);
        if (!result.valid) {
          errors.push({ field, message: result.error || result.errors });
        } else {
          req.body[field] = result.value;
        }
      }
    }
    
    // Validate query parameters
    if (schema.query) {
      for (const [field, validator] of Object.entries(schema.query)) {
        const result = validator(req.query[field]);
        if (!result.valid) {
          errors.push({ field, message: result.error || result.errors });
        } else {
          req.query[field] = result.value;
        }
      }
    }
    
    // Validate route parameters
    if (schema.params) {
      for (const [field, validator] of Object.entries(schema.params)) {
        const result = validator(req.params[field]);
        if (!result.valid) {
          errors.push({ field, message: result.error || result.errors });
        } else {
          req.params[field] = result.value;
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Constants
  VALID_MOODS,
  VALID_BIBLE_VERSIONS,
  VALID_VISIBILITIES,
  VALID_PRAYER_TYPES,
  
  // Validators
  validateMood,
  validateBibleVersion,
  validateVisibility,
  validateMessageContent,
  validateEmail,
  validateDisplayName,
  validatePassword,
  validateUUID,
  validatePagination,
  validatePrayerRequest,
  
  // Sanitizers
  sanitizeHTML,
  sanitizeInput,
  normalizeWhitespace,
  
  // Middleware
  createValidationMiddleware
};
