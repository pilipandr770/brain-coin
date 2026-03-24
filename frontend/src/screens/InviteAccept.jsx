import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function InviteAccept() {
  const { code }        = useParams();
  const nav             = useNavigate();
  const { user, login } = useAuth();
  const { t }           = useTranslation();

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
      setMessage(err.response?.data?.error || t('common.error'));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center bg-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-2xl font-black text-white mb-3">{t('invite.title')}</h2>
          <p className="text-slate-400 mb-6">{t('invite.needsLogin')}</p>
          <div className="space-y-3">
            <button
              onClick={() => nav(`/login?invite=${code}`)}
              className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-xl text-white transition-all"
            >
              {t('auth.login')}
            </button>
            <button
              onClick={() => nav(`/register?invite=${code}`)}
              className="w-full bg-slate-700 hover:bg-slate-600 font-bold py-3 rounded-xl text-white transition-all"
            >
              {t('auth.register')}
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
            <h2 className="text-2xl font-black text-white mb-2">{t('invite.title')}</h2>
            <p className="text-slate-400 mb-2">{t('invite.code')} <span className="font-mono text-blue-400 text-xl font-bold">{code}</span></p>
            <p className="text-slate-400 mb-8 text-sm">{t('invite.acceptPrompt')}</p>
            <button
              onClick={accept}
              className="w-full bg-green-600 hover:bg-green-500 font-bold py-3 rounded-xl text-white transition-all active:scale-95"
            >
              {t('invite.accept')}
            </button>
          </>
        )}

        {status === 'loading' && (
          <><div className="text-5xl mb-4 animate-spin">⏳</div><p className="text-white">{t('invite.processing')}</p></>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4 animate-seal-pop">🎉</div>
            <h2 className="text-2xl font-black text-green-400 mb-2">{t('invite.success')}</h2>
            {linked && (
              <div className="bg-slate-700 rounded-xl p-4 mb-6">
                <div className="text-3xl">{linked.avatar_emoji}</div>
                <p className="font-bold text-white mt-1">{linked.name}</p>
                <p className="text-slate-400 text-sm">{linked.role === 'parent' ? t('invite.parentRole') : t('invite.childRole')}</p>
              </div>
            )}
            <button
              onClick={() => nav(user.role === 'parent' ? '/parent' : '/child', { replace: true })}
              className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-xl text-white transition-all"
            >
              {t('invite.toPanel')}
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
              {t('invite.goHome')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
