import { useEffect, useState, type FormEvent } from 'react';
import type { EmergencyStatus } from '../types';

export interface EmergencyFilters {
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

export const defaultEmergencyFilters: EmergencyFilters = {
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

interface EmergencyFilterBarProps {
  filters: EmergencyFilters;
  onChange: (next: EmergencyFilters) => void;
  onDebouncedSearchChange: (q: string) => void;
  onClear: () => void;
}

export function EmergencyFilterBar({
  filters,
  onChange,
  onDebouncedSearchChange,
  onClear,
}: EmergencyFilterBarProps) {
  const [localQ, setLocalQ] = useState(filters.q);

  useEffect(() => {
    setLocalQ(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => onDebouncedSearchChange(localQ), 300);
    return () => window.clearTimeout(timer);
  }, [localQ, onDebouncedSearchChange]);

  const patch = (partial: Partial<EmergencyFilters>) => {
    onChange({ ...filters, ...partial, page: partial.page ?? 1 });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    patch({ q: localQ });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
      <label className="text-sm">
        Status
        <select
          value={filters.status}
          onChange={(e) => patch({ status: e.target.value })}
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
          onChange={(e) => patch({ typeName: e.target.value })}
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
          onChange={(e) => patch({ fromTs: e.target.value })}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
        />
      </label>
      <label className="text-sm">
        To
        <input
          type="date"
          value={filters.toTs}
          onChange={(e) => patch({ toTs: e.target.value })}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
        />
      </label>
      <label className="text-sm md:col-span-2">
        Search
        <input
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
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
            patch({ sortBy, order });
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
          onChange={(e) => patch({ pageSize: Number(e.target.value) })}
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
          onClick={onClear}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
