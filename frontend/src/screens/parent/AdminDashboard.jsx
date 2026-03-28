import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const GRADE_OPTIONS = ['4','5','6','7','8','9'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [saving, setSaving]   = useState(null);
  const [genStatus, setGenStatus] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [poolStats, setPoolStats]   = useState(null);

  // Subject management state
  const [subjects,    setSubjects]    = useState([]);
  const [subjTab,     setSubjTab]     = useState('list'); // 'list' | 'add'
  const [newSubject,  setNewSubject]  = useState({ name: '', name_en: '', slug: '', emoji: '📚', grades: ['4','5','6','7','8','9'] });
  const [subjSaving,  setSubjSaving]  = useState(false);
  const [subjError,   setSubjError]   = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return; }
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/subjects'),
    ]).then(([s, u, subj]) => {
      setStats(s.data);
      setUsers(u.data);
      setSubjects(subj.data);
    }).finally(() => setLoading(false));

    // Poll gen status sequentially (next request only fires AFTER previous completes)
    let genTimer = null;
    let cancelled = false;
    const pollGen = async () => {
      try { const { data } = await api.get('/admin/gen/status'); if (!cancelled) setGenStatus(data); } catch {}
      if (!cancelled) genTimer = setTimeout(pollGen, 3000);
    };
    pollGen();

    // Load pool stats once
    api.get('/admin/gen/pool').then(r => setPoolStats(r.data)).catch(() => {});

    return () => { cancelled = true; clearTimeout(genTimer); };
  }, []);

  const updateSubscription = async (userId, newStatus) => {
    setSaving(userId);
    try {
      await api.patch(`/admin/users/${userId}/subscription`, { sub_status: newStatus });
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, sub_status: newStatus } : u)
      );
    } catch {
      alert('Failed to update subscription');
    } finally {
      setSaving(null);
    }
  };

  const startGen = async () => {
    setGenLoading(true);
    try { await api.post('/admin/gen/start'); } catch { alert('Fehler beim Starten'); }
    finally { setGenLoading(false); }
  };

  const stopGen = async () => {
    setGenLoading(true);
    try { await api.post('/admin/gen/stop'); } catch { alert('Fehler beim Stoppen'); }
    finally { setGenLoading(false); }
  };

  const addSubject = async () => {
    if (!newSubject.name || !newSubject.slug) { setSubjError('Name und Slug erforderlich'); return; }
    setSubjSaving(true); setSubjError('');
    try {
      const { data } = await api.post('/admin/subjects', newSubject);
      setSubjects(prev => [...prev, data]);
      setNewSubject({ name: '', name_en: '', slug: '', emoji: '📚', grades: ['4','5','6','7','8','9'] });
      setSubjTab('list');
    } catch (err) {
      setSubjError(err.response?.data?.error || 'Fehler');
    } finally {
      setSubjSaving(false);
    }
  };

  const deleteSubject = async (id, name) => {
    if (!window.confirm(`Fach "${name}" löschen?`)) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Fehler');
    }
  };

  const toggleGrade = (g) => {
    setNewSubject(prev => ({
      ...prev,
      grades: prev.grades.includes(g) ? prev.grades.filter(x => x !== g) : [...prev.grades, g].sort(),
    }));
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const statusColors = {
    active:   'bg-green-100 text-green-800',
    trialing: 'bg-blue-100 text-blue-800',
    past_due: 'bg-amber-100 text-amber-800',
    canceled: 'bg-red-100 text-red-700',
    none:     'bg-gray-100 text-gray-600',
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="max-w-5xl mx-auto p-4 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/parent')} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-1">← {'Eltern-Panel'}</button>
          <h1 className="text-2xl font-bold text-gray-800">{'Admin-Dashboard'}</h1>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-gray-500 hover:text-gray-800">{'Logout'}</button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label={'Benutzer gesamt'} value={stats.total_users} icon="👥" />
          <StatCard label={'Aktive Abos'} value={stats.active_subscriptions} icon="✅" color="text-green-600" />
          <StatCard label={'Testphase'} value={stats.trialing_subscriptions} icon="🎁" color="text-blue-600" />
          <StatCard label={'Gesch. MRR'} value={`€${stats.estimated_mrr_eur}`} icon="💰" color="text-purple-600" />
        </div>
      )}

      {/* ── AI Question Generation ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <h2 className="font-semibold text-gray-800 flex-1">🤖 {'KI-Fragengenerierung'}</h2>
          <button
            onClick={genStatus?.running ? stopGen : startGen}
            disabled={genLoading}
            className={`text-sm px-4 py-1.5 rounded-lg font-bold transition disabled:opacity-50 ${
              genStatus?.running
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {genLoading ? '⏳' : genStatus?.running ? '⏹ Stop' : '▶ Start'}
          </button>
        </div>

        {genStatus?.running && (
          <div className="px-4 py-3 bg-blue-50 border-b border-gray-100">
            <p className="text-sm text-blue-800 font-medium mb-1">
              ⚙️ {genStatus.currentSubject ?? '…'}{genStatus.currentTopic ? ` — ${genStatus.currentTopic}` : ''}
              <span className="ml-2 text-blue-500 font-normal">Klasse {genStatus.currentGrade ?? '…'}</span>
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: genStatus.progressTotal > 0 ? `${Math.round(genStatus.progressDone / genStatus.progressTotal * 100)}%` : '0%' }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">{genStatus.progressDone} / {genStatus.progressTotal} Thema×Klassen-Kombinationen (Ziel: {genStatus.targetPerTopic} Fragen/Thema)</p>
          </div>
        )}

        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={'Fragen generiert'} value={Number(genStatus?.lifetime?.totalQuestions ?? 0).toLocaleString('de-DE')} icon="❓" />
          <StatCard label={'Fragen in DB gesamt'}
            value={poolStats ? poolStats.summary.reduce((s, r) => s + r.count, 0).toLocaleString('de-DE') : '…'}
            icon="🗄️" color="text-blue-600" />
          <StatCard label={'API-Kosten gesamt'} value={`$${Number(genStatus?.lifetime?.totalCostUsd ?? 0).toFixed(4)}`} icon="💵" color="text-amber-700" />
          <StatCard label={'Ziel pro Thema'} value={`${genStatus?.targetPerTopic ?? 200} Fragen`} icon="🎯" color="text-purple-600" />
        </div>
      </div>

      {/* ── Subject management ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <h2 className="font-semibold text-gray-800 flex-1">📚 {'Fächer verwalten'}</h2>
          <button
            onClick={() => setSubjTab(subjTab === 'add' ? 'list' : 'add')}
            className={`text-sm px-3 py-1.5 rounded-lg font-bold transition ${subjTab === 'add' ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
          >
            {subjTab === 'add' ? '← Zurück' : '+ Fach hinzufügen'}
          </button>
        </div>

        {subjTab === 'list' ? (
          <div className="divide-y divide-gray-100">
            {subjects.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{s.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{s.slug}</span>
                  <div className="flex gap-1 mt-0.5">
                    {(s.grades || []).map(g => (
                      <span key={g} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{g}.</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteSubject(s.id, s.name)}
                  className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-3 max-w-md">
            {subjError && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{subjError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Name (DE) *</label>
                <input value={newSubject.name} onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))}
                  placeholder="z. B. Französisch"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Slug * (a-z)</label>
                <input value={newSubject.slug} onChange={e => setNewSubject(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'') }))}
                  placeholder="z. B. french"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Name (EN)</label>
                <input value={newSubject.name_en} onChange={e => setNewSubject(p => ({ ...p, name_en: e.target.value }))}
                  placeholder="z. B. French"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Emoji</label>
                <input value={newSubject.emoji} onChange={e => setNewSubject(p => ({ ...p, emoji: e.target.value }))}
                  placeholder="🇫🇷"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block">Klassen</label>
              <div className="flex gap-2 flex-wrap">
                {GRADE_OPTIONS.map(g => (
                  <button key={g} type="button" onClick={() => toggleGrade(g)}
                    className={`px-3 py-1 rounded-lg text-sm font-bold border-2 transition ${newSubject.grades.includes(g) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                    {g}. Kl.
                  </button>
                ))}
              </div>
            </div>
            <button onClick={addSubject} disabled={subjSaving}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition">
              {subjSaving ? '⏳ Speichern…' : '✅ Fach erstellen'}
            </button>
          </div>
        )}
      </div>

      {/* User table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
          <h2 className="font-semibold text-gray-800 flex-1">{'Benutzer'}</h2>
          <input
            type="text"
            placeholder={'Nach Name oder E-Mail suchen…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">{'Laden…'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 font-semibold">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Subscription</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {u.name}
                      {u.role === 'admin' && (
                        <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'parent' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'parent' ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[u.sub_status] ?? statusColors.none}`}>
                          {u.sub_status || 'none'}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {u.role === 'parent' && u.sub_status !== 'active' && (
                          <button onClick={() => updateSubscription(u.id, 'active')} disabled={saving === u.id}
                            className="text-xs px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg disabled:opacity-50">
                            Activate
                          </button>
                        )}
                        {u.role === 'parent' && u.sub_status === 'active' && (
                          <button onClick={() => updateSubscription(u.id, 'canceled')} disabled={saving === u.id}
                            className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50">
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">{'Keine Benutzer gefunden'}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'text-gray-800' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
