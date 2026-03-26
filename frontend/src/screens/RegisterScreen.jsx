import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const AVATARS = ['😊','🦁','🐯','🦊','🐸','🦄','🐉','🦅','🐺','🦋','🎮','🏆'];
const GRADES = { '5': 'Klasse 5', '6': 'Klasse 6', '7': 'Klasse 7', '8': 'Klasse 8', '9': 'Klasse 9' };


export default function RegisterScreen() {
  const nav = useNavigate();
  const { login } = useAuth();


  const [step, setStep]   = useState(1);
  const [role, setRole]   = useState(null);
  const [avatar, setAvatar] = useState('😊');
  const [form, setForm]   = useState({ name: '', email: '', password: '', grade: '6' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const chooseRole = (r) => {
    setRole(r);
    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        ui_language: 'de',
        ...(role === 'child' ? { grade: form.grade } : {}),
      };
      const { data } = await api.post('/auth/register', payload);
      // Set avatar
      if (avatar !== '😊') {
        await api.patch('/auth/me/avatar', { avatar_emoji: avatar }, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        data.user.avatar_emoji = avatar;
      }
      login(data.token, data.user);
      nav(role === 'parent' ? '/parent' : '/child', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">

          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-2xl font-black text-white mb-2">{'Wer bist du?'}</h2>
          <p className="text-slate-400 mb-10 text-sm">{'Wähle deine Rolle'}</p>

          <div className="space-y-4">
            <button
              onClick={() => chooseRole('parent')}
              className="w-full bg-blue-700 hover:bg-blue-600 active:scale-95 rounded-2xl p-6 text-left transition-all border-2 border-blue-600 hover:border-blue-400"
            >
              <div className="text-4xl mb-2">👨‍👩‍👧</div>
              <div className="text-xl font-bold text-white">{'Ich bin ein Elternteil'}</div>
              <div className="text-blue-300 text-sm mt-1">{'Aufgaben erstellen, Fortschritt verfolgen'}</div>
            </button>

            <button
              onClick={() => chooseRole('child')}
              className="w-full bg-green-700 hover:bg-green-600 active:scale-95 rounded-2xl p-6 text-left transition-all border-2 border-green-600 hover:border-green-400"
            >
              <div className="text-4xl mb-2">🎒</div>
              <div className="text-xl font-bold text-white">{'Ich bin ein Kind'}</div>
              <div className="text-green-300 text-sm mt-1">{'Tests machen, Münzen verdienen!'}</div>
            </button>
          </div>

          <p className="text-center text-slate-500 mt-8 text-sm">
            {'Bereits registriert?'}{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">{'Anmelden'}</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2">
          ← {'Zurück'}
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-1">{role === 'parent' ? '👨‍👩‍👧' : '🏂'}</div>
          <h2 className="text-2xl font-black text-white">
            {role === 'parent' ? 'Eltern-Profil' : 'Spieler-Profil'}
          </h2>
        </div>

        <form onSubmit={submit} className="bg-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          {/* Avatar picker */}
          <div>
            <label className="block text-slate-400 text-sm mb-2">{'Avatar wählen'}</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setAvatar(em)}
                  className={`text-2xl p-2 rounded-xl transition-all ${avatar === em ? 'bg-blue-600 scale-110' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">{'Name'}</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              required
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={role === 'parent' ? 'Ihr Name' : 'Spitzname'}
            />
          </div>

          {role === 'child' && (
            <div>
              <label className="block text-slate-400 text-sm mb-1">{'Schulklasse'}</label>
              <div className="flex gap-2 flex-wrap">
                {GRADES.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, grade: g }))}
                    className={`px-4 py-2 rounded-xl font-bold border-2 text-sm transition-all ${
                      form.grade === g ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-600 bg-slate-700 text-slate-300'
                    }`}
                  >
                    {GRADES[g]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 text-sm mb-1">{'E-Mail'}</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">{'Passwort'}</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={'mind. 6 Zeichen'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 active:scale-95 font-bold py-3 rounded-xl transition-all text-white mt-2"
          >
            {loading ? '⏳' : 'Registrieren' + ' 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
