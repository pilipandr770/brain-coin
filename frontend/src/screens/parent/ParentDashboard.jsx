import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Clock, BookOpen, Settings, BarChart2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import ContentSettings from './ContentSettings';

function ChildCard({ child, onSettings, onStats }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{child.avatar_emoji}</span>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">{child.name}</h3>
          <p className="text-slate-500 text-xs">{child.grade ? (GRADES[child.grade] || child.grade) : 'Klasse nicht angegeben'}</p>
        </div>
        <div className="text-right flex items-center gap-2">
          <div>
            <p className="text-xl font-black text-amber-500">🪙 {child.total_coins}</p>
            <p className="text-xs text-slate-500">{child.active_contracts} {'aktive'}</p>
          </div>
          <button
            onClick={() => onStats(child)}
            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all"
            title={'Statistik'}
          >
            <BarChart2 className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => onSettings(child)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
            title={'Inhaltsfilter'}
          >
            <Settings className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContractCard({ contract }) {
  const pct = Math.round((contract.current_coins / contract.target_coins) * 100);
  const statusColor = { active: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', completed: 'bg-blue-100 text-blue-700', rejected: 'bg-red-100 text-red-700' };
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{contract.subject_emoji}</span>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{contract.title}</h4>
            <p className="text-xs text-slate-500">{contract.child_name} · {contract.grade}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[contract.status] || statusColor.pending}`}>
          {STATUS_LABELS[contract.status] || contract.status}
        </span>
      </div>

      {contract.status === 'active' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{contract.prize_emoji} {contract.prize_name}</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-slate-500 mt-1">{contract.current_coins} / {contract.target_coins} {'Münzen'}</div>
        </div>
      )}

      {contract.status === 'pending' && !contract.parent_accepted && (
        <p className="text-xs text-yellow-600 mt-2">⏳ {'Wartet auf deine Bestätigung'}</p>
      )}
      {contract.status === 'pending' && !contract.child_accepted && (
        <p className="text-xs text-yellow-600 mt-2">⏳ {'Wartet auf Bestätigung des Kindes'}</p>
      )}
    </div>
  );
}

const GRADES = { '5': 'Klasse 5', '6': 'Klasse 6', '7': 'Klasse 7', '8': 'Klasse 8', '9': 'Klasse 9' };
const STATUS_LABELS = { active: 'Aktiv', pending: 'Ausstehend', completed: 'Abgeschlossen', rejected: 'Abgelehnt' };

export default function ParentDashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [children,      setChildren]      = useState([]);
  const [contracts,     setContracts]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [inviteCode,    setInviteCode]    = useState(null);
  const [inviteExp,     setInviteExp]     = useState(null);
  const [genLoading,    setGenLoading]    = useState(false);
  const [settingsChild, setSettingsChild] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/auth/children'), api.get('/contracts')])
      .then(([ch, ct]) => { setChildren(ch.data); setContracts(ct.data); })
      .finally(() => setLoading(false));
  }, []);

  const generateInvite = async () => {
    setGenLoading(true);
    try {
      const { data } = await api.post('/auth/invite/generate');
      setInviteCode(data.code);
      setInviteExp(new Date(data.expiresAt));
    } finally {
      setGenLoading(false);
    }
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(url);
  };

  const pendingContracts = contracts.filter(c => c.status === 'pending');
  const activeContracts  = contracts.filter(c => c.status === 'active');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-4xl animate-spin">⏳</div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Admin banner — only visible to admin role */}
      {user?.role === 'admin' && (
        <button
          onClick={() => nav('/admin')}
          className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 rounded-2xl p-4 text-white flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-lg"
        >
          <span className="text-3xl">🛡️</span>
          <div className="text-left flex-1">
            <p className="font-black text-lg leading-none">Admin-Panel</p>
            <p className="text-purple-200 text-sm mt-0.5">Benutzer, Abos & Fächer verwalten</p>
          </div>
          <span className="text-2xl font-bold">›</span>
        </button>
      )}

      {/* Children section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-slate-900">{'Meine Kinder'}</h2>
          <button
            onClick={() => nav('/parent/children/new')}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> {'Hinzufügen'}
          </button>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border-2 border-dashed border-slate-200">
            <div className="text-4xl mb-2">👶</div>
            <p className="text-slate-500 text-sm mb-4">{'Noch keine Kinder hinzugefügt'}</p>
            <button onClick={() => nav('/parent/children/new')} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm">
              {'Kind hinzufügen'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map(ch => <ChildCard key={ch.id} child={ch} onSettings={setSettingsChild} onStats={ch => nav(`/parent/stats/${ch.id}`)} />)}
          </div>
        )}
      </section>

      {/* Invite section */}
      <section className="bg-gradient-to-r from-violet-700 to-blue-700 rounded-2xl p-4 text-white">
        <h3 className="font-bold mb-1">📨 {'Kind per Code einladen'}</h3>
        <p className="text-sm text-blue-200 mb-3">{'Kind bereits registriert? Gib ihm den Code'}</p>
        {inviteCode ? (
          <div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center mb-2">
              <p className="text-3xl font-black tracking-widest font-mono">{inviteCode}</p>
              <p className="text-xs text-blue-200 mt-1">
                {'Gültig bis'}: {inviteExp?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={copyInviteLink} className="w-full bg-white/20 hover:bg-white/30 font-bold py-2 rounded-xl text-sm transition-all">
              📋 {'Link kopieren'}
            </button>
          </div>
        ) : (
          <button
            onClick={generateInvite}
            disabled={genLoading}
            className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 font-bold py-2 rounded-xl text-sm transition-all"
          >
            {genLoading ? '⏳' : '🔑 ' + 'Code generieren'}
          </button>
        )}
      </section>

      {/* Pending contracts */}
      {pendingContracts.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" /> {'Warten auf Bestätigung'}
          </h2>
          <div className="space-y-3">
            {pendingContracts.map(c => <ContractCard key={c.id} contract={c} />)}
          </div>
        </section>
      )}

      {/* Active contracts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> {'Aktive Verträge'}
          </h2>
          <button
            onClick={() => nav('/parent/contracts/new')}
            disabled={children.length === 0}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> {'Neu'}
          </button>
        </div>

        {activeContracts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border-2 border-dashed border-slate-200">
            <div className="text-4xl mb-2">📜</div>
            <p className="text-slate-500 text-sm">{'Noch keine aktiven Verträge'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeContracts.map(c => <ContractCard key={c.id} contract={c} />)}
          </div>
        )}
      </section>

      {settingsChild && (
        <ContentSettings
          childId={settingsChild.id}
          childName={settingsChild.name}
          onBack={() => setSettingsChild(null)}
        />
      )}
    </div>
  );
}
