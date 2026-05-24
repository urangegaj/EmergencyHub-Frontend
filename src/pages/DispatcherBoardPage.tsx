import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { EmergencyStatusBadge } from '../components/EmergencyStatusBadge';
import { UnitAvailabilityWidget } from '../components/UnitAvailabilityWidget';
import { emergencyService } from '../services/emergencyService';
import { getApiErrorMessage } from '../utils/errors';
import type { Department, Emergency, EmergencyStatus } from '../types';

interface Filters {
  status: string;
  typeName: string;
  fromTs: string;
  toTs: string;
  q: string;
  page: number;
  pageSize: number;
  sortBy: string;
  order: string;
}

const defaultFilters: Filters = {
  status: '',
  typeName: '',
  fromTs: '',
  toTs: '',
  q: '',
  page: 1,
  pageSize: 20,
  sortBy: 'created_at',
  order: 'desc',
};

export function DispatcherBoardPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(filters.q), 300);
    return () => window.clearTimeout(timer);
  }, [filters.q]);

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
    try {
      await emergencyService.assign(emergencyId, selectedDepartments);
      setAssigningId(null);
      setSelectedDepartments([]);
      await loadEmergencies();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const handleFilterSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
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
          <form onSubmit={handleFilterSubmit} className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <label className="text-sm">
              Status
              <select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
              >
                <option value="">All</option>
                {(['Reported', 'Dispatched', 'InProgress', 'Resolved', 'Cancelled'] as EmergencyStatus[]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="text-sm">
              Type
              <select
                value={filters.typeName}
                onChange={(e) => setFilters((p) => ({ ...p, typeName: e.target.value, page: 1 }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
              >
                <option value="">All</option>
                <option value="FIRE">FIRE</option>
                <option value="MEDICAL">MEDICAL</option>
                <option value="CRIME">CRIME</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>
            <label className="text-sm">
              From
              <input
                type="date"
                value={filters.fromTs}
                onChange={(e) => setFilters((p) => ({ ...p, fromTs: e.target.value, page: 1 }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="text-sm">
              To
              <input
                type="date"
                value={filters.toTs}
                onChange={(e) => setFilters((p) => ({ ...p, toTs: e.target.value, page: 1 }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="text-sm md:col-span-2">
              Search
              <input
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value, page: 1 }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
                placeholder="Address or description"
              />
            </label>
            <label className="text-sm">
              Sort
              <select
                value={`${filters.sortBy}:${filters.order}`}
                onChange={(e) => {
                  const [sortBy, order] = e.target.value.split(':');
                  setFilters((p) => ({ ...p, sortBy, order, page: 1 }));
                }}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
              >
                <option value="created_at:desc">Created (newest)</option>
                <option value="created_at:asc">Created (oldest)</option>
                <option value="status:asc">Status</option>
              </select>
            </label>
            <label className="text-sm">
              Page size
              <select
                value={filters.pageSize}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, pageSize: Number(e.target.value), page: 1 }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white">
                Apply
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        {error && <p className="text-red-600">{error}</p>}
        {loading && <p className="text-slate-600">Loading emergencies...</p>}

        <ul className="space-y-3">
          {emergencies.map((emergency) => (
            <li key={emergency.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to={`/emergencies/${emergency.id}`} className="font-medium text-red-700 hover:underline">
                    {emergency.emergencyTypeName} · {emergency.address}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{emergency.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(emergency.createdAt).toLocaleString()} · {emergency.assignments.length} assignment(s)
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
                          onClick={() => void handleAssign(emergency.id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
                        >
                          Confirm assign
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
                  title="Coming soon"
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
