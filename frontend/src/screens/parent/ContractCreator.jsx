import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../api';

const GRADES = { '4': 'Klasse 4', '5': 'Klasse 5', '6': 'Klasse 6', '7': 'Klasse 7', '8': 'Klasse 8', '9': 'Klasse 9' };

const PRIZE_EMOJIS = ['🏆','🎮','📱','🎧','🎨','🚀','⚽','🎸','📚','🍕'];

export default function ContractCreator() {
  const nav = useNavigate();
  const [step, setStep]       = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const [form, setForm] = useState({
    child_id:          '',
    subject_id:        '',
    grade:             '5',
    title:             '',
    description:       '',
    prize_name:        '',
    prize_emoji:       '🏆',
    prize_coins:       100,
    points_per_correct: 5,
    penalty_per_wrong:  2,
    time_per_question:  30,
    target_coins:      100,
  });

  const set = (k) => (e) => {
    const v = typeof e === 'object' && e.target ? e.target.value : e;
    if (k === 'subject_id') {
      // When subject changes, reset grade to first valid grade for that subject
      const subj = subjects.find(s => s.id === parseInt(v));
      const validGrades = subj?.grades || ['5'];
      setForm(f => ({ ...f, subject_id: v, grade: validGrades[0] }));
    } else if (k === 'prize_coins') {
      setForm(f => ({ ...f, prize_coins: parseInt(v) || 0, target_coins: parseInt(v) || 0 }));
    } else {
      setForm(f => ({ ...f, [k]: v }));
    }
  };

  useEffect(() => {
    Promise.all([api.get('/quiz/subjects'), api.get('/auth/children')])
      .then(([s, c]) => {
        setSubjects(s.data);
        setChildren(c.data);
        if (c.data.length) setForm(f => ({ ...f, child_id: c.data[0].id }));
        if (s.data.length) {
          const firstSubj = s.data[0];
          setForm(f => ({
            ...f,
            subject_id: firstSubj.id,
            grade: firstSubj.grades?.[0] || '5',
          }));
        }
      });
  }, []);

  const submit = async () => {
    if (!form.child_id || !form.subject_id || !form.title || !form.prize_name) {
      setError('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/contracts', { ...form, prize_coins: parseInt(form.prize_coins), target_coins: parseInt(form.prize_coins) });
      nav('/parent');
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  const selectedSubject = subjects.find(s => s.id === parseInt(form.subject_id));
  const selectedChild   = children.find(c => c.id === parseInt(form.child_id));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => step > 1 ? setStep(s => s-1) : nav('/parent')} className="p-2 hover:bg-slate-100 rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-slate-900">{'Neuer Vertrag'}</h1>
          <div className="flex gap-1 mt-1">
            {[1,2,3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-6">
        {error && <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

        {/* Step 1: Who & What */}
        {step === 1 && (
          <>
            <div className="text-center py-2">
              <div className="text-4xl mb-1">📋</div>
              <h2 className="text-xl font-black text-slate-900">{'Schritt 1: Was & für wen?'}</h2>
            </div>

            {/* Child selector */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">👦 {'Kind'}</label>
              {children.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-yellow-700 text-sm">{'Füge zuerst ein Kind im Bereich «Meine Kinder» hinzu'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {children.map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => set('child_id')(ch.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${parseInt(form.child_id) === ch.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="text-2xl">{ch.avatar_emoji}</div>
                      <div className="font-bold text-slate-900 text-sm mt-1">{ch.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">📚 {'Fach'}</label>
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => set('subject_id')(s.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${parseInt(form.subject_id) === s.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="text-2xl">{s.emoji}</div>
                    <div className="font-bold text-slate-900 text-sm mt-1">{s.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">🎓 {'Klasse'}</label>
              <div className="flex gap-2 flex-wrap">
                {(selectedSubject?.grades || ['5','6','7','8','9']).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set('grade')(g)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all border-2 text-sm ${form.grade === g ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}
                  >
                     {GRADES[g]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.child_id || !form.subject_id}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              {'Weiter'} →
            </button>
          </>
        )}

        {/* Step 2: Quest details */}
        {step === 2 && (
          <>
            <div className="text-center py-2">
              <div className="text-4xl mb-1">🗺️</div>
              <h2 className="text-xl font-black text-slate-900">{'Schritt 2: Quest-Details'}</h2>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">📌 {'Vertragsname'}</label>
              <input
                value={form.title}
                onChange={set('title')}
                placeholder={'z. B. "Mathematik April"'}
                className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">📝 {'Beschreibung (optional)'}</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={2}
                placeholder={'Was soll getan werden...'}
                className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-900 outline-none transition-all resize-none"
              />
            </div>

            {/* Rules sliders */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800">⚙️ {'Spielregeln'}</h3>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">⏱️ {'Zeit pro Frage'}</span>
                  <span className="font-bold text-blue-600">{form.time_per_question}с</span>
                </div>
                <input type="range" min="10" max="60" value={form.time_per_question}
                  onChange={set('time_per_question')}
                  className="w-full accent-blue-600" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">✅ {'Münzen pro richtiger Antwort'}</span>
                  <span className="font-bold text-green-600">+{form.points_per_correct}🪙</span>
                </div>
                <input type="range" min="1" max="10" value={form.points_per_correct}
                  onChange={set('points_per_correct')}
                  className="w-full accent-green-600" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">❌ {'Abzug pro Fehler'}</span>
                  <span className="font-bold text-red-500">-{form.penalty_per_wrong}🪙</span>
                </div>
                <input type="range" min="0" max="5" value={form.penalty_per_wrong}
                  onChange={set('penalty_per_wrong')}
                  className="w-full accent-red-500" />
              </div>
            </div>

            <button
              onClick={() => { if (!form.title) { setError('Gib den Vertragsname ein'); return; } setError(''); setStep(3); }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              {'Weiter'} →
            </button>
          </>
        )}

        {/* Step 3: Prize */}
        {step === 3 && (
          <>
            <div className="text-center py-2">
              <div className="text-4xl mb-1">🏆</div>
              <h2 className="text-xl font-black text-slate-900">{'Schritt 3: Belohnung!'}</h2>
              <p className="text-slate-500 text-sm">{'Wähle eine Belohnung für das Kind'}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{'Preisname'}</label>
              <input
                value={form.prize_name}
                onChange={set('prize_name')}
                placeholder={'z. B. "Kinobesuch"'}
                className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{'Preis-Symbol'}</label>
              <div className="flex flex-wrap gap-2">
                {PRIZE_EMOJIS.map(em => (
                  <button key={em} type="button" onClick={() => set('prize_emoji')(em)}
                    className={`text-2xl p-2 rounded-xl border-2 transition-all ${form.prize_emoji === em ? 'border-orange-400 bg-orange-50 scale-110' : 'border-slate-200 bg-white'}`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <label className="font-bold text-slate-700">🪙 {'Benotigte Munzen'}</label>
                <span className="font-black text-amber-500 text-lg">{form.prize_coins}</span>
              </div>
              <input type="range" min="50" max="1000" step="10" value={form.prize_coins}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setForm(f => ({ ...f, prize_coins: v, target_coins: v }));
                }}
                className="w-full accent-amber-500" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>50</span><span>1000</span></div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
              <h4 className="font-bold text-amber-800 mb-3 text-sm">📋 {'Vorschau'}</h4>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{selectedChild?.avatar_emoji}</span>
                <div>
                  <p className="font-bold text-slate-800">{selectedChild?.name}</p>
                  <p className="text-xs text-slate-500">{(selectedSubject?.name ?? '')} · {(GRADES[form.grade] || form.grade)}</p>
                </div>
              </div>
              <p className="text-slate-700 font-semibold text-sm">{form.title || '...'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl">{form.prize_emoji}</span>
                <span className="text-slate-700 text-sm font-medium">{form.prize_name || '...'}</span>
                <span className="ml-auto text-amber-600 font-bold text-sm">🪙 {form.prize_coins}</span>
              </div>
            </div>

            <button
              onClick={submit}
              disabled={loading || !form.prize_name}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition-all active:scale-95 text-lg"
            >
              {loading ? '⏳' : '✍️ ' + 'Vertrag unterschreiben'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
