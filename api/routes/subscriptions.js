/**
 * Still Waters - Subscription Routes
 * Handles Stripe checkout, portal, and subscription status
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const STRIPE_CONFIG = require('../config/stripe.config');

/**
 * POST /api/subscriptions/create-checkout
 * Create a Stripe checkout session with 7-day free trial
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const supabase = req.app.get('supabase');

    // Validate price ID
    const tier = STRIPE_CONFIG.PRICE_TO_TIER[priceId];
    if (!tier) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    // Get user's Stripe customer ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    let customerId = userData?.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId }
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Check if user has already used their trial
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100
    });

    const hasUsedTrial = subscriptions.data.some(sub => sub.trial_start !== null);

    // Build checkout session params
    const sessionParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { userId, tier },
      allow_promotion_codes: true,
      billing_address_collection: 'required'
    };

    // Add 7-day trial only if user hasn't used one before
    if (!hasUsedTrial) {
      sessionParams.subscription_data = {
        trial_period_days: STRIPE_CONFIG.TRIAL_DAYS,
        metadata: { userId, tier }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /api/subscriptions/create-portal
 * Create a Stripe customer portal session for subscription management
 */
router.post('/create-portal', async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = req.app.get('supabase');

    // Get customer ID
    const { data: userData, error } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !userData?.stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/settings`
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * GET /api/subscriptions/status
 * Get current subscription status and usage
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = req.app.get('supabase');

    // Get user subscription data
    const { data: userData, error } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_tier, subscription_status')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Failed to fetch subscription status' });
    }

    // Default to free tier
    let status = {
      tier: userData?.subscription_tier || 'free',
      tierName: 'Free',
      status: 'active',
      trialActive: false,
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      features: STRIPE_CONFIG.TIERS.free
    };

    if (userData?.stripe_customer_id) {
      // Get active/trialing subscriptions from Stripe
      const [activeSubscriptions, trialingSubscriptions] = await Promise.all([
        stripe.subscriptions.list({
          customer: userData.stripe_customer_id,
          status: 'active',
          limit: 1
        }),
        stripe.subscriptions.list({
          customer: userData.stripe_customer_id,
          status: 'trialing',
          limit: 1
        })
      ]);

      const allSubs = [...activeSubscriptions.data, ...trialingSubscriptions.data];

      if (allSubs.length > 0) {
        const subscription = allSubs[0];
        const priceId = subscription.items.data[0].price.id;
        const tier = STRIPE_CONFIG.PRICE_TO_TIER[priceId] || 'free';

        status = {
          tier,
          tierName: STRIPE_CONFIG.TIERS[tier]?.name || 'Unknown',
          status: subscription.status,
          trialActive: subscription.status === 'trialing',
          trialEndsAt: subscription.trial_end 
            ? new Date(subscription.trial_end * 1000).toISOString() 
            : null,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          features: STRIPE_CONFIG.TIERS[tier] || STRIPE_CONFIG.TIERS.free,
          subscriptionId: subscription.id
        };
      }
    }

    // Get message usage for rate limiting display
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodStart.getDay()); // Start of week
    
    const { data: usageData } = await supabase
      .from('message_usage')
      .select('message_count, period_type')
      .eq('user_id', userId)
      .gte('period_start', periodStart.toISOString().split('T')[0]);

    status.usage = {
      weekly: usageData?.find(u => u.period_type === 'weekly')?.message_count || 0,
      monthly: usageData?.find(u => u.period_type === 'monthly')?.message_count || 0
    };

    res.json(status);

  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans
 */
router.get('/plans', async (req, res) => {
  const plans = [
    {
      tier: 'free',
      name: 'Free',
      description: 'Begin your journey',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '5 AI conversations per week',
        'Daily devotionals',
        'View community prayer wall'
      ]
    },
    {
      tier: 'seeker',
      name: 'Seeker',
      description: 'Deepen your practice',
      monthlyPrice: 5,
      annualPrice: 50,
      monthlyPriceId: STRIPE_CONFIG.PRICES.SEEKER.MONTHLY,
      annualPriceId: STRIPE_CONFIG.PRICES.SEEKER.ANNUAL,
      features: [
        '40 AI conversations per month',
        'Streaming AI responses',
        'Daily devotionals',
        'View community prayer wall'
      ],
      popular: false
    },
    {
      tier: 'disciple',
      name: 'Disciple',
      description: 'Full spiritual companion',
      monthlyPrice: 12,
      annualPrice: 120,
      monthlyPriceId: STRIPE_CONFIG.PRICES.DISCIPLE.MONTHLY,
      annualPriceId: STRIPE_CONFIG.PRICES.DISCIPLE.ANNUAL,
      features: [
        'Unlimited AI conversations',
        'Wiser AI persona',
        'Streaming responses',
        'Full community access',
        'Join Bible study groups'
      ],
      popular: true
    },
    {
      tier: 'shepherd',
      name: 'Shepherd',
      description: 'Lead and guide others',
      monthlyPrice: 20,
      annualPrice: 200,
      monthlyPriceId: STRIPE_CONFIG.PRICES.SHEPHERD.MONTHLY,
      annualPriceId: STRIPE_CONFIG.PRICES.SHEPHERD.ANNUAL,
      features: [
        'Everything in Disciple',
        '1:1 coaching access',
        'Create & lead groups',
        'Certification path eligibility',
        'Priority support'
      ],
      popular: false
    }
  ];

  res.json(plans);
});

module.exports = router;
