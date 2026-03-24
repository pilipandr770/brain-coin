import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function PaymentScreen() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus]     = useState(null);   // loaded from API
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Stripe redirects back with ?status=success or ?status=cancel
  const stripeResult = searchParams.get('status');

  useEffect(() => {
    fetchStatus();
    // Re-fetch user to get latest sub_status after Stripe redirect
    if (stripeResult === 'success') refreshUser();
  }, []);

  const fetchStatus = () => {
    setLoading(true);
    api.get('/payments/status')
      .then((r) => setStatus(r.data))
      .catch(() => setStatus({ sub_status: 'none' }))
      .finally(() => setLoading(false));
  };

  const handleSubscribe = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post('/payments/checkout');
      window.location.href = data.url;   // redirect to Stripe Checkout
    } catch {
      alert(t('subscription.checkout_error', 'Could not start checkout. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.get('/payments/portal');
      window.location.href = data.url;
    } catch {
      alert(t('subscription.portal_error', 'Could not open billing portal. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const subStatus = status?.sub_status ?? 'none';

  const trialDaysLeft = () => {
    if (!status?.trial_ends_at) return 0;
    const ms = new Date(status.trial_ends_at) - new Date();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const periodEndDate = status?.sub_current_period_end
    ? new Date(status.sub_current_period_end).toLocaleDateString()
    : null;

  const statusInfo = {
    none:     { label: t('subscription.status_none',     'Not subscribed'), color: 'text-gray-500',  bg: 'bg-gray-100' },
    trialing: { label: t('subscription.status_trialing', 'Free trial'),     color: 'text-blue-600',  bg: 'bg-blue-50' },
    active:   { label: t('subscription.status_active',   'Active'),         color: 'text-green-600', bg: 'bg-green-50' },
    past_due: { label: t('subscription.status_past_due', 'Payment failed'), color: 'text-amber-600', bg: 'bg-amber-50' },
    canceled: { label: t('subscription.status_canceled', 'Canceled'),       color: 'text-red-500',   bg: 'bg-red-50' },
  };

  const info = statusInfo[subStatus] ?? statusInfo.none;

  return (
    <div className="max-w-lg mx-auto p-4 pt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {t('subscription.title', 'Subscription')}
      </h1>

      {/* Success / cancel banner */}
      {stripeResult === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex gap-3">
          <span className="text-xl">🎉</span>
          <p className="text-green-800 font-medium">
            {t('subscription.success_banner', 'Welcome! Your subscription is now active.')}
          </p>
        </div>
      )}
      {stripeResult === 'cancel' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-gray-600">
            {t('subscription.cancel_banner', 'Checkout was cancelled. You can subscribe any time.')}
          </p>
        </div>
      )}

      {/* Current status card */}
      <div className={`${info.bg} rounded-2xl p-5 mb-6`}>
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-700">
            {t('subscription.current_status', 'Current status')}
          </span>
          <span className={`font-bold ${info.color}`}>{info.label}</span>
        </div>

        {subStatus === 'trialing' && (
          <p className="text-sm text-blue-700">
            {t('subscription.trial_days_left', { count: trialDaysLeft(), defaultValue: '{{count}} days left in trial' })}
          </p>
        )}
        {(subStatus === 'active' || subStatus === 'past_due') && periodEndDate && (
          <p className="text-sm text-gray-600">
            {t('subscription.renews_on', 'Renews on')} {periodEndDate}
          </p>
        )}
      </div>

      {/* Plan details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h2 className="font-bold text-lg text-gray-800 mb-1">
          {t('subscription.plan_name', 'BrainCoin Parent Plan')}
        </h2>
        <p className="text-3xl font-bold text-purple-600 mb-4">
          €5
          <span className="text-base font-normal text-gray-500">
            /{t('subscription.per_month', 'month')}
          </span>
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span>✅</span>{t('subscription.feature1', 'Unlimited contracts for children')}</li>
          <li className="flex gap-2"><span>✅</span>{t('subscription.feature2', 'AI-powered quiz generation')}</li>
          <li className="flex gap-2"><span>✅</span>{t('subscription.feature3', 'Progress statistics & reports')}</li>
          <li className="flex gap-2"><span>✅</span>{t('subscription.feature4', 'Up to 5 child profiles')}</li>
          <li className="flex gap-2"><span>🎁</span><strong>{t('subscription.trial_highlight', '3 days free trial')}</strong></li>
        </ul>
      </div>

      {/* Action buttons */}
      {(subStatus === 'none' || subStatus === 'canceled') && (
        <button
          onClick={handleSubscribe}
          disabled={actionLoading || loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold py-3 rounded-xl transition-colors mb-3"
        >
          {actionLoading
            ? t('common.loading', 'Loading…')
            : t('subscription.cta_button', 'Subscribe — 3 days free')}
        </button>
      )}

      {(subStatus === 'active' || subStatus === 'trialing' || subStatus === 'past_due') && (
        <button
          onClick={handlePortal}
          disabled={actionLoading || loading}
          className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors mb-3"
        >
          {actionLoading
            ? t('common.loading', 'Loading…')
            : t('subscription.manage_button', 'Manage subscription')}
        </button>
      )}

      <p className="text-xs text-center text-gray-400">
        {t('subscription.stripe_notice', 'Payments are securely processed by Stripe. Cancel any time.')}
      </p>
    </div>
  );
}
