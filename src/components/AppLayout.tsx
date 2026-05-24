import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getRoleLandingPath } from '../utils/routing';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { enabled: notificationsEnabled, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              to={user ? getRoleLandingPath(user.role) : '/'}
              className="text-lg font-semibold text-red-700"
            >
              EmergencyHub
            </Link>
            <span className="text-sm text-slate-500">{title}</span>
          </div>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              {notificationsEnabled ? (
                <button
                  type="button"
                  className="relative rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <span aria-hidden>🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              ) : (
                <span
                  className="rounded-md border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-400"
                  title="Notifications will be available when backend routes are ready"
                >
                  🔔 Soon
                </span>
              )}
              <span className="text-slate-600">
                {user.role}
                {user.department ? ` · ${user.department}` : ''}
              </span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
