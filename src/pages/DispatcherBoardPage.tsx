import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { EmergencyStatusBadge } from '../components/EmergencyStatusBadge';
import {
  defaultEmergencyFilters,
  EmergencyFilterBar,
  type EmergencyFilters,
} from '../components/EmergencyFilterBar';
import { EmptyState } from '../components/EmptyState';
import { ErrorAlert } from '../components/ErrorAlert';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { UnitAvailabilityWidget } from '../components/UnitAvailabilityWidget';
import { emergencyService } from '../services/emergencyService';
import { getApiErrorMessage } from '../utils/errors';
import type { Department, Emergency } from '../types';

export function DispatcherBoardPage() {
  const [filters, setFilters] = useState<EmergencyFilters>(defaultEmergencyFilters);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const [assigning, setAssigning] = useState(false);

  const loadEmergencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: filters.page,
        pageSize: filters.pageSize,
        sortBy: filters.sortBy,
        order: filters.order,
      };
      if (filters.status) params.status = filters.status;
      if (filters.typeName) params.typeName = filters.typeName;
      if (debouncedQ) params.q = debouncedQ;
      if (filters.fromTs) params.fromTs = new Date(filters.fromTs).getTime();
      if (filters.toTs) params.toTs = new Date(filters.toTs).getTime();

      const { data } = await emergencyService.list(params);
      setEmergencies(data.emergencies);
      setTotalCount(data.totalCount);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedQ]);

  useEffect(() => {
    void loadEmergencies();
  }, [loadEmergencies]);

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));

  const handleAssign = async (emergencyId: string) => {
    if (selectedDepartments.length === 0) return;
    setAssigning(true);
    setError(null);
    const previous = emergencies;
    setEmergencies((list) =>
      list.map((item) =>
        item.id === emergencyId ? { ...item, status: 'Dispatched' as const } : item,
      ),
    );
    try {
      await emergencyService.assign(emergencyId, selectedDepartments);
      setAssigningId(null);
      setSelectedDepartments([]);
      await loadEmergencies();
    } catch (e) {
      setEmergencies(previous);
      setError(getApiErrorMessage(e));
    } finally {
      setAssigning(false);
    }
  };

  const clearFilters = () => {
    setFilters(defaultEmergencyFilters);
    setDebouncedQ('');
  };

  return (
    <AppLayout title="Dispatcher board">
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Unit availability</h2>
          <UnitAvailabilityWidget />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <EmergencyFilterBar
            filters={filters}
            onChange={setFilters}
            onDebouncedSearchChange={(q) => {
              setDebouncedQ(q);
              setFilters((prev) => ({ ...prev, q, page: 1 }));
            }}
            onClear={clearFilters}
          />
        </section>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {loading && <LoadingSpinner label="Loading emergencies..." />}

        {!loading && emergencies.length === 0 && (
          <EmptyState
            title="No emergencies found"
            description="Try adjusting filters or check back later."
          />
        )}

        <ul className="space-y-3">
          {emergencies.map((emergency) => (
            <li key={emergency.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/emergencies/${emergency.id}`}
                    className="font-medium text-red-700 hover:underline"
                  >
                    {emergency.emergencyTypeName} · {emergency.address}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{emergency.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(emergency.createdAt).toLocaleString()} ·{' '}
                    {emergency.assignments.length} assignment(s)
                  </p>
                </div>
                <EmergencyStatusBadge status={emergency.status} />
              </div>
              {emergency.status === 'Reported' && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {assigningId === emergency.id ? (
                    <div className="space-y-2">
                      {(['Fire', 'Police', 'Medical'] as Department[]).map((dept) => (
                        <label key={dept} className="mr-4 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept)}
                            onChange={(e) => {
                              setSelectedDepartments((prev) =>
                                e.target.checked
                                  ? [...prev, dept]
                                  : prev.filter((d) => d !== dept),
                              );
                            }}
                          />{' '}
                          {dept}
                        </label>
                      ))}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={assigning || selectedDepartments.length === 0}
                          onClick={() => void handleAssign(emergency.id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                        >
                          {assigning ? 'Assigning...' : 'Confirm assign'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningId(null);
                            setSelectedDepartments([]);
                          }}
                          className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningId(emergency.id);
                        setSelectedDepartments([]);
                      }}
                      className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
                    >
                      Assign
                    </button>
                  )}
                </div>
              )}
              {emergency.status !== 'Resolved' && emergency.status !== 'Cancelled' && (
                <button
                  type="button"
                  disabled
                  title="Coming soon — backend cancel route not available"
                  className="mt-2 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-400"
                >
                  Cancel (coming soon)
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {filters.page} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={filters.page >= totalPages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
