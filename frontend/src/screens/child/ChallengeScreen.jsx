import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

// ── Mini-quiz for a challenge ────────────────────────────────────────────────
function ChallengeQuiz({ challenge, onDone, onClose }) {
  const [questions,  setQuestions]  = useState([]);
  const [current,    setCurrent]    = useState(0);
  const [selected,   setSelected]   = useState(null);
  const [answered,   setAnswered]   = useState(false);
  const [score,      setScore]      = useState(0);
  const [finished,   setFinished]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    api.get(`/social/challenges/${challenge.id}/questions`)
      .then(({ data }) => setQuestions(data))
      .catch(err => setError(err.response?.data?.error || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [challenge.id]);

  const handleSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const q = questions[current];
    const isCorrect = parseInt(q.correct_answer, 10) === idx;
    if (isCorrect) setScore(s => s + 1);
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/social/challenges/${challenge.id}/score`, { score });
      onDone(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Einreichen');
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="text-4xl animate-spin">⏳</div>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-bold">Schließen</button>
      </div>
    </div>
  );

  if (finished) return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-5xl mb-3">{score >= 4 ? '🏆' : score >= 2 ? '👍' : '😅'}</div>
        <h2 className="text-xl font-black text-gray-800 mb-1">Ergebnis</h2>
        <p className="text-4xl font-black text-indigo-600 mb-2">{score} / 5</p>
        <p className="text-gray-500 text-sm mb-5">
          {challenge.challenged_name && (
            <>Warte auf {challenge.challenger_id === challenge.my_id ? challenge.challenged_name : challenge.challenger_name}…</>
          )}
        </p>
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50"
        >
          {submitting ? '⏳ Senden…' : '✓ Ergebnis einreichen'}
        </button>
      </div>
    </div>
  );

  const q = questions[current];
  const opts = Array.isArray(q.options) ? q.options : [];
  const correctIdx = parseInt(q.correct_answer, 10);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Progress */}
        <div className="bg-slate-700 px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
          <div className="flex-1">
            <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${((current) / questions.length) * 100}%` }} />
            </div>
          </div>
          <span className="text-slate-400 text-sm font-bold">{current + 1}/{questions.length}</span>
        </div>

        {/* Subject badge */}
        <div className="px-4 pt-4">
          <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full font-bold">
            {challenge.subject_emoji} {challenge.subject_name} · Klasse {challenge.grade}
          </span>
        </div>

        {/* Question */}
        <div className="px-4 pt-3 pb-4">
          <p className="text-white font-bold text-base leading-snug">{q.question_text}</p>
        </div>

        {/* Options */}
        <div className="px-4 pb-4 space-y-2">
          {opts.map((opt, idx) => {
            let cls = 'w-full text-left px-4 py-3 rounded-xl text-sm font-medium border-2 transition ';
            if (!answered) {
              cls += 'border-slate-600 bg-slate-700 text-white hover:border-indigo-400 active:scale-95';
            } else if (idx === correctIdx) {
              cls += 'border-green-400 bg-green-900 text-white';
            } else if (idx === selected) {
              cls += 'border-red-400 bg-red-900 text-white';
            } else {
              cls += 'border-slate-700 bg-slate-800 text-slate-500';
            }
            return (
              <button key={idx} onClick={() => handleSelect(idx)} className={cls}>
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="px-4 pb-4">
            {q.explanation && (
              <p className="text-slate-400 text-xs mb-3 bg-slate-700 px-3 py-2 rounded-lg">{q.explanation}</p>
            )}
            <button
              onClick={next}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition active:scale-95"
            >
              {current + 1 >= questions.length ? 'Ergebnis sehen →' : 'Weiter →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Send challenge modal ─────────────────────────────────────────────────────
function SendChallengeModal({ friend, onSent, onClose }) {
  const [subjects,  setSubjects]  = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [grade,     setGrade]     = useState('');
  const [grades,    setGrades]    = useState([]);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    api.get('/quiz/subjects').then(({ data }) => {
      setSubjects(data);
      if (data[0]) {
        setSubjectId(String(data[0].id));
        setGrades(data[0].grades || []);
        setGrade(String(data[0].grades?.[0] || ''));
      }
    });
  }, []);

  const handleSubjectChange = (id) => {
    setSubjectId(id);
    const sub = subjects.find(s => String(s.id) === id);
    const g = sub?.grades || [];
    setGrades(g);
    setGrade(String(g[0] || ''));
    setError('');
  };

  const send = async () => {
    if (!subjectId || !grade) return;
    setSending(true); setError('');
    try {
      await api.post('/social/challenges', {
        friend_id: friend.friend_id,
        subject_id: parseInt(subjectId, 10),
        grade: parseInt(grade, 10),
      });
      onSent();
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler');
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{friend.friend_avatar}</span>
          <div>
            <p className="font-black text-gray-800">{friend.friend_name}</p>
            <p className="text-xs text-gray-400">herausfordern</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Fach</label>
            <select value={subjectId} onChange={e => handleSubjectChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {subjects.map(s => (
                <option key={s.id} value={String(s.id)}>{s.emoji} {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Klasse</label>
            <div className="flex gap-2 flex-wrap">
              {grades.map(g => (
                <button key={g} type="button" onClick={() => setGrade(String(g))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition ${String(grade) === String(g) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>
                  {g}.
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={send} disabled={sending || !subjectId || !grade}
          className="w-full mt-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-3 rounded-xl text-sm transition">
          {sending ? '⏳ Senden…' : '⚡ Herausforderung schicken'}
        </button>
      </div>
    </div>
  );
}

// ── Challenge card ────────────────────────────────────────────────────────────
function ChallengeCard({ ch, myId, onAction, onPlay }) {
  const isChallenger = ch.challenger_id === myId;
  const opponentName = isChallenger ? ch.challenged_name : ch.challenger_name;
  const opponentAvatar = isChallenger ? ch.challenged_avatar : ch.challenger_avatar;
  const myScore    = isChallenger ? ch.challenger_score : ch.challenged_score;
  const theirScore = isChallenger ? ch.challenged_score : ch.challenger_score;

  const statusLabel = {
    pending:  isChallenger ? '⏳ Wartet auf Annahme' : '⚡ Fordert dich heraus!',
    active:   myScore !== null ? '⏳ Warte auf Gegner' : '▶ Dein Zug!',
    done:     myScore > theirScore ? '🏆 Gewonnen!' : myScore < theirScore ? '😅 Verloren' : '🤝 Unentschieden',
    rejected: '❌ Abgelehnt',
  }[ch.status] || ch.status;

  const statusColor = {
    pending:  isChallenger ? 'text-amber-400' : 'text-indigo-400',
    active:   myScore !== null ? 'text-slate-400' : 'text-green-400',
    done:     myScore > theirScore ? 'text-yellow-400' : myScore < theirScore ? 'text-red-400' : 'text-slate-400',
    rejected: 'text-red-400',
  }[ch.status] || 'text-slate-400';

  return (
    <div className="bg-slate-800 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{opponentAvatar || '👤'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{opponentName}</p>
          <p className="text-xs text-slate-400">{ch.subject_emoji} {ch.subject_name} · Kl. {ch.grade}</p>
          <p className={`text-xs font-bold mt-0.5 ${statusColor}`}>{statusLabel}</p>
        </div>
        {ch.status === 'done' && (
          <div className="text-right">
            <p className="text-lg font-black text-white">{myScore} <span className="text-slate-500">vs</span> {theirScore}</p>
          </div>
        )}
        <div className="flex flex-col gap-1.5 ml-2">
          {ch.status === 'pending' && !isChallenger && (
            <>
              <button onClick={() => onAction(ch.id, 'accept')}
                className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95">✓</button>
              <button onClick={() => onAction(ch.id, 'reject')}
                className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95">✕</button>
            </>
          )}
          {ch.status === 'active' && myScore === null && (
            <button onClick={() => onPlay(ch)}
              className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95">▶ Start</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChallengeScreen() {
  const { user } = useAuth();
  const { state: routeState } = useLocation();

  const [challenges,   setChallenges]   = useState([]);
  const [friends,      setFriends]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [challengeTarget, setChallengeTarget] = useState(routeState?.newChallengeFriend || null);
  const [activeQuiz,   setActiveQuiz]   = useState(null);       // challenge being played

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/social/challenges'),
      api.get('/social/friends'),
    ]).then(([c, f]) => {
      setChallenges(c.data);
      setFriends(f.data.filter(f => f.status === 'accepted'));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/social/challenges/${id}/${action}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Fehler');
    }
  };

  const handleQuizDone = (updatedChallenge) => {
    setActiveQuiz(null);
    load();
  };

  const pending  = challenges.filter(c => c.status === 'pending');
  const active   = challenges.filter(c => c.status === 'active');
  const done     = challenges.filter(c => c.status === 'done' || c.status === 'rejected');

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-5 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-black text-white">⚡ Herausforderungen</h1>
        </div>
        {pending.filter(c => c.challenged_id === user?.id).length > 0 && (
          <div className="mt-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full inline-block">
            {pending.filter(c => c.challenged_id === user?.id).length} neue
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {loading ? (
          <div className="text-center text-slate-400 py-12 text-3xl animate-spin">⏳</div>
        ) : (
          <>
            {/* Send new challenge */}
            {friends.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Freund herausfordern</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {friends.map(f => (
                    <button key={f.id} onClick={() => setChallengeTarget(f)}
                      className="flex flex-col items-center gap-1 flex-shrink-0 bg-slate-800 rounded-xl px-3 py-2 active:scale-95 transition">
                      <span className="text-2xl">{f.friend_avatar || '👤'}</span>
                      <span className="text-xs text-white font-medium max-w-[64px] truncate">{f.friend_name}</span>
                      <span className="text-[10px] text-indigo-400 font-bold">⚡ Challenge</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pending / incoming */}
            {pending.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Ausstehend</p>
                <div className="space-y-2">
                  {pending.map(ch => (
                    <ChallengeCard key={ch.id} ch={ch} myId={user?.id}
                      onAction={handleAction} onPlay={setActiveQuiz} />
                  ))}
                </div>
              </div>
            )}

            {/* Active */}
            {active.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Aktiv</p>
                <div className="space-y-2">
                  {active.map(ch => (
                    <ChallengeCard key={ch.id} ch={ch} myId={user?.id}
                      onAction={handleAction} onPlay={setActiveQuiz} />
                  ))}
                </div>
              </div>
            )}

            {/* Done */}
            {done.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Abgeschlossen</p>
                <div className="space-y-2">
                  {done.map(ch => (
                    <ChallengeCard key={ch.id} ch={ch} myId={user?.id}
                      onAction={handleAction} onPlay={() => {}} />
                  ))}
                </div>
              </div>
            )}

            {challenges.length === 0 && friends.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-3">⚡</div>
                <p className="font-bold">Noch keine Herausforderungen</p>
                <p className="text-sm mt-1">Finde Freunde in der Rangliste!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {challengeTarget && (
        <SendChallengeModal
          friend={challengeTarget}
          onSent={() => { setChallengeTarget(null); load(); }}
          onClose={() => setChallengeTarget(null)}
        />
      )}
      {activeQuiz && (
        <ChallengeQuiz
          challenge={activeQuiz}
          onDone={handleQuizDone}
          onClose={() => setActiveQuiz(null)}
        />
      )}
    </div>
  );
}
