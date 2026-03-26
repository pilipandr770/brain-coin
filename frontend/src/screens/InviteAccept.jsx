import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function InviteAccept() {
  const { code }        = useParams();
  const nav             = useNavigate();
  const { user, login } = useAuth();

  const [status,  setStatus]  = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [linked,  setLinked]  = useState(null);

  const accept = async () => {
    setStatus('loading');
    try {
      const { data } = await api.post('/auth/invite/accept', { code });
      setLinked(data.linkedUser);
      setStatus('success');
      setMessage(data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Fehler');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center bg-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-2xl font-black text-white mb-3">{'Einladung'}</h2>
          <p className="text-slate-400 mb-6">{'Um die Einladung anzunehmen, bitte zuerst einloggen oder registrieren'}</p>
          <div className="space-y-3">
            <button
              onClick={() => nav(`/login?invite=${code}`)}
              className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-xl text-white transition-all"
            >
              {'Anmelden'}
            </button>
            <button
              onClick={() => nav(`/register?invite=${code}`)}
              className="w-full bg-slate-700 hover:bg-slate-600 font-bold py-3 rounded-xl text-white transition-all"
            >
              {'Registrieren'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center bg-slate-800 rounded-2xl p-8 shadow-xl">
        {status === 'idle' && (
          <>
            <div className="text-6xl mb-4">🤝</div>
            <h2 className="text-2xl font-black text-white mb-2">{'Einladung'}</h2>
            <p className="text-slate-400 mb-2">{'Code:'} <span className="font-mono text-blue-400 text-xl font-bold">{code}</span></p>
            <p className="text-slate-400 mb-8 text-sm">{'Einladung annehmen und verknüpfen?'}</p>
            <button
              onClick={accept}
              className="w-full bg-green-600 hover:bg-green-500 font-bold py-3 rounded-xl text-white transition-all active:scale-95"
            >
              {'✅ Annehmen'}
            </button>
          </>
        )}

        {status === 'loading' && (
          <><div className="text-5xl mb-4 animate-spin">⏳</div><p className="text-white">{'Verarbeitung...'}</p></>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4 animate-seal-pop">🎉</div>
            <h2 className="text-2xl font-black text-green-400 mb-2">{'Verbunden!'}</h2>
            {linked && (
              <div className="bg-slate-700 rounded-xl p-4 mb-6">
                <div className="text-3xl">{linked.avatar_emoji}</div>
                <p className="font-bold text-white mt-1">{linked.name}</p>
                <p className="text-slate-400 text-sm">{linked.role === 'parent' ? '👨‍👩‍👧 Vater/Mutter' : '🎒 Kind'}</p>
              </div>
            )}
            <button
              onClick={() => nav(user.role === 'parent' ? '/parent' : '/child', { replace: true })}
              className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-xl text-white transition-all"
            >
              {'Zum Panel →'}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-400 mb-4">{message}</h2>
            <button
              onClick={() => nav('/')}
              className="w-full bg-slate-700 hover:bg-slate-600 font-bold py-3 rounded-xl text-white transition-all"
            >
              {'Zur Startseite'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
