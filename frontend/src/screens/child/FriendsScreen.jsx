import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

function FriendCard({ item, onAccept, onReject, onChat }) {
  const isIncoming = item.status === 'pending' && item.requester_id !== undefined;

  return (
    <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
      <span className="text-3xl">{item.friend_avatar}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate text-sm">{item.friend_name}</p>
        <p className="text-xs text-amber-400">🪙 {item.friend_coins || 0}</p>
      </div>
      <div className="flex gap-2">
        {item.status === 'accepted' && (
          <button
            onClick={() => onChat(item.friend_id)}
            className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition"
          >
            💬
          </button>
        )}
        {item.status === 'pending' && item.requester_id !== undefined && (
          <>
            <button
              onClick={() => onAccept(item.id)}
              className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition"
            >
              ✓
            </button>
            <button
              onClick={() => onReject(item.id)}
              className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition"
            >
              ✕
            </button>
          </>
        )}
        {item.status === 'pending' && item.requester_id === undefined && (
          <span className="text-xs text-slate-400">{'Gesendet…'}…</span>
        )}
      </div>
    </div>
  );
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const nav      = useNavigate();
  const [all,     setAll]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('friends'); // friends | pending

  const load = () => {
    setLoading(true);
    api.get('/social/friends')
      .then(({ data }) => setAll(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/social/friends/${id}`, { action });
      load();
    } catch {}
  };

  // Friends with requester_id set correctly from API response
  // API returns: requester_id in the row
  const accepted  = all.filter(f => f.status === 'accepted');
  const incoming  = all.filter(f => f.status === 'pending' && f.requester_id !== user?.id);
  const outgoing  = all.filter(f => f.status === 'pending' && f.requester_id === user?.id);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-10 pb-5">
        <h1 className="text-xl font-black text-white">👥 {'Freunde'}</h1>
        {incoming.length > 0 && (
          <div className="mt-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full inline-block">
            {incoming.length} {'neue Anfrage'}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800">
        {['friends', 'pending'].map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-3 text-sm font-bold transition ${tab === tabKey ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}
          >
            {tabKey === 'friends'
              ? `${'Freunde'} (${accepted.length})`
              : `${'Anfragen'} (${incoming.length + outgoing.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-slate-400 py-12 text-3xl animate-spin">⏳</div>
        ) : tab === 'friends' ? (
          accepted.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <div className="text-4xl mb-2">😊</div>
            <p className="text-sm">{'Noch keine Freunde.'}</p>
              <p className="text-xs mt-1">{'Finde sie in der Rangliste!'}</p>
            </div>
          ) : (
            accepted.map(f => (
              <FriendCard
                key={f.id} item={f}
                onAccept={(id) => handleAction(id, 'accept')}
                onReject={(id) => handleAction(id, 'reject')}
                onChat={(friendId) => nav(`/child/friends/${friendId}/chat`, { state: { friend: f } })}
              />
            ))
          )
        ) : (
          <>
            {incoming.length > 0 && (
              <>
                <p className="text-xs text-slate-500 font-bold uppercase">{'Eingehende Anfragen'}</p>
                {incoming.map(f => (
                  <FriendCard
                    key={f.id} item={f}
                    onAccept={(id) => handleAction(id, 'accept')}
                    onReject={(id) => handleAction(id, 'reject')}
                    onChat={() => {}}
                  />
                ))}
              </>
            )}
            {outgoing.length > 0 && (
              <>
                <p className="text-xs text-slate-500 font-bold uppercase mt-4">{'Gesendete Anfragen'}</p>
                {outgoing.map(f => (
                  <FriendCard
                    key={f.id} item={f}
                    onAccept={() => {}}
                    onReject={() => {}}
                    onChat={() => {}}
                  />
                ))}
              </>
            )}
            {incoming.length === 0 && outgoing.length === 0 && (
              <div className="text-center text-slate-400 py-12">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm">{'Keine Freundschaftsanfragen'}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
