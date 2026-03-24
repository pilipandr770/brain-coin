import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

function QuestCard({ contract, onStart, starting }) {
  const { t } = useTranslation();
  const pct = Math.round((contract.current_coins / contract.target_coins) * 100);
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      {/* Top */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-blue-600/20 rounded-xl p-2.5">
            <span className="text-2xl">{contract.subject_emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white truncate">{contract.title}</h3>
            <p className="text-slate-400 text-xs">{contract.subject_name} · {t('grades.' + contract.grade)}</p>
            <p className="text-slate-500 text-xs">👨‍👩‍👧 {contract.parent_name}</p>
          </div>
          <span className="text-xl shrink-0">{contract.prize_emoji}</span>
        </div>

        {/* Prize */}
        <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/30 rounded-xl p-3 mb-3">
          <p className="text-xs text-amber-400 mb-0.5">🏆 {t('child.reward')}</p>
          <p className="text-amber-300 font-bold text-sm">{contract.prize_name}</p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{t('child.progress')}</span>
            <span className="text-amber-400 font-bold">{contract.current_coins} / {contract.target_coins} 🪙</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>🚀</span>
            <span className="text-green-400 font-bold">{pct}%</span>
            <span>🎯</span>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <button
        onClick={() => !starting && onStart(contract)}
        disabled={starting}
        className={`w-full py-3 font-bold text-white flex items-center justify-center gap-2 transition-all ${
          starting ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 active:scale-95'
        }`}
      >
        {starting ? (
          <><span className="animate-spin text-lg">⏳</span> {t('quiz.loading')}</>
        ) : (
          <><Play className="w-4 h-4" /> {t('child.startTest')}</>
        )}
      </button>
    </div>
  );
}

function PendingContractCard({ contract, onView }) {
  const { t } = useTranslation();
  return (
    <div className="bg-slate-800 rounded-2xl border-2 border-yellow-600/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-yellow-400 text-lg">📜</span>
        <div>
          <h4 className="font-bold text-white text-sm">{contract.title}</h4>
          <p className="text-slate-400 text-xs">{contract.subject_name} · {t('grades.' + contract.grade)}</p>
        </div>
      </div>
      <p className="text-yellow-400 text-xs mb-3">⏳ {t('child.awaitingConfirm')}</p>
      <button onClick={() => onView(contract)}
        className="w-full bg-yellow-600 hover:bg-yellow-500 active:scale-95 py-2 font-bold text-white rounded-xl text-sm transition-all">
        {t('child.viewContract')} 📜
      </button>
    </div>
  );
}

export default function ChildHome() {
  const nav       = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [contracts, setContracts] = useState([]);
  const [parents,   setParents]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [inviteCode,setInviteCode]= useState(null);
  const [inviteInput,setInviteInput] = useState('');
  const [inviteMode, setInviteMode]  = useState(false);
  const [genLoading, setGenLoading]  = useState(false);
  const [startingQuiz, setStartingQuiz] = useState(null); // contract id being started
  const [acceptMsg,  setAcceptMsg]   = useState('');
  const [acceptErr,  setAcceptErr]   = useState('');

  const load = () =>
    Promise.all([api.get('/contracts'), api.get('/auth/parents')])
      .then(([c, p]) => { setContracts(c.data); setParents(p.data); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const startQuiz = async (contract) => {
    setStartingQuiz(contract.id);
    try {
      const { data } = await api.post('/quiz/sessions', { contract_id: contract.id });
      nav(`/child/quiz/${data.session.id}`, { state: { session: data.session, questions: data.questions, contract } });
    } catch (err) {
      alert(err.response?.data?.error || t('common.error'));
      setStartingQuiz(null);
    }
  };

  const generateInvite = async () => {
    setGenLoading(true);
    try {
      const { data } = await api.post('/auth/invite/generate');
      setInviteCode(data.code);
    } finally {
      setGenLoading(false);
    }
  };

  const acceptInvite = async () => {
    setAcceptErr('');
    try {
      const { data } = await api.post('/auth/invite/accept', { code: inviteInput.trim().toUpperCase() });
      setAcceptMsg(`✅ ${t('invite.success')} ${data.linkedUser?.name}!`);
      setInviteInput('');
      load();
      refreshUser();
    } catch (err) {
      setAcceptErr(err.response?.data?.error || t('common.error'));
    }
  };

  const pendingContracts = contracts.filter(c => c.status === 'pending' && !c.child_accepted);
  const activeContracts  = contracts.filter(c => c.status === 'active');
  const doneContracts    = contracts.filter(c => c.status === 'completed');

  if (loading) return <div className="flex items-center justify-center h-64 text-4xl animate-spin">⏳</div>;

  if (startingQuiz) return (
    <div className="fixed inset-0 bg-blue-900/95 flex flex-col items-center justify-center z-50">
      <div className="text-8xl animate-spin mb-6">🧠</div>
      <p className="text-white text-2xl font-black mb-2">{t('quiz.generating')}</p>
      <p className="text-blue-300 text-sm">{t('quiz.generatingDesc')}</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Streak / welcome */}
      <div className="bg-gradient-to-r from-orange-600 to-red-500 rounded-2xl p-4 text-white shadow-lg">
        <p className="text-sm opacity-80">{t('child.greeting')}, {user?.name}! 👋</p>
        <p className="text-2xl font-black">🔥 {t('child.brainCharge')}</p>
        <p className="text-sm opacity-80 mt-0.5">{activeContracts.length} {t('child.activeQuestsLabel')}</p>
      </div>

      {/* Invite parent section */}
      {parents.length === 0 && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-violet-600/30">
          <h3 className="font-bold text-white mb-2">👨‍👩‍👧 {t('child.inviteParent')}</h3>
          <p className="text-slate-400 text-sm mb-3">{t('child.inviteParentDesc')}</p>

          {!inviteMode ? (
            <div className="space-y-2">
              <button onClick={() => { setInviteMode(true); generateInvite(); }}
                className="w-full bg-violet-700 hover:bg-violet-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                📨 {t('child.generateCode')}
              </button>
              <button onClick={() => setInviteMode('enter')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                🔑 {t('child.enterCode')}
              </button>
            </div>
          ) : inviteMode === 'enter' ? (
            <div className="space-y-2">
              <input value={inviteInput} onChange={e => setInviteInput(e.target.value)}
                placeholder={t('child.codePlaceholder')}
                className="w-full bg-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none font-mono tracking-widest uppercase focus:ring-2 ring-violet-500" />
              {acceptErr && <p className="text-red-400 text-xs">{acceptErr}</p>}
              {acceptMsg && <p className="text-green-400 text-xs">{acceptMsg}</p>}
              <div className="flex gap-2">
                <button onClick={() => setInviteMode(false)} className="flex-1 bg-slate-700 text-white font-bold py-2 rounded-xl text-sm">{t('common.back')}</button>
                <button onClick={acceptInvite} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-xl text-sm">{t('child.accept')} ✅</button>
              </div>
            </div>
          ) : (
            <div>
              {genLoading ? (
                <div className="text-center py-3 text-3xl animate-spin">⏳</div>
              ) : inviteCode ? (
                <>
                  <div className="bg-violet-900/50 rounded-xl p-4 text-center mb-2">
                    <p className="text-violet-300 text-xs mb-1">{t('child.sendCodeToParent')}</p>
                    <p className="text-3xl font-black font-mono tracking-widest text-white">{inviteCode}</p>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`)}
                    className="w-full bg-violet-700 hover:bg-violet-600 text-white font-bold py-2 rounded-xl text-sm">
                    📋 {t('parent.copyLink')}
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Pending contracts */}
      {pendingContracts.length > 0 && (
        <section>
          <h2 className="text-base font-black text-yellow-400 mb-3">📜 {t('child.newContracts')}</h2>
          <div className="space-y-3">
            {pendingContracts.map(c => (
              <PendingContractCard key={c.id} contract={c} onView={ct => nav(`/child/contract/${ct.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Active quests */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-white">🗡️ {t('child.activeQuests')}</h2>
          <button
            onClick={() => nav('/child/mistakes')}
            className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            🔴 {t('mistakes.title')}
          </button>
        </div>
        {activeContracts.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700">
            <div className="text-4xl mb-2">😴</div>
            <p className="text-slate-400 text-sm">{t('child.noQuests')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeContracts.map(c => <QuestCard key={c.id} contract={c} onStart={startQuiz} starting={startingQuiz === c.id} />)}
          </div>
        )}
      </section>

      {/* Completed */}
      {doneContracts.length > 0 && (
        <section>
          <h2 className="text-base font-black text-green-400 mb-3">✅ {t('child.completedQuests')}</h2>
          <div className="space-y-2">
            {doneContracts.map(c => (
              <div key={c.id} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3 border border-green-800/30">
                <span className="text-xl">{c.prize_emoji}</span>
                <div>
                  <p className="font-bold text-white text-sm">{c.title}</p>
                  <p className="text-green-400 text-xs">{t('child.reward')}: {c.prize_name}</p>
                </div>
                <span className="ml-auto text-green-400 text-xl">✅</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
