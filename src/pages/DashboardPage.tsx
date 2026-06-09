import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { DashboardHero } from '../components/DashboardHero';
import { EmergencyStatusBadge } from '../components/EmergencyStatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorAlert } from '../components/ErrorAlert';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { IconReport } from '../components/icons/NavIcons';
import { useAuth } from '../contexts/AuthContext';
import { emergencyService } from '../services/emergencyService';
import { getApiErrorMessage } from '../utils/errors';
import { getRoleLandingPath } from '../utils/routing';
import type { Emergency } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role ?? 'Citizen';

  useEffect(() => {
    if (role !== 'Citizen') return;
    let cancelled = false;
    setLoading(true);
    emergencyService
      .list({ page: 1, pageSize: 50, sortBy: 'created_at', order: 'desc' })
      .then((res) => {
        if (cancelled) return;
        const mine = user
          ? res.data.emergencies.filter((e) => e.reportedByUserId === user.userId)
          : res.data.emergencies;
        setEmergencies(mine);
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, role]);

  if (role !== 'Citizen') {
    return <Navigate to={getRoleLandingPath(role)} replace />;
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <DashboardHero role={role} department={user?.department} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">My emergencies</h2>
          {user?.role === 'Citizen' && (
            <Link
              to="/emergencies/report"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              <IconReport className="h-4 w-4 text-white" />
              Report emergency
            </Link>
          )}
        </div>

        {loading && <LoadingSpinner label="Loading emergencies..." />}
        {error && <ErrorAlert message={error} />}
        {!loading && !error && emergencies.length === 0 && (
          <EmptyState
            title="No emergencies yet"
            description={
              user?.role === 'Citizen'
                ? 'Report an emergency to get help from dispatch.'
                : 'No emergencies match your account.'
            }
            action={
              user?.role === 'Citizen' ? (
                <Link
                  to="/emergencies/report"
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  <IconReport className="h-4 w-4 text-white" />
                  Report emergency
                </Link>
              ) : undefined
            }
          />
        )}
        <ul className="space-y-3">
          {emergencies.map((emergency) => (
            <li
              key={emergency.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-200 hover:shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link
                    to={`/emergencies/${emergency.id}`}
                    className="font-medium text-red-700 hover:underline"
                  >
                    {emergency.emergencyTypeName} · {emergency.address}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{emergency.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(emergency.createdAt).toLocaleString()}
                  </p>
                </div>
                <EmergencyStatusBadge status={emergency.status} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppLayout>
  );
}
