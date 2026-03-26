import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function PaymentScreen() {
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
      alert('Checkout konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
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
      alert('Abrechnungsportal konnte nicht geöffnet werden. Bitte versuchen Sie es erneut.');
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
    none:     { label: 'Nicht abonniert', color: 'text-gray-500',  bg: 'bg-gray-100' },
    trialing: { label: 'Testphase',     color: 'text-blue-600',  bg: 'bg-blue-50' },
    active:   { label: 'Aktiv',         color: 'text-green-600', bg: 'bg-green-50' },
    past_due: { label: 'Zahlung fehlgeschlagen', color: 'text-amber-600', bg: 'bg-amber-50' },
    canceled: { label: 'Gekündigt',       color: 'text-red-500',   bg: 'bg-red-50' },
  };

  const info = statusInfo[subStatus] ?? statusInfo.none;

  return (
    <div className="max-w-lg mx-auto p-4 pt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {'Abonnement'}
      </h1>

      {/* Success / cancel banner */}
      {stripeResult === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex gap-3">
          <span className="text-xl">🎉</span>
          <p className="text-green-800 font-medium">
            {'Willkommen! Ihr Abonnement ist jetzt aktiv.'}
          </p>
        </div>
      )}
      {stripeResult === 'cancel' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-gray-600">
            {'Checkout wurde abgebrochen. Sie können jederzeit abonnieren.'}
          </p>
        </div>
      )}

      {/* Current status card */}
      <div className={`${info.bg} rounded-2xl p-5 mb-6`}>
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-700">
            {'Aktueller Status'}
          </span>
          <span className={`font-bold ${info.color}`}>{info.label}</span>
        </div>

        {subStatus === 'trialing' && (
          <p className="text-sm text-blue-700">
            {`${trialDaysLeft()} Tage verbleiben in der Testphase`}
          </p>
        )}
        {(subStatus === 'active' || subStatus === 'past_due') && periodEndDate && (
          <p className="text-sm text-gray-600">
            {'Erneuert am'} {periodEndDate}
          </p>
        )}
      </div>

      {/* Plan details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h2 className="font-bold text-lg text-gray-800 mb-1">
          {'BrainCoin Elternplan'}
        </h2>
        <p className="text-3xl font-bold text-purple-600 mb-4">
          €5
          <span className="text-base font-normal text-gray-500">
            /{'Monat'}
          </span>
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span>✅</span>{'Unbegrenzte Verträge für Kinder'}</li>
          <li className="flex gap-2"><span>✅</span>{'KI-gestützte Quizgenerierung'}</li>
          <li className="flex gap-2"><span>✅</span>{'Fortschrittsstatistiken & Berichte'}</li>
          <li className="flex gap-2"><span>✅</span>{'Bis zu 5 Kinderprofile'}</li>
          <li className="flex gap-2"><span>🎁</span><strong>{'3 Tage kostenlose Testphase'}</strong></li>
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
            ? 'Laden…'
            : 'Abonnieren — 3 Tage kostenlos'}
        </button>
      )}

      {(subStatus === 'active' || subStatus === 'trialing' || subStatus === 'past_due') && (
        <button
          onClick={handlePortal}
          disabled={actionLoading || loading}
          className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors mb-3"
        >
          {actionLoading
            ? 'Laden…'
            : 'Abonnement verwalten'}
        </button>
      )}

      <p className="text-xs text-center text-gray-400">
        {'Zahlungen werden sicher über Stripe verarbeitet. Jederzeit kündbar.'}
      </p>
    </div>
  );
}
