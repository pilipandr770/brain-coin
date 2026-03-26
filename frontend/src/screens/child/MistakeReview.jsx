import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

function SubjectGroup({ subjectEmoji, subjectName, questions, onPractice, starting }) {
  const ids = questions.map(q => q.id);
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-4">
      {/* Subject header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">{subjectEmoji}</span>
          <span className="font-bold text-white text-sm">{subjectName}</span>
        </div>
        <button
          onClick={() => onPractice(ids)}
          disabled={starting}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
        >
          <Dumbbell className="w-3.5 h-3.5" />
          {'Üben'} ({Math.min(ids.length, 10)})
        </button>
      </div>

      {/* Question list */}
      <div className="divide-y divide-slate-700">
        {questions.map(q => (
          <div key={q.id} className="flex items-start gap-3 px-4 py-2.5">
            <span className="mt-0.5 text-red-400 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm leading-snug line-clamp-2">{q.text}</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-red-400 text-xs font-bold">{q.wrong_count}×</span>
              {q.correct_count > 0 && (
                <p className="text-green-400 text-xs">{q.correct_count}✓</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MistakeReview() {
  const nav        = useNavigate();
  const { user }   = useAuth();

  const [mistakes,  setMistakes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [starting,  setStarting]  = useState(false);

  useEffect(() => {
    api.get('/quiz/mistakes')
      .then(({ data }) => setMistakes(data))
      .catch(() => setMistakes([]))
      .finally(() => setLoading(false));
  }, []);

  const startPractice = async (ids) => {
    setStarting(true);
    try {
      const { data } = await api.post('/quiz/sessions/practice', { question_ids: ids });
      nav(`/child/quiz/${data.session.id}`, {
        state: {
          session: data.session,
          questions: data.questions,
          contract: null,
          practice: true,
        },
      });
    } catch (err) {
      alert(err?.response?.data?.error || 'Fehler');
      setStarting(false);
    }
  };

  // Group by subject
  const grouped = mistakes.reduce((acc, q) => {
    const key = q.subject_id;
    if (!acc[key]) {
      const lang = 'de-DE';
      const name = lang === 'de' ? q.name_de : lang === 'en' ? q.name_en : q.subject_name;
      acc[key] = { subjectName: name || q.subject_name, subjectEmoji: q.subject_emoji, questions: [] };
    }
    acc[key].questions.push(q);
    return acc;
  }, {});

  const allIds = mistakes.map(q => q.id).slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-orange-700 text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => nav('/child')} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-lg leading-tight">🔴 {'Fehleranalyse'}</h1>
            <p className="text-orange-200 text-xs">{'Fragen, bei denen du Fehler gemacht hast'}</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-4xl animate-spin">⏳</div>
            <p className="text-slate-400">{'Fehler werden geladen…'}</p>
          </div>
        ) : mistakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-6xl">🎉</div>
            <p className="text-white font-bold text-xl text-center">{'Keine Fehler! Weiter so! 🎉'}</p>
            <p className="text-slate-400 text-sm text-center">{'Sehr gut! Mach weiter so!'}</p>
            <button
              onClick={() => nav('/child')}
              className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95"
            >
              🏠 {'Zurück'}
            </button>
          </div>
        ) : (
          <>
            {/* Practice all button */}
            <button
              onClick={() => startPractice(allIds)}
              disabled={starting}
              className="w-full mb-6 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 text-sm"
            >
              {starting ? (
                <><span className="animate-spin text-lg">⏳</span> {'Laden…'}</>
              ) : (
                <><Dumbbell className="w-4 h-4" /> {'Alle Fehler üben'} ({Math.min(mistakes.length, 10)})</>
              )}
            </button>

            {/* Subject groups */}
            {Object.values(grouped).map((group, i) => (
              <SubjectGroup
                key={i}
                subjectEmoji={group.subjectEmoji}
                subjectName={group.subjectName}
                questions={group.questions}
                onPractice={startPractice}
                starting={starting}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
