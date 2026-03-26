import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../api';

export default function CreateChild() {
  const nav = useNavigate();
  const [mode,    setMode]    = useState(null); // 'create' | 'invite'
  const [form,    setForm]    = useState({ name: '', email: '', password: '', age: '' });
  const [invite,  setInvite]  = useState(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const createChild = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/children', { ...form, age: form.age ? parseInt(form.age) : undefined });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/invite/generate');
      setInvite(data);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.code}`);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-green-600 mb-2">{'Fertig!'}</h2>
          <p className="text-slate-500 mb-6">{'Kinderprofil wurde erstellt und verknüpft'}</p>
          <button onClick={() => nav('/parent')} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">
            {'Zum Panel'} →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => mode ? setMode(null) : nav('/parent')} className="p-2 hover:bg-slate-100 rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-slate-900">{'Kind hinzufügen'}</h1>
      </div>

      <div className="max-w-sm mx-auto p-4 space-y-4">
        {!mode && (
          <>
            <p className="text-slate-500 text-sm text-center mt-4">{'Wie möchtest du ein Kind hinzufügen?'}</p>
            <button
              onClick={() => setMode('create')}
              className="w-full bg-white border-2 border-blue-200 hover:border-blue-500 rounded-2xl p-5 text-left transition-all"
            >
              <div className="text-3xl mb-2">➕</div>
              <div className="font-black text-slate-900">{'Profil erstellen'}</div>
              <div className="text-slate-500 text-sm mt-1">{'Ich registriere das Kind selbst'}</div>
            </button>
            <button
              onClick={() => { setMode('invite'); generateInvite(); }}
              className="w-full bg-white border-2 border-violet-200 hover:border-violet-500 rounded-2xl p-5 text-left transition-all"
            >
              <div className="text-3xl mb-2">🔗</div>
              <div className="font-black text-slate-900">{'Einladung senden'}</div>
              <div className="text-slate-500 text-sm mt-1">{'Kind ist bereits registriert oder macht es selbst'}</div>
            </button>
          </>
        )}

        {mode === 'create' && (
          <form onSubmit={createChild} className="bg-white rounded-2xl p-5 shadow-sm space-y-4 mt-2">
            <h2 className="font-black text-slate-900">{'Kinderprofil'}</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2">{error}</div>}

            {[
              { k: 'name',     label: 'Name',     type: 'text',     ph: 'Artem' },
              { k: 'email',    label: 'E-Mail',    type: 'email',    ph: 'artem@gmail.com' },
              { k: 'password', label: 'Passwort', type: 'password', ph: 'mind. 6 Zeichen' },
              { k: 'age',      label: 'Alter',      type: 'number',   ph: '12' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
                <input
                  type={type} value={form[k]} onChange={set(k)}
                  required={k !== 'age'} min={k === 'age' ? 6 : undefined} max={k === 'age' ? 18 : undefined}
                  placeholder={ph}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none"
                />
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
              {loading ? '⏳' : 'Profil erstellen 🎮'}
            </button>
          </form>
        )}

        {mode === 'invite' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mt-2">
            <h2 className="font-black text-slate-900 mb-3">{'Einladungscode'}</h2>
            {loading ? (
              <div className="text-center py-8 text-3xl animate-spin">⏳</div>
            ) : invite ? (
              <>
                <div className="bg-gradient-to-r from-violet-100 to-blue-100 rounded-2xl p-6 text-center mb-4">
                  <p className="text-slate-500 text-sm mb-1">{'Code ist 24 Stunden gültig'}</p>
                  <p className="text-4xl font-black font-mono tracking-widest text-violet-700">{invite.code}</p>
                </div>
                <button onClick={copyLink}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all mb-3">
                  📋 {'Link kopieren'}
                </button>
                <p className="text-slate-500 text-xs text-center">{'Sende diesen Link dem Kind. Nach dem Einloggen wird es automatisch verknüpft.'}</p>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
