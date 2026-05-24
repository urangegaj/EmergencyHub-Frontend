import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { getRoleLandingPath } from '../utils/routing';

export function UnauthorizedPage() {
  const { user } = useAuth();
  const home = user ? getRoleLandingPath(user.role) : '/login';

  return (
    <AppLayout title="Access denied">
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-slate-600">You do not have permission to view this page.</p>
        <Link to={home} className="mt-4 inline-block text-red-700 hover:underline">
          Go to your home page
        </Link>
      </div>
    </AppLayout>
  );
}
