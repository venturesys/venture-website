import { FileText, Briefcase, Settings, LogOut } from 'lucide-react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';

import { useAdminSession } from '@/hooks/useAdminSession';

const NAV = [
  { to: '/admin/cases', label: 'Cases', icon: Briefcase },
  { to: '/admin/insights', label: 'Insights', icon: FileText },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
];

export default function AdminLayout() {
  const { session, logout } = useAdminSession();
  const navigate = useNavigate();

  if (!session) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex">
      <aside className="w-60 shrink-0 border-r border-slate-200 flex flex-col">
        <div className="px-6 py-6 border-b border-slate-200">
          <img src="/logo-250x60.png" alt="Venture" className="h-8 object-contain invert" />
          <p className="mt-3 text-xs text-slate-500 truncate" title={session.login}>
            {session.login}
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="m-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
