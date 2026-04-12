/**
 * Payment routes — Stripe subscription management
 *
 * POST /api/payments/checkout   → create Stripe Checkout session (€5/mo, 3-day trial)
 * POST /api/payments/webhook    → Stripe webhook handler (raw body required)
 * GET  /api/payments/portal     → Stripe billing portal link
 * GET  /api/payments/status     → current user subscription status
 */
const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth    = require('../middleware/auth');
const { pool } = require('../db');

// ─── Checkout ──────────────────────────────────────────────────────────────
// Creates a new Stripe Checkout session and returns the URL.
// The price is identified by STRIPE_PRICE_ID env var (€5/month, recurring).
router.post('/checkout', auth, async (req, res) => {
  if (!['parent','admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Parents only' });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId || !priceId.startsWith('price_')) {
    console.error('STRIPE_PRICE_ID is not configured correctly. Expected price_xxx, got:', priceId);
    return res.status(500).json({ error: 'Stripe-Preis nicht konfiguriert. Bitte kontaktiere den Support.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT email, stripe_customer_id FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    let customerId = user.stripe_customer_id;

    // Create or reuse Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, req.user.id]
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,       // price_xxx from Stripe dashboard
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 3,
      },
      success_url: `${process.env.FRONTEND_URL}/parent/payment?status=success`,
      cancel_url:  `${process.env.FRONTEND_URL}/parent/payment?status=cancel`,
      metadata: { userId: String(req.user.id) },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ─── Webhook ───────────────────────────────────────────────────────────────
// Must be mounted BEFORE express.json() with express.raw({ type: 'application/json' }).
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const subscription = event.data.object;

  // Helper: map Stripe status to our DB status
  const mapStatus = (s) => {
    if (s === 'active')    return 'active';
    if (s === 'trialing')  return 'trialing';
    if (s === 'past_due')  return 'past_due';
    if (s === 'canceled')  return 'canceled';
    return 'none';
  };

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const customerId = subscription.customer;
      const status     = mapStatus(subscription.status);
      const periodEnd  = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;
      const trialEnd   = subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null;

      await pool.query(
        `UPDATE users SET
           stripe_sub_id             = $1,
           sub_status                = $2,
           sub_current_period_end    = $3,
           trial_ends_at             = COALESCE($4, trial_ends_at)
         WHERE stripe_customer_id    = $5`,
        [subscription.id, status, periodEnd, trialEnd, customerId]
      );
      break;
    }

    case 'customer.subscription.deleted': {
      const customerId = subscription.customer;
      await pool.query(
        `UPDATE users SET sub_status = 'canceled', stripe_sub_id = NULL
         WHERE stripe_customer_id = $1`,
        [customerId]
      );
      break;
    }

    default:
      // Ignore other events
      break;
  }

  res.json({ received: true });
});

// ─── Billing Portal ────────────────────────────────────────────────────────
// Returns a short-lived URL for the Stripe customer portal (cancel, update card, etc.)
router.get('/portal', auth, async (req, res) => {
  if (!['parent','admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Parents only' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.user.id]
    );
    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) {
      return res.status(404).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${process.env.FRONTEND_URL}/parent/payment`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Failed to open billing portal' });
  }
});

// ─── Cancel Subscription ──────────────────────────────────────────────────
// Cancels at period end (user keeps access until current period ends).
router.post('/cancel', auth, async (req, res) => {
  if (!['parent','admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Parents only' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT stripe_sub_id FROM users WHERE id = $1',
      [req.user.id]
    );
    const subId = rows[0]?.stripe_sub_id;
    if (!subId) return res.status(404).json({ error: 'Kein aktives Abonnement gefunden' });

    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
    res.json({ canceled: true });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ error: 'Kündigung fehlgeschlagen' });
  }
});

// ─── Status ────────────────────────────────────────────────────────────────
// Returns the subscription status for the logged-in parent.
router.get('/status', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sub_status, trial_ends_at, sub_current_period_end
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json(rows[0] || { sub_status: 'none', trial_ends_at: null, sub_current_period_end: null });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

module.exports = router;
