import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user }              = useAuth();
  const [board,    setBoard]  = useState([]);
  const [loading,  setLoading] = useState(true);
  const [friends,  setFriends] = useState(new Set());
  const [pending,  setPending] = useState(new Set());
  const [sending,  setSending] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/social/leaderboard'),
      api.get('/social/friends'),
    ]).then(([lb, fr]) => {
      setBoard(lb.data);
      const accepted = new Set();
      const pend     = new Set();
      fr.data.forEach(f => {
        if (f.status === 'accepted') accepted.add(f.friend_id);
        else pend.add(f.friend_id);
      });
      setFriends(accepted);
      setPending(pend);
    }).finally(() => setLoading(false));
  }, []);

  const sendRequest = async (id) => {
    setSending(id);
    try {
      await api.post('/social/friends/request', { addressee_id: id });
      setPending(p => new Set([...p, id]));
    } catch {
      // ignore
    } finally {
      setSending(null);
    }
  };

  const myRank = board.findIndex(r => r.id === user?.id) + 1;

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-4 pt-10 pb-6 text-center">
        <h1 className="text-2xl font-black text-white">🏆 {'Rangliste'}</h1>
        {myRank > 0 && (
          <p className="text-amber-100 text-sm mt-1">{'Dein Rang'}: <span className="font-bold text-white">#{myRank}</span></p>
        )}
      </div>

      {/* Top-3 podium */}
      {!loading && board.length >= 3 && (
        <div className="flex items-end justify-center gap-3 bg-slate-800 px-4 pt-4 pb-6">
          {/* 2nd */}
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-1">{board[1].avatar_emoji}</div>
            <div className="bg-slate-600 text-white text-xs font-bold px-3 py-8 rounded-t-xl text-center w-20">
              <div className="text-lg">🥈</div>
              <div className="truncate text-xs">{board[1].name.split(' ')[0]}</div>
              <div className="text-amber-400 font-black">{board[1].total_coins}</div>
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-1">{board[0].avatar_emoji}</div>
            <div className="bg-amber-500 text-white text-xs font-bold px-3 py-14 rounded-t-xl text-center w-20">
              <div className="text-xl">🥇</div>
              <div className="truncate text-xs">{board[0].name.split(' ')[0]}</div>
              <div className="font-black">{board[0].total_coins}</div>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-1">{board[2].avatar_emoji}</div>
            <div className="bg-slate-700 text-white text-xs font-bold px-3 py-5 rounded-t-xl text-center w-20">
              <div className="text-lg">🥉</div>
              <div className="truncate text-xs">{board[2].name.split(' ')[0]}</div>
              <div className="text-amber-400 font-black">{board[2].total_coins}</div>
            </div>
          </div>
        </div>
      )}

      {/* Full list (from 4th) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-slate-400 py-12 text-3xl animate-spin">⏳</div>
        ) : board.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <div className="text-4xl mb-2">🌱</div>
            <p> {'Noch keine Spieler'}</p>
          </div>
        ) : (
          board.slice(3).map((row, i) => {
            const rank   = i + 4;
            const isMe   = row.id === user?.id;
            const isFriend = friends.has(row.id);
            const isPend   = pending.has(row.id);
            return (
              <div
                key={row.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isMe ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-100'}`}
              >
                <span className="text-xs font-black w-6 text-center text-slate-400">#{rank}</span>
                <span className="text-2xl">{row.avatar_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate text-sm ${isMe ? 'text-white' : 'text-slate-100'}`}>
                    {row.name} {isMe && '(ти)'}
                  </p>
                  <p>
                {row.completed_contracts || 0} {'Aufgaben'} &nbsp;
                {row.total_correct || 0} {'Richtig'.toLowerCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-amber-400 text-sm">🪙 {row.total_coins}</p>
                  {!isMe && (
                    isFriend ? (
                      <span className="text-xs text-green-400">{'Freund ✓'}</span>
                    ) : isPend ? (
                      <span className="text-xs text-slate-400">{'Gesendet…'}</span>
                    ) : (
                      <button
                        disabled={sending === row.id}
                        onClick={() => sendRequest(row.id)}
                        className="text-xs text-indigo-400 font-semibold active:scale-95 transition disabled:opacity-50"
                      >
                        {'+ Freund'}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
