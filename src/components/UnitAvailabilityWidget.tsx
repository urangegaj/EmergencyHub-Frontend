import { useCallback, useEffect, useState } from 'react';
import { departmentService } from '../services/departmentService';
import { getApiErrorMessage } from '../utils/errors';
import { parseUnitStatus } from '../utils/department';
import type { DispatcherUnitsResponse, UnitStatus } from '../types';

function countByStatus(units: { status: UnitStatus | number }[], status: UnitStatus) {
  return units.filter((unit) => parseUnitStatus(unit.status) === status).length;
}

export function UnitAvailabilityWidget() {
  const [units, setUnits] = useState<DispatcherUnitsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await departmentService.getDispatcherUnits();
      setUnits(res.data);
      setError(null);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  if (loading && !units) {
    return <p className="text-sm text-slate-600">Loading unit availability...</p>;
  }

  if (error && !units) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!units) return null;

  const sections = [
    { label: 'Police', items: units.police ?? [] },
    { label: 'Fire', items: units.fire ?? [] },
    { label: 'Medical', items: units.medical ?? [] },
  ];

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-amber-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        {sections.map((section) => (
          <div key={section.label} className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="font-semibold text-slate-900">{section.label}</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Available: {countByStatus(section.items, 'AVAILABLE')}</li>
              <li>Deployed: {countByStatus(section.items, 'DEPLOYED')}</li>
              <li>Out of service: {countByStatus(section.items, 'OUT_OF_SERVICE')}</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
