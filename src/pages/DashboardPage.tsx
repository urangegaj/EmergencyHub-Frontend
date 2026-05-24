import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { EmergencyStatusBadge } from '../components/EmergencyStatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { emergencyService } from '../services/emergencyService';
import { getApiErrorMessage } from '../utils/errors';
import type { Emergency } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    emergencyService
      .list({ page: 1, pageSize: 50, sortBy: 'created_at', order: 'desc' })
      .then((res) => {
        const mine = user
          ? res.data.emergencies.filter((e) => e.reportedByUserId === user.userId)
          : res.data.emergencies;
        setEmergencies(mine);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AppLayout title="Dashboard">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My emergencies</h1>
        {user?.role === 'Citizen' && (
          <Link
            to="/emergencies/report"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Report emergency
          </Link>
        )}
      </div>
      {loading && <p className="text-slate-600">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && emergencies.length === 0 && (
        <p className="text-slate-600">No emergencies reported yet.</p>
      )}
      <ul className="space-y-3">
        {emergencies.map((emergency) => (
          <li key={emergency.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link to={`/emergencies/${emergency.id}`} className="font-medium text-red-700 hover:underline">
                  {emergency.emergencyTypeName} · {emergency.address}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{emergency.description}</p>
              </div>
              <EmergencyStatusBadge status={emergency.status} />
            </div>
          </li>
        ))}
      </ul>
    </AppLayout>
  );
}
