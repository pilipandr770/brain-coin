import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Gift, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ParentLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const onLogout = () => { logout(); nav('/'); };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{user?.avatar_emoji || '👨‍👩‍👧'}</span>
          <div>
            <p className="font-bold text-sm leading-none">{user?.name}</p>
            <p className="text-blue-200 text-xs">{'Eltern-Panel'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user?.role === 'admin' && (
            <button
              onClick={() => nav('/admin')}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 px-3 py-1.5 rounded-xl transition-all text-sm font-black"
              title="Admin-Panel"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </button>
          )}
          <button onClick={onLogout} className="p-2 hover:bg-blue-600 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 max-w-2xl mx-auto w-full">
        <Outlet />
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20">
        <div className="max-w-2xl mx-auto flex justify-around">
          {[
            { to: '/parent',          icon: Home,    label: 'Panel', end: true },
            { to: '/parent?tab=stats', icon: BarChart3, label: 'Statistik' },
            { to: '/parent/children/new', icon: Gift, label: 'Kind' },
            { to: '/parent/contracts/new', icon: Settings, label: 'Vertrag' },
          ].map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500'}`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
