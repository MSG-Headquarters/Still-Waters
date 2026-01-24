/**
 * Still Waters - Stripe Configuration
 * Subscription tiers, price IDs, and feature definitions
 */

const STRIPE_CONFIG = {
  // Trial period in days
  TRIAL_DAYS: 7,

  // Price IDs from Stripe Dashboard
  PRICES: {
    SEEKER: {
      MONTHLY: 'price_1SszhBJ1AWGGJriC09qS5PU0',
      ANNUAL: 'price_1SszsRJ1AWGGJriCTSxxRpPs',
      PRODUCT_ID: 'prod_Tqh5AkIF4nWc2D'
    },
    DISCIPLE: {
      MONTHLY: 'price_1SszrvJ1AWGGJriCc7SYPqGx',
      ANNUAL: 'price_1SszrvJ1AWGGJriCk1zZrpNX',
      PRODUCT_ID: 'prod_TqhGaDfUPgztrm'
    },
    SHEPHERD: {
      MONTHLY: 'price_1SsztEJ1AWGGJriCerdTZr1t',
      ANNUAL: 'price_1SsztcJ1AWGGJriCKwbueE0O',
      PRODUCT_ID: 'prod_TqhHBFWmQ3DaVL'
    }
  },

  // Map price IDs to tier names
  PRICE_TO_TIER: {
    'price_1SszhBJ1AWGGJriC09qS5PU0': 'seeker',
    'price_1SszsRJ1AWGGJriCTSxxRpPs': 'seeker',
    'price_1SszrvJ1AWGGJriCc7SYPqGx': 'disciple',
    'price_1SszrvJ1AWGGJriCk1zZrpNX': 'disciple',
    'price_1SsztEJ1AWGGJriCerdTZr1t': 'shepherd',
    'price_1SsztcJ1AWGGJriCKwbueE0O': 'shepherd'
  },

  // Tier features and limits
  TIERS: {
    free: {
      name: 'Free',
      messagesPerWeek: 5,
      messagesPerMonth: null,
      community: 'view_only',
      streaming: false,
      aiPersona: 'basic'
    },
    seeker: {
      name: 'Seeker',
      messagesPerWeek: null,
      messagesPerMonth: 40,
      community: 'view_only',
      streaming: true,
      aiPersona: 'standard'
    },
    disciple: {
      name: 'Disciple',
      messagesPerWeek: null,
      messagesPerMonth: null,
      community: 'full',
      streaming: true,
      aiPersona: 'wise'
    },
    shepherd: {
      name: 'Shepherd',
      messagesPerWeek: null,
      messagesPerMonth: null,
      community: 'lead',
      streaming: true,
      aiPersona: 'wise',
      coaching: true
    }
  }
};

module.exports = STRIPE_CONFIG;
