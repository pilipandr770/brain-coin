import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Clock, BookOpen, Settings, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import ContentSettings from './ContentSettings';

function ChildCard({ child, onSettings, onStats }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{child.avatar_emoji}</span>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">{child.name}</h3>
          <p className="text-slate-500 text-xs">{child.grade ? t('grades.' + child.grade) : t('parent.gradeNotSet')}</p>
        </div>
        <div className="text-right flex items-center gap-2">
          <div>
            <p className="text-xl font-black text-amber-500">🪙 {child.total_coins}</p>
            <p className="text-xs text-slate-500">{child.active_contracts} {t('parent.activeContracts')}</p>
          </div>
          <button
            onClick={() => onStats(child)}
            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all"
            title={t('stats.viewStats')}
          >
            <BarChart2 className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => onSettings(child)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
            title={t('content.title')}
          >
            <Settings className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContractCard({ contract }) {
  const { t } = useTranslation();
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
          {t('parent.status_' + contract.status)}
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
          <div className="text-xs text-slate-500 mt-1">{contract.current_coins} / {contract.target_coins} {t('common.coins')}</div>
        </div>
      )}

      {contract.status === 'pending' && !contract.parent_accepted && (
        <p className="text-xs text-yellow-600 mt-2">⏳ {t('parent.awaitingYourConfirm')}</p>
      )}
      {contract.status === 'pending' && !contract.child_accepted && (
        <p className="text-xs text-yellow-600 mt-2">⏳ {t('parent.awaitingChildConfirm')}</p>
      )}
    </div>
  );
}

export default function ParentDashboard() {
  const nav = useNavigate();
  const { t } = useTranslation();
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
      {/* Children section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-slate-900">{t('parent.myChildren')}</h2>
          <button
            onClick={() => nav('/parent/children/new')}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> {t('common.add')}
          </button>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border-2 border-dashed border-slate-200">
            <div className="text-4xl mb-2">👶</div>
            <p className="text-slate-500 text-sm mb-4">{t('parent.noChildrenYet')}</p>
            <button onClick={() => nav('/parent/children/new')} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm">
              {t('parent.addChild')}
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
        <h3 className="font-bold mb-1">📨 {t('parent.inviteByCode')}</h3>
        <p className="text-sm text-blue-200 mb-3">{t('parent.inviteDesc')}</p>
        {inviteCode ? (
          <div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center mb-2">
              <p className="text-3xl font-black tracking-widest font-mono">{inviteCode}</p>
              <p className="text-xs text-blue-200 mt-1">
                {t('parent.validUntil')}: {inviteExp?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={copyInviteLink} className="w-full bg-white/20 hover:bg-white/30 font-bold py-2 rounded-xl text-sm transition-all">
              📋 {t('parent.copyLink')}
            </button>
          </div>
        ) : (
          <button
            onClick={generateInvite}
            disabled={genLoading}
            className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 font-bold py-2 rounded-xl text-sm transition-all"
          >
            {genLoading ? '⏳' : '🔑 ' + t('parent.generateCode')}
          </button>
        )}
      </section>

      {/* Pending contracts */}
      {pendingContracts.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" /> {t('parent.awaitingConfirmation')}
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
            <BookOpen className="w-5 h-5 text-blue-600" /> {t('parent.activeContractsTitle')}
          </h2>
          <button
            onClick={() => nav('/parent/contracts/new')}
            disabled={children.length === 0}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> {t('common.new')}
          </button>
        </div>

        {activeContracts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border-2 border-dashed border-slate-200">
            <div className="text-4xl mb-2">📜</div>
            <p className="text-slate-500 text-sm">{t('parent.noActiveContracts')}</p>
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
