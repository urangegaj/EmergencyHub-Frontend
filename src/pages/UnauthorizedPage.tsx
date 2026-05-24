import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';

export function UnauthorizedPage() {
  return (
    <AppLayout title="Access denied">
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-slate-600">You do not have permission to view this page.</p>
        <Link to="/" className="mt-4 inline-block text-red-700 hover:underline">
          Go home
        </Link>
      </div>
    </AppLayout>
  );
}
