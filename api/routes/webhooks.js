/**
 * Still Waters - Stripe Webhook Handler
 * Processes subscription lifecycle events from Stripe
 * 
 * IMPORTANT: This route requires raw body parsing for signature verification.
 * Must be mounted BEFORE express.json() middleware in server.js
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const STRIPE_CONFIG = require('../config/stripe.config');

/**
 * POST /api/webhooks/stripe
 * Receives and processes Stripe webhook events
 */
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const supabase = req.app.get('supabase');
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object, supabase);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object, supabase);
        break;

      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Handle successful checkout - link customer to user
 */
async function handleCheckoutComplete(session, supabase) {
  console.log('Checkout completed:', session.id);
  
  const userId = session.metadata?.userId;
  const customerId = session.customer;
  
  if (userId && customerId) {
    const { error } = await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
      .is('stripe_customer_id', null);

    if (error) {
      console.error('Error linking customer:', error);
    } else {
      console.log(`User ${userId} linked to customer ${customerId}`);
    }
  }
}

/**
 * Handle new subscription created
 */
async function handleSubscriptionCreated(subscription, supabase) {
  console.log('Subscription created:', subscription.id);
  
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price.id;
  const tier = STRIPE_CONFIG.PRICE_TO_TIER[priceId] || 'free';
  const status = subscription.status;
  const trialEnd = subscription.trial_end;
  
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_status: status,
      subscription_id: subscription.id,
      trial_ends_at: trialEnd ? new Date(trialEnd * 1000).toISOString() : null
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log(`Subscription ${subscription.id} created with tier: ${tier}`);
  }
}

/**
 * Handle subscription updated (upgrade, downgrade, renewal)
 */
async function handleSubscriptionUpdated(subscription, supabase) {
  console.log('Subscription updated:', subscription.id);
  
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price.id;
  const tier = STRIPE_CONFIG.PRICE_TO_TIER[priceId] || 'free';
  const status = subscription.status;
  
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_status: status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log(`Subscription ${subscription.id} updated to tier: ${tier}`);
  }
}

/**
 * Handle subscription canceled/deleted
 */
async function handleSubscriptionDeleted(subscription, supabase) {
  console.log('Subscription deleted:', subscription.id);
  
  const customerId = subscription.customer;
  
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      subscription_id: null
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error downgrading user:', error);
  } else {
    console.log(`User with customer ${customerId} downgraded to free tier`);
  }
}

/**
 * Handle trial ending soon (3 days before)
 */
async function handleTrialWillEnd(subscription, supabase) {
  console.log('Trial will end soon:', subscription.id);
  
  const customerId = subscription.customer;
  const trialEnd = new Date(subscription.trial_end * 1000);
  
  // Get user email for notification
  const { data: userData } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userData) {
    // TODO: Send email notification about trial ending
    console.log(`Trial ending for ${userData.email} on ${trialEnd.toISOString()}`);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice, supabase) {
  console.log('Payment failed:', invoice.id);
  
  const customerId = invoice.customer;
  
  // Get user for notification
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userData) {
    // TODO: Send payment failed email
    console.log(`Payment failed for ${userData.email}`);
  }
}

module.exports = router;
