import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoleLandingPath } from '../utils/routing';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to={user ? getRoleLandingPath(user.role) : '/'} className="text-lg font-semibold text-red-700">
              EmergencyHub
            </Link>
            <span className="text-sm text-slate-500">{title}</span>
          </div>
          {user && (
            <div className="flex items-center gap-3 text-sm">
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
