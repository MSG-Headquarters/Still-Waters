/**
 * Still Waters - Subscription Middleware
 * Handles tier-based access control and message rate limiting
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const STRIPE_CONFIG = require('../config/stripe.config');

// Simple in-memory cache (consider Redis for production scaling)
const subscriptionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Middleware to attach subscription info to request
 */
async function attachSubscription(req, res, next) {
  try {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const cached = subscriptionCache.get(userId);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      req.subscription = cached.data;
      return next();
    }

    const supabase = req.app.get('supabase');
    
    // Get user's subscription info from database
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_tier, subscription_status')
      .eq('id', userId)
      .single();

    let subscription = {
      tier: userData?.subscription_tier || 'free',
      features: STRIPE_CONFIG.TIERS[userData?.subscription_tier] || STRIPE_CONFIG.TIERS.free,
      status: userData?.subscription_status || 'active'
    };

    // Cache it
    subscriptionCache.set(userId, {
      data: subscription,
      timestamp: Date.now()
    });

    req.subscription = subscription;
    next();

  } catch (error) {
    console.error('Subscription middleware error:', error);
    req.subscription = {
      tier: 'free',
      features: STRIPE_CONFIG.TIERS.free,
      status: 'active'
    };
    next();
  }
}

/**
 * Middleware to check message limits based on subscription tier
 */
async function checkMessageLimit(req, res, next) {
  try {
    const userId = req.user?.id;
    const tier = req.subscription?.tier || 'free';
    const features = req.subscription?.features || STRIPE_CONFIG.TIERS.free;
    const supabase = req.app.get('supabase');

    // Unlimited tiers skip the check
    if (!features.messagesPerWeek && !features.messagesPerMonth) {
      return next();
    }

    // Get current usage
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: usageData } = await supabase
      .from('message_usage')
      .select('message_count, period_type, period_start')
      .eq('user_id', userId);

    const weeklyUsage = usageData?.find(u => 
      u.period_type === 'weekly' && 
      new Date(u.period_start) >= weekStart
    )?.message_count || 0;

    const monthlyUsage = usageData?.find(u => 
      u.period_type === 'monthly' && 
      new Date(u.period_start) >= monthStart
    )?.message_count || 0;

    // Check weekly limit (free tier)
    if (features.messagesPerWeek && weeklyUsage >= features.messagesPerWeek) {
      return res.status(429).json({
        error: 'Message limit reached',
        message: `You've used your ${features.messagesPerWeek} free messages this week. Upgrade to Seeker for more conversations.`,
        limitType: 'weekly',
        used: weeklyUsage,
        limit: features.messagesPerWeek,
        upgradeRequired: true
      });
    }

    // Check monthly limit (seeker tier)
    if (features.messagesPerMonth && monthlyUsage >= features.messagesPerMonth) {
      return res.status(429).json({
        error: 'Message limit reached',
        message: `You've used your ${features.messagesPerMonth} Seeker messages this month. Upgrade to Disciple for unlimited conversations.`,
        limitType: 'monthly',
        used: monthlyUsage,
        limit: features.messagesPerMonth,
        upgradeRequired: true
      });
    }

    // Attach quota info for frontend display
    req.messageQuota = {
      weekly: features.messagesPerWeek 
        ? { used: weeklyUsage, limit: features.messagesPerWeek }
        : null,
      monthly: features.messagesPerMonth
        ? { used: monthlyUsage, limit: features.messagesPerMonth }
        : null
    };

    next();

  } catch (error) {
    console.error('Message limit check error:', error);
    next(); // Allow on error to not block users
  }
}

/**
 * Increment message count after successful AI response
 * Call this after sending a message
 */
async function incrementMessageCount(userId, supabase) {
  try {
    // Use the database function we created
    await supabase.rpc('increment_message_count', {
      p_user_id: userId,
      p_period_type: 'weekly'
    });
    
    await supabase.rpc('increment_message_count', {
      p_user_id: userId,
      p_period_type: 'monthly'
    });
  } catch (error) {
    console.error('Error incrementing message count:', error);
  }
}

/**
 * Clear subscription cache for a user
 */
function clearSubscriptionCache(userId) {
  subscriptionCache.delete(userId);
}

/**
 * Middleware to require a minimum subscription tier
 */
function requireTier(minimumTier) {
  const tierOrder = ['free', 'seeker', 'disciple', 'shepherd'];
  const minIndex = tierOrder.indexOf(minimumTier);

  return (req, res, next) => {
    const userTier = req.subscription?.tier || 'free';
    const userIndex = tierOrder.indexOf(userTier);

    if (userIndex >= minIndex) {
      return next();
    }

    res.status(403).json({
      error: 'Upgrade required',
      message: `This feature requires a ${minimumTier} subscription or higher`,
      currentTier: userTier,
      requiredTier: minimumTier,
      upgradeRequired: true
    });
  };
}

module.exports = {
  attachSubscription,
  checkMessageLimit,
  incrementMessageCount,
  clearSubscriptionCache,
  requireTier,
  STRIPE_CONFIG
};
