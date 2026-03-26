import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function QuizScreen() {
  const { sessionId } = useParams();
  const { state }     = useLocation();
  const nav           = useNavigate();

  const [questions,    setQuestions]    = useState(state?.questions || []);
  const [contract,     setContract]     = useState(state?.contract  || null);
  const [current,      setCurrent]      = useState(0);
  const [answered,     setAnswered]     = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [correctIdx,   setCorrectIdx]   = useState(null);
  const [isCorrect,    setIsCorrect]    = useState(null);
  const [pointsDelta,  setPointsDelta]  = useState(0);
  const [totalScore,   setTotalScore]   = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(contract?.time_per_question || 30);
  const [loading,      setLoading]      = useState(!state?.questions);
  const [completing,   setCompleting]   = useState(false);
  const timerRef    = useRef(null);
  const answeredRef = useRef(false); // sync guard against timer/click race

  useEffect(() => {
    if (!state?.questions) {
      // Fallback: fetch session (shouldn't happen normally)
      nav('/child');
    }
  }, []);

  const goNext = useCallback(() => {
    answeredRef.current = false; // reset for the next question
    if (current < questions.length - 1) {
      setCurrent(i => i + 1);
      setAnswered(false);
      setSelected(null);
      setCorrectIdx(null);
      setIsCorrect(null);
      setPointsDelta(0);
      setTimeLeft(contract?.time_per_question || 30);
    } else {
      // Complete session
      setCompleting(true);
      api.post(`/quiz/sessions/${sessionId}/complete`)
        .then(({ data }) => nav(`/child/results/${sessionId}`, { state: { session: data, contract } }))
        .catch(() => nav('/child'));
    }
  }, [current, questions.length, sessionId, contract, nav]);

  // Timer
  useEffect(() => {
    if (answered || loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(-1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current, answered, loading]);

  const handleAnswer = async (answerIndex) => {
    if (answeredRef.current) return;   // sync check — beats stale-closure timer
    answeredRef.current = true;
    clearInterval(timerRef.current);
    setAnswered(true);
    setSelected(answerIndex);

    try {
      const { data } = await api.post(`/quiz/sessions/${sessionId}/answer`, {
        question_id: questions[current].id,
        answer_index: answerIndex,
        time_taken: (contract?.time_per_question || 30) - timeLeft,
      });
      setIsCorrect(data.isCorrect);
      setCorrectIdx(data.correctIndex);
      setPointsDelta(data.points);
      setTotalScore(s => s + Math.max(0, data.points));
    } catch (err) {
      // If the timer already submitted -1 before the click (409), the response
      // still carries the correct index so we can show it.
      const d = err?.response?.data;
      if (d?.correctIndex !== undefined) {
        setIsCorrect(d.isCorrect ?? false);
        setCorrectIdx(d.correctIndex);
        setPointsDelta(d.points ?? 0);
      } else {
        // Pure network error — show neutral timeout state
        setIsCorrect(false);
        setCorrectIdx(null);
      }
    }
  };

  if (loading || completing) return (
    <div className="min-h-screen bg-blue-700 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl animate-spin mb-4">⏳</div>
        <p className="text-xl font-bold">{completing ? 'Ergebnisse werden berechnet…' : 'Laden…'}</p>
      </div>
    </div>
  );

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;
  const timeColor = timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-yellow-400' : 'text-green-400';
  const timerPct  = (timeLeft / (contract?.time_per_question || 30)) * 100;
  const strokeDash = (timerPct / 100) * 251.2;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-blue-900 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-4">
        <div className="flex justify-between items-center text-white text-sm mb-2">
          <span>{'Frage'} {current + 1} / {questions.length}</span>
          <span className="font-bold text-amber-300">🪙 {totalScore}</span>
        </div>
        <div className="w-full bg-blue-600 rounded-full h-2">
          <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Timer circle */}
      <div className="relative w-24 h-24 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={timeLeft <= 5 ? '#f87171' : timeLeft <= 10 ? '#facc15' : '#34d399'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} 251.2`}
            style={{ transition: 'stroke-dasharray 0.9s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${timeColor}`}>{timeLeft}</span>
          <span className="text-blue-200 text-xs">{'Sek'}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="w-full max-w-md bg-white rounded-2xl p-5 mb-4 shadow-2xl">
        <p className="text-xs text-slate-400 font-bold uppercase mb-3">{contract?.subject_name}</p>
        <h2 className="text-xl font-black text-slate-900 text-center mb-6 leading-tight">{q.text}</h2>

        {/* Answers grid */}
        <div className="grid grid-cols-2 gap-3">
          {q.answers.map((ans, i) => {
            let cls = 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95 cursor-pointer';
            if (answered) {
              if (i === correctIdx) cls = 'bg-green-500 text-white scale-105 shadow-lg shadow-green-300';
              else if (i === selected && !isCorrect) cls = 'bg-red-500 text-white animate-pulse';
              else cls = 'bg-slate-100 text-slate-400 opacity-50 cursor-default';
            }
            return (
              <button
                key={i}
                onClick={() => !answered && handleAnswer(i)}
                disabled={answered}
                className={`p-4 rounded-xl font-semibold text-sm transition-all ${cls}`}
              >
                {ans}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`w-full max-w-md rounded-2xl p-4 text-center mb-4 ${isCorrect ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {isCorrect ? (
            <>
              <p className="text-2xl font-black">✅ {'Richtig!'}</p>
              <p className="text-green-200 text-sm">+{pointsDelta} 🪙</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black">❌ {selected === -1 ? 'Zeit abgelaufen!' : 'Falsch'}</p>
              {correctIdx !== null && (
                <p className="text-red-200 text-sm mt-1">{'Richtige Antwort'}: <span className="font-bold text-white">{q.answers[correctIdx]}</span></p>
              )}
              {pointsDelta < 0 && <p className="text-red-200 text-xs mt-0.5">{pointsDelta} 🪙</p>}
            </>
          )}
        </div>
      )}

      {answered && (
        <button
          onClick={goNext}
          className="w-full max-w-md bg-white text-blue-700 font-black py-4 rounded-2xl active:scale-95 transition-all shadow-lg text-lg"
        >
          {current < questions.length - 1 ? 'Weiter →' : 'Quiz beenden 🏁'}
        </button>
      )}
    </div>
  );
}
