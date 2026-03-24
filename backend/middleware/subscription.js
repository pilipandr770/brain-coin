/**
 * Subscription middleware — blocks parent features if not on active/trialing plan.
 * Children are always allowed through.
 * Admin users bypass the check.
 */
const { pool } = require('../db');

module.exports = async function requireSubscription(req, res, next) {
  // Only parents need a subscription
  if (req.user.role !== 'parent') return next();

  try {
    const { rows } = await pool.query(
      'SELECT subscription_status, subscription_end, role FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Admins bypass subscription check
    if (user.role === 'admin') return next();

    const now = new Date();

    if (user.subscription_status === 'active') return next();

    // 3-day trial: check created_at within 3 days handled by default 'trial' status
    if (user.subscription_status === 'trial') return next();

    if (user.subscription_status === 'trialing' && user.subscription_end && new Date(user.subscription_end) > now) {
      return next();
    }

    return res.status(402).json({
      error: 'subscription_required',
      message: 'An active subscription is required to use this feature.',
    });
  } catch (err) {
    console.error('requireSubscription error:', err);
    next(err);
  }
};
