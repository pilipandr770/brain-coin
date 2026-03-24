import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';

function Confetti() {
  const items = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    emoji: ['🎉','⭐','🪙','✨','🎊','💫'][Math.floor(Math.random() * 6)],
    duration: 2 + Math.random() * 1.5,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {items.map(({ id, left, delay, emoji, duration }) => (
        <div key={id} className="absolute text-xl"
          style={{
            left: `${left}%`, top: '-40px',
            animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
          }}>
          {emoji}
        </div>
      ))}
    </div>
  );
}

export default function ContractView() {
  const { id } = useParams();
  const nav    = useNavigate();
  const { t, i18n } = useTranslation();

  const [contract, setContract] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [phase,    setPhase]    = useState('read'); // read | seal | done
  const [action,   setAction]   = useState(null);   // accept | reject
  const [error,    setError]    = useState('');
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    api.get(`/contracts/${id}`)
      .then(r => { setContract(r.data); setTimeout(() => setVisible(true), 100); })
      .catch(() => setError(t('contract_view.notFound')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async () => {
    setPhase('seal');
    try {
      await api.post(`/contracts/${id}/accept`);
      setAction('accept');
      setPhase('done');
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
      setPhase('read');
    }
  };

  const handleReject = async () => {
    if (!confirm(t('contract_view.reject') + '?')) return;
    try {
      await api.post(`/contracts/${id}/reject`);
      setAction('reject');
      setPhase('done');
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-5xl animate-spin">⏳</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => nav('/child')} className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl">{t('common.back')}</button>
      </div>
    </div>
  );

  if (phase === 'seal') return (
    <div className="min-h-screen bg-amber-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl animate-spin mb-4">🔮</div>
        <p className="text-amber-300 text-xl font-bold">{t('contract_view.sealing')}</p>
      </div>
    </div>
  );

  if (phase === 'done') return (
    <>
      {action === 'accept' && <Confetti />}
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className={`max-w-sm w-full text-center bg-slate-800 rounded-2xl p-8 shadow-2xl border-2 ${action === 'accept' ? 'border-green-500' : 'border-slate-600'}`}>
          {action === 'accept' ? (
            <>
              <div className="text-7xl mb-4 animate-seal-pop">🤝</div>
              <h2 className="text-2xl font-black text-green-400 mb-2">{t('contract_view.done')}</h2>
              <p className="text-slate-400 mb-2 text-sm">{t('contract_view.questActivated', { title: contract.title })}</p>
              <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-3 mb-6">
                <p className="text-amber-300 text-sm">🏆 {t('child.reward')}: <span className="font-bold">{contract.prize_name}</span></p>
                <p className="text-amber-400 text-sm">🪙 {t('contract_view.coinsNeeded')}: <span className="font-bold">{contract.target_coins} {t('common.coins')}</span></p>
              </div>
              <button onClick={() => nav('/child')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
                🗡️ {t('contract_view.goQuests')}
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📜</div>
              <h2 className="text-2xl font-black text-slate-300 mb-2">{t('contract_view.rejected')}</h2>
              <button onClick={() => nav('/child')} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all">
                {t('common.back')}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );

  // ─── Main scroll view ────────────────────────────────────────────────────────
  const pct = Math.round((contract.current_coins / contract.target_coins) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-slate-900 p-4 flex flex-col items-center">
      {/* Scroll decorative top */}
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-2">
          <div className="bg-amber-700 h-4 w-full max-w-sm rounded-full opacity-60" />
        </div>

        {/* The Scroll */}
        <div
          className={`parchment rounded-2xl border-4 border-amber-700 shadow-2xl transition-all duration-500 origin-top ${visible ? 'animate-scroll-unroll' : 'scale-y-0 opacity-0'}`}
          style={{ borderImage: 'none' }}
        >
          {/* Scroll header */}
          <div className="bg-amber-800 rounded-t-xl px-6 py-4 text-center">
            <div className="flex justify-center gap-2 mb-1">
              <span className="text-2xl">📜</span>
              <span className="text-2xl">⚜️</span>
              <span className="text-2xl">📜</span>
            </div>
            <h1 className="text-xl font-black text-amber-100 tracking-wide">{t('contract_view.officialContract')}</h1>
            <p className="text-amber-300 text-xs mt-0.5">BrainCoin Quest System · 2026</p>
          </div>

          {/* Content */}
          <div className="px-6 py-5 text-slate-800 space-y-5">
            {/* Teaching moment */}
            <div className="bg-amber-100 border border-amber-300 rounded-xl p-3 text-xs">
              <p className="font-bold text-amber-800 mb-1">📚 {t('contract_view.whatIsContract')}</p>
              <p className="text-amber-700">
                {t('contract_view.contractExplain')}
              </p>
            </div>

            {/* Parties */}
            <div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-widest mb-2">{t('contract_view.parties')}</p>
              <div className="flex gap-3">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <div className="text-2xl">{contract.parent_avatar}</div>
                  <p className="font-bold text-slate-800 text-sm mt-1">{contract.parent_name}</p>
                  <p className="text-xs text-blue-600">{t('contract_view.parentRole')}</p>
                </div>
                <div className="flex items-center text-xl">🤝</div>
                <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <div className="text-2xl">{contract.child_avatar}</div>
                  <p className="font-bold text-slate-800 text-sm mt-1">{contract.child_name}</p>
                  <p className="text-xs text-green-600">{t('contract_view.childRole')}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-amber-300" />

            {/* Quest */}
            <div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-widest mb-2">{t('contract_view.questTask')}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="font-black text-slate-900 text-lg mb-1">{contract.title}</p>
                {contract.description && <p className="text-slate-600 text-sm mb-2">{contract.description}</p>}
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-lg">{contract.subject_emoji} {contract.subject_name}</span>
                  <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-lg">📚 {t('grades.' + contract.grade)}</span>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-widest mb-2">{t('contract_view.rules')}</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-green-50 border border-green-200 rounded-xl p-2">
                  <div className="text-xl mb-0.5">✅</div>
                  <p className="text-green-700 font-bold">+{contract.points_per_correct}</p>
                  <p className="text-green-600">{t('contract_view.correct')}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-2">
                  <div className="text-xl mb-0.5">❌</div>
                  <p className="text-red-700 font-bold">-{contract.penalty_per_wrong}</p>
                  <p className="text-red-600">{t('contract_view.mistake')}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
                  <div className="text-xl mb-0.5">⏱️</div>
                  <p className="text-blue-700 font-bold">{contract.time_per_question}s</p>
                  <p className="text-blue-600">{t('contract_view.perQuestion')}</p>
                </div>
              </div>
            </div>

            {/* Prize */}
            <div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-widest mb-2">{t('contract_view.prize')}</p>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">{contract.prize_emoji}</div>
                <p className="font-black text-slate-900 text-lg">{contract.prize_name}</p>
                <p className="text-amber-600 font-bold mt-1">🪙 {contract.target_coins} {t('common.coins')}</p>
                {pct > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-amber-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-amber-600 mt-1">{t('contract_view.alreadyEarned')} {contract.current_coins} ({pct}%)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-amber-300" />

            {/* Status message */}
            {contract.status === 'active' && (
              <div className="bg-green-50 border border-green-300 rounded-xl p-3 text-center">
                <p className="text-green-700 font-bold text-sm">{t('contract_view.contractActive')}</p>
              </div>
            )}
            {contract.status === 'completed' && (
              <div className="bg-blue-50 border border-blue-300 rounded-xl p-3 text-center">
                <p className="text-blue-700 font-bold text-sm">{t('contract_view.contractCompleted')}</p>
              </div>
            )}
          </div>

          {/* Scroll footer */}
          <div className="bg-amber-800 rounded-b-xl px-6 py-3 text-center">
            <p className="text-amber-300 text-xs">
              {t('contract_view.date')}: {new Date(contract.created_at).toLocaleDateString(i18n.language)}
            </p>
          </div>
        </div>

        {/* Scroll decorative bottom */}
        <div className="flex justify-center mt-2 mb-6">
          <div className="bg-amber-700 h-4 w-full max-w-sm rounded-full opacity-60" />
        </div>

        {/* Action buttons */}
        {contract.status === 'pending' && !contract.child_accepted && (
          <div className="space-y-3 px-1">
            <p className="text-center text-amber-300 text-sm font-bold">{t('contract_view.signPrompt')}</p>
            <button
              onClick={handleAccept}
              className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-green-900/30 text-lg"
            >
              ✍️ {t('contract_view.accept')}
            </button>
            <button
              onClick={handleReject}
              className="w-full bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-300 font-bold py-3 rounded-2xl transition-all text-sm"
            >
              {t('contract_view.reject')}
            </button>
          </div>
        )}

        {(contract.status === 'active' || contract.status === 'completed') && (
          <button onClick={() => nav('/child')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl transition-all">
            {t('contract_view.goQuests')}
          </button>
        )}

        {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}
      </div>
    </div>
  );
}
