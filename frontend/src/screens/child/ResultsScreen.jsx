import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

function Confetti() {
  const emojis = ['🌟','✨','🎊','🎉','⭐','💛','🏆','🥇','🎯','💎'];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-10">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-2xl animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top:  `${Math.random() * 80}%`,
            animationDelay: `${Math.random() * 1.5}s`,
            animationDuration: `${0.8 + Math.random() * 0.8}s`,
          }}
        >
          {emojis[i % emojis.length]}
        </span>
      ))}
    </div>
  );
}

function Star({ active, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <span className={`text-5xl transition-all duration-500 ${show ? 'scale-125 opacity-100' : 'scale-50 opacity-0'}`}>
      {active ? '⭐' : '☆'}
    </span>
  );
}

const GRADES = { '5': 'Klasse 5', '6': 'Klasse 6', '7': 'Klasse 7', '8': 'Klasse 8', '9': 'Klasse 9' };

export default function ResultsScreen() {
  const { sessionId } = useParams();
  const { state }     = useLocation();
  const nav           = useNavigate();
  const { refreshUser } = useAuth();

  const [session,  setSession]  = useState(state?.session  || null);
  const [contract, setContract] = useState(state?.contract || null);
  const [loading,  setLoading]  = useState(!state?.session);
  const refreshed = useRef(false);

  useEffect(() => {
    if (!state?.session) {
      api.get(`/quiz/sessions/${sessionId}`)
        .then(({ data }) => setSession(data))
        .catch(() => nav('/child'))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (session && !refreshed.current) {
      refreshed.current = true;
      // Refresh user coins in header
      if (typeof refreshUser === 'function') refreshUser();
    }
  }, [session]);

  if (loading) return (
    <div className="min-h-screen bg-indigo-700 flex items-center justify-center">
      <div className="text-5xl animate-spin">🏆</div>
    </div>
  );

  const total   = session.total_count  || 1;
  const correct = session.correct_count || 0;
  const pct     = Math.round((correct / total) * 100);
  const coins   = session.score || 0;
  const stars   = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
  const great   = pct >= 70;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${great ? 'bg-gradient-to-b from-indigo-700 to-purple-800' : 'bg-gradient-to-b from-slate-700 to-slate-900'}`}>
      {great && <Confetti />}

      <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl relative z-20">
        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          <Star active={stars >= 1} delay={200} />
          <Star active={stars >= 2} delay={500} />
          <Star active={stars >= 3} delay={800} />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-1">
          {pct >= 90 ? 'Ausgezeichnet! 🥇' : pct >= 70 ? 'Sehr gut! 🎉' : 'Nicht schlecht! 💪'}
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          {contract ? `${contract.subject_name} · ${(GRADES[contract.grade] || contract.grade)}` : 'Quiz beenden 🏁'.replace(' 🏁', '')}
        </p>

        {/* Big score */}
        <div className="text-6xl font-black mb-1" style={{ color: great ? '#6366f1' : '#94a3b8' }}>
          {pct}%
        </div>
        <p className="text-slate-500 text-sm mb-6">{correct} / {total} {'Richtig'.toLowerCase()}</p>

        {/* Stats row */}
        <div className="flex justify-around bg-slate-50 rounded-2xl p-4 mb-6">
          <div>
            <div className="text-2xl font-black text-green-600">{correct}</div>
            <div className="text-xs text-slate-500">{'Richtig'}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-500">{total - correct}</div>
            <div className="text-xs text-slate-500">{'Fehler'}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-500">+{coins}</div>
            <div className="text-xs text-slate-500">{'Münzen'}</div>
          </div>
        </div>

        {/* Contract progress */}
        {contract && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 text-left">
            <p className="text-xs font-bold text-amber-700 mb-1">🏆 {'Aufgabe'}: {contract.prize_name}</p>
            <div className="w-full bg-amber-100 rounded-full h-2.5">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((contract.current_coins + coins) / contract.target_coins) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-amber-600 mt-1 text-right">
              {Math.min(contract.target_coins, contract.current_coins + coins)} / {contract.target_coins} 🪙
            </p>
          </div>
        )}

        {/* Buttons */}
        <button
          onClick={() => nav('/child')}
          className="w-full bg-indigo-600 text-white font-black py-3.5 rounded-xl mb-3 active:scale-95 transition"
        >
          {'Startseite 🏠'}
        </button>
        {contract && (
          <button
            onClick={() => nav(`/child/contract/${contract.id}`)}
            className="w-full bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl active:scale-95 transition text-sm"
          >
            {'Zur Aufgabe →'}
          </button>
        )}
      </div>
    </div>
  );
}
