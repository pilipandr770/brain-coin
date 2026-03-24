import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Zap, BookOpen, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-slate-500 text-xs">{label}</p>
      </div>
    </div>
  );
}

function SubjectRow({ subject, lang }) {
  const { t } = useTranslation();
  const name = lang === 'de' ? subject.name_de : lang === 'en' ? subject.name_en : subject.subject_name;
  const total = subject.correct + subject.wrong;
  const pct = total > 0 ? Math.round((subject.correct / total) * 100) : 0;
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{subject.subject_emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{name || subject.subject_name}</p>
        </div>
        <div className="text-right shrink-0 text-xs text-slate-500">
          <span className="text-green-600 font-bold">{subject.correct}✓</span>
          {' · '}
          <span className="text-red-500 font-bold">{subject.wrong}✗</span>
          {subject.mastered > 0 && (
            <span className="text-blue-500 ml-1">· {subject.mastered} {t('stats.masteredShort')}</span>
          )}
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1 text-right">{pct}% {t('stats.correctShort')}</p>
    </div>
  );
}

export default function ParentStats() {
  const { childId } = useParams();
  const nav         = useNavigate();
  const { t, i18n } = useTranslation();

  const [stats,   setStats]   = useState(null);
  const [child,   setChild]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/quiz/stats/child/${childId}`),
      api.get('/auth/children'),
    ])
      .then(([statsRes, childrenRes]) => {
        setStats(statsRes.data);
        const found = childrenRes.data.find(c => String(c.id) === String(childId));
        setChild(found || null);
      })
      .catch(err => setError(err?.response?.data?.error || t('common.error')))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 gap-3">
      <div className="text-4xl animate-spin">⏳</div>
      <p className="text-slate-500">{t('stats.loading')}</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 gap-3 p-4">
      <div className="text-4xl">😢</div>
      <p className="text-slate-600 text-center">{error}</p>
      <button onClick={() => nav('/parent')} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl">
        {t('common.back')}
      </button>
    </div>
  );

  const lang = i18n.language;
  const hasData = stats.total_sessions > 0;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => nav('/parent')} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl">{child?.avatar_emoji || '🎮'}</span>
            <div>
              <h1 className="font-black text-base leading-tight">{child?.name || '...'}</h1>
              <p className="text-blue-200 text-xs">{t('stats.title')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-5">
        {!hasData ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-slate-600">{t('stats.noData')}</p>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Clock className="w-5 h-5 text-blue-600" />}
                label={t('stats.sessions')}
                value={stats.total_sessions}
                color="bg-blue-100"
              />
              <StatCard
                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                label={t('stats.correct')}
                value={stats.total_correct}
                color="bg-green-100"
              />
              <StatCard
                icon={<XCircle className="w-5 h-5 text-red-500" />}
                label={t('stats.wrong')}
                value={stats.total_wrong}
                color="bg-red-100"
              />
              <StatCard
                icon={<Zap className="w-5 h-5 text-amber-500" />}
                label={t('stats.mastered')}
                value={stats.mastered_questions}
                color="bg-amber-100"
              />
            </div>

            {/* Accuracy bar */}
            {(stats.total_correct + stats.total_wrong) > 0 && (() => {
              const total = stats.total_correct + stats.total_wrong;
              const pct   = Math.round((stats.total_correct / total) * 100);
              const color = pct >= 70 ? 'from-green-500 to-emerald-400' : pct >= 40 ? 'from-yellow-500 to-amber-400' : 'from-red-500 to-orange-400';
              return (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-slate-700 text-sm">{t('stats.correctShort')} %</p>
                    <p className="font-black text-2xl text-slate-900">{pct}%</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className={`bg-gradient-to-r ${color} h-4 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* By subject */}
            {stats.bySubject?.length > 0 && (
              <section>
                <h2 className="font-black text-slate-800 text-base mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> {t('stats.bySubject')}
                </h2>
                <div className="space-y-2">
                  {stats.bySubject.map(s => (
                    <SubjectRow key={s.subject_id} subject={s} lang={lang} />
                  ))}
                </div>
              </section>
            )}

            {/* Weak spots */}
            {stats.weakTopics?.length > 0 && (
              <section>
                <h2 className="font-black text-slate-800 text-base mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" /> {t('stats.weakTopics')}
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  {stats.weakTopics.map((q, i) => (
                    <div key={q.id} className={`flex items-start gap-3 px-4 py-3 ${i < stats.weakTopics.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <span className="text-red-400 font-black text-sm shrink-0 w-5 text-center">{q.wrong_count}×</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 text-sm leading-snug line-clamp-2">{q.text}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{q.subject_emoji} {q.subject_name}</p>
                      </div>
                      {q.correct_count > 0 && (
                        <span className="text-green-500 text-xs shrink-0">{q.correct_count}✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent sessions */}
            {stats.recentSessions?.length > 0 && (
              <section>
                <h2 className="font-black text-slate-800 text-base mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" /> {t('stats.recentSessions')}
                </h2>
                <div className="space-y-2">
                  {stats.recentSessions.map(s => {
                    const pct = s.total_count > 0 ? Math.round((s.correct_count / s.total_count) * 100) : 0;
                    const date = s.completed_at
                      ? new Date(s.completed_at).toLocaleDateString(lang, { day: 'numeric', month: 'short' })
                      : '';
                    return (
                      <div key={s.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3">
                        <span className="text-xl shrink-0">{s.subject_emoji || '📚'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{s.contract_title || s.subject_name || '—'}</p>
                          <p className="text-slate-400 text-xs">{date}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-sm text-slate-900">{pct}%</p>
                          <p className="text-xs text-slate-500">{s.correct_count}/{s.total_count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
