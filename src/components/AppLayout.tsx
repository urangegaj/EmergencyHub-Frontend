import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppNav } from './AppNav';
import { IconLogout } from './icons/NavIcons';
import { NotificationBell } from './NotificationBell';
import { getRoleLandingPath } from '../utils/routing';
import type { Role } from '../types';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

const roleBadgeClass: Record<Role, string> = {
  Citizen: 'bg-blue-100 text-blue-800',
  Dispatcher: 'bg-purple-100 text-purple-800',
  Responder: 'bg-amber-100 text-amber-900',
  Admin: 'bg-slate-200 text-slate-800',
};

export function AppLayout({ title, children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to={user ? getRoleLandingPath(user.role) : '/'}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-white/10 px-2 py-1 transition hover:bg-white/20"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-bold text-red-700"
                aria-hidden
              >
                EH
              </span>
              <span className="text-lg font-semibold tracking-tight">EmergencyHub</span>
            </Link>
            <span className="hidden h-5 w-px bg-white/30 sm:block" aria-hidden />
            <span className="hidden truncate text-sm text-red-100 sm:block">{title}</span>
          </div>
          {user && (
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell variant="header" />
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1.5 sm:px-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-red-700"
                  aria-hidden
                >
                  {user.role.charAt(0)}
                </span>
                <div className="hidden text-left text-xs leading-tight md:block">
                  <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${roleBadgeClass[user.role]}`}>
                    {user.role}
                  </span>
                  {user.department && (
                    <span className="mt-0.5 block text-red-100">{user.department}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-2.5 py-1.5 text-sm font-medium transition hover:bg-white/20 sm:px-3"
              >
                <IconLogout className="text-white" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 px-4 py-1.5 sm:hidden">
          <span className="text-xs text-red-100">{title}</span>
        </div>
      </header>
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
