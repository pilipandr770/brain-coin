/**
 * SubscriptionGate — wraps parent features that require an active subscription.
 * Shows a paywall if the parent is not on a trialing or active plan.
 * Children and admins always pass through.
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function SubscriptionGate({ children }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Children and admins bypass the gate
  if (!user || user.role !== 'parent' || user.is_admin) return children;

  const status = user.sub_status || 'none';
  const isAllowed = status === 'active' || status === 'trialing';
  if (isAllowed) return children;

  const trialDaysLeft = () => {
    if (!user.trial_ends_at) return 0;
    const ms = new Date(user.trial_ends_at) - new Date();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t('subscription.required_title', 'Premium Feature')}
        </h2>
        <p className="text-gray-500 mb-6">
          {t('subscription.required_desc', 'This feature requires an active BrainCoin subscription.')}
        </p>

        <div className="bg-purple-50 rounded-xl p-4 mb-6 text-left">
          <p className="font-semibold text-purple-800 mb-2">
            {t('subscription.plan_name', 'BrainCoin Parent Plan')}
          </p>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>✅ {t('subscription.feature1', 'Unlimited contracts for children')}</li>
            <li>✅ {t('subscription.feature2', 'AI-powered quiz generation')}</li>
            <li>✅ {t('subscription.feature3', 'Progress statistics & reports')}</li>
            <li>✅ {t('subscription.feature4', 'Up to 5 child profiles')}</li>
          </ul>
          <p className="text-purple-900 font-bold mt-3 text-lg">
            €5 / {t('subscription.per_month', 'month')}
            <span className="text-sm font-normal ml-2 text-purple-600">
              — {t('subscription.trial_cta', '3 days free')}
            </span>
          </p>
        </div>

        {status === 'past_due' && (
          <p className="text-amber-600 text-sm mb-4">
            ⚠️ {t('subscription.past_due_notice', 'Your last payment failed. Please update your payment method.')}
          </p>
        )}

        <button
          onClick={() => navigate('/parent/payment')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {t('subscription.cta_button', 'Subscribe — 3 days free')}
        </button>
      </div>
    </div>
  );
}
