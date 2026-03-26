import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function LoginScreen() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      nav(data.user.role === 'parent' ? '/parent' : '/child', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🧠💰</div>
          <h1 className="text-3xl font-black text-blue-400">BrainCoin</h1>
          <p className="text-slate-400 text-sm mt-1">{'Anmelden'}</p>
        </div>

        <form onSubmit={submit} className="bg-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
              {error}
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
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 active:scale-95 font-bold py-3 rounded-xl transition-all text-white"
          >
            {loading ? '⏳' : 'Anmelden' + ' →'}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6 text-sm">
          {'Noch kein Konto?'}{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
            {'Registrieren'}
          </Link>
        </p>
      </div>
    </div>
  );
}
