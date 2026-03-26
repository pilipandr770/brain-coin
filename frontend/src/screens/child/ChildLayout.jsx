import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Trophy, Users, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ChildLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{user?.avatar_emoji || '🎮'}</span>
          <div>
            <p className="font-black text-sm leading-none">{user?.name}</p>
            <p className="text-blue-200 text-xs">{'Spieler'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-blue-200 text-xs">{'Münzen'}</p>
            <p className="font-black text-amber-300 text-lg leading-none">🪙 {user?.total_coins ?? 0}</p>
          </div>
          <button onClick={() => { logout(); nav('/'); }} className="p-1.5 hover:bg-blue-600 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 max-w-2xl mx-auto w-full">
        <Outlet />
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-20">
        <div className="max-w-2xl mx-auto flex justify-around">
          {[
            { to: '/child',              icon: Home,         label: 'Start',         end: true },
            { to: '/child/leaderboard',  icon: Trophy,       label: 'Rangliste' },
            { to: '/child/friends',      icon: Users,        label: 'Freunde' },
            { to: '/child/mistakes',     icon: AlertCircle,  label: 'Fehleranalyse' },
          ].map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500'}`
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
