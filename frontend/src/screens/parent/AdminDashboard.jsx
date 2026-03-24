import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [saving, setSaving]   = useState(null);  // userId being updated

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
    ]).then(([s, u]) => {
      setStats(s.data);
      setUsers(u.data);
    }).finally(() => setLoading(false));
  }, []);

  const updateSubscription = async (userId, newStatus) => {
    setSaving(userId);
    try {
      await api.patch(`/admin/users/${userId}/subscription`, { subscription_status: newStatus });
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, subscription_status: newStatus } : u)
      );
    } catch {
      alert('Failed to update subscription');
    } finally {
      setSaving(null);
    }
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
        <h1 className="text-2xl font-bold text-gray-800">
          {t('admin.title', 'Admin Dashboard')}
        </h1>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          {t('nav.logout', 'Logout')}
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            label={t('admin.stats_total_users', 'Total users')}
            value={stats.total_users}
            icon="👥"
          />
          <StatCard
            label={t('admin.stats_active_subs', 'Active subs')}
            value={stats.active_subscriptions}
            icon="✅"
            color="text-green-600"
          />
          <StatCard
            label={t('admin.stats_trialing', 'Trialing')}
            value={stats.trialing_subscriptions}
            icon="🎁"
            color="text-blue-600"
          />
          <StatCard
            label={t('admin.stats_mrr', 'Est. MRR')}
            value={`€${stats.estimated_mrr_eur}`}
            icon="💰"
            color="text-purple-600"
          />
        </div>
      )}

      {/* User table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
          <h2 className="font-semibold text-gray-800 flex-1">
            {t('admin.user_table_title', 'Users')}
          </h2>
          <input
            type="text"
            placeholder={t('admin.search_placeholder', 'Search by name or email…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            {t('common.loading', 'Loading…')}
          </div>
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
                        <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                          admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'parent' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'parent' ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[u.subscription_status] ?? statusColors.none}`}>
                          {u.subscription_status || 'none'}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {u.role === 'parent' && u.subscription_status !== 'active' && (
                          <button
                            onClick={() => updateSubscription(u.id, 'active')}
                            disabled={saving === u.id}
                            className="text-xs px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg disabled:opacity-50"
                          >
                            Activate
                          </button>
                        )}
                        {u.role === 'parent' && u.subscription_status === 'active' && (
                          <button
                            onClick={() => updateSubscription(u.id, 'canceled')}
                            disabled={saving === u.id}
                            className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                        {/* No admin toggle — role is managed in DB */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                {t('admin.no_users', 'No users found')}
              </div>
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
