import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function ChatScreen() {
  const { id: friendId }    = useParams();
  const { state }           = useLocation();
  const nav                 = useNavigate();
  const { user }            = useAuth();
  const { t }               = useTranslation();
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const friend     = state?.friend;

  const loadMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/social/messages/${friendId}`);
      setMessages(data);
    } catch {
      // ignore poll errors
    }
  }, [friendId]);

  useEffect(() => {
    loadMessages().finally(() => setLoading(false));
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    try {
      const { data } = await api.post('/social/messages', {
        receiver_id: parseInt(friendId),
        content,
      });
      setMessages(prev => [...prev, data]);
    } catch {
      setText(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  const friendName   = friend?.friend_name   || `${t('child.player')} #${friendId}`;
  const friendAvatar = friend?.friend_avatar || '😊';

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 px-4 pt-10 pb-3 flex items-center gap-3 border-b border-slate-700">
        <button
          onClick={() => nav(-1)}
          className="text-slate-400 text-lg font-bold px-2 py-1 rounded-lg active:scale-95"
        >
          ‹
        </button>
        <span className="text-2xl">{friendAvatar}</span>
        <div>
          <p className="font-bold text-white text-sm">{friendName}</p>
          <p className="text-xs text-green-400">{t('chat.online')}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-slate-400 py-12 text-3xl animate-spin">⏳</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <div className="text-4xl mb-2">{friendAvatar}</div>
            <p className="text-sm">{t('chat.startChat')} {friendName}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm break-words ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    {isMe && (msg.is_read ? ' ✓✓' : ' ✓')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={send}
        className="bg-slate-800 border-t border-slate-700 p-3 flex items-center gap-2"
      >
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('chat.placeholder')}
          maxLength={1000}
          className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 active:scale-90 transition"
        >
          {sending ? '…' : '➤'}
        </button>
      </form>
    </div>
  );
}
