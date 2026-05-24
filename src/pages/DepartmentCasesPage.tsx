import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { departmentService } from '../services/departmentService';
import { emergencyService } from '../services/emergencyService';
import {
  CASE_TRANSITIONS,
  departmentToRoute,
  parseCaseStatus,
  parseUnitStatus,
} from '../utils/department';
import { getApiErrorMessage } from '../utils/errors';
import type { CaseStatus, Department, DepartmentCase, Emergency, Unit } from '../types';

type Tab = 'cases' | 'units';

export function DepartmentCasesPage() {
  const { user } = useAuth();
  const department = user?.department as Department | undefined;
  const deptRoute = department ? departmentToRoute(department) : null;

  const [activeTab, setActiveTab] = useState<Tab>('cases');
  const [caseStatusFilter, setCaseStatusFilter] = useState<CaseStatus>('OPEN');
  const [cases, setCases] = useState<DepartmentCase[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [emergencyMap, setEmergencyMap] = useState<Record<string, Emergency>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    if (!deptRoute) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await departmentService.getCases(deptRoute, caseStatusFilter);
      setCases(data);
      const emergencies = await Promise.all(
        data.map((item) =>
          emergencyService
            .get(item.emergencyId)
            .then((res) => [item.emergencyId, res.data] as const)
            .catch(() => null),
        ),
      );
      const map: Record<string, Emergency> = {};
      emergencies.forEach((entry) => {
        if (entry) map[entry[0]] = entry[1];
      });
      setEmergencyMap(map);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [deptRoute, caseStatusFilter]);

  const loadUnits = useCallback(async () => {
    if (!deptRoute) return;
    try {
      const { data } = await departmentService.getUnits(deptRoute);
      setUnits(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }, [deptRoute]);

  useEffect(() => {
    if (activeTab === 'cases') void loadCases();
    else void loadUnits();
  }, [activeTab, loadCases, loadUnits]);

  if (!department || !deptRoute) {
    return (
      <AppLayout title="Department cases">
        <p className="text-red-600">Your account has no department assigned.</p>
      </AppLayout>
    );
  }

  const handleUpdateCase = async (
    emergencyId: string,
    status: CaseStatus,
    unitId?: string,
  ) => {
    try {
      await departmentService.updateCase(deptRoute, emergencyId, { status, unitId });
      setExpandedId(null);
      await loadCases();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const handleUnitStatus = async (unitId: string, status: string) => {
    try {
      await departmentService.updateUnitStatus(deptRoute, unitId, status);
      await loadUnits();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <AppLayout title={`${department} cases`}>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('cases')}
          className={`rounded-md px-3 py-2 text-sm ${activeTab === 'cases' ? 'bg-red-600 text-white' : 'border border-slate-300'}`}
        >
          Cases
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('units')}
          className={`rounded-md px-3 py-2 text-sm ${activeTab === 'units' ? 'bg-red-600 text-white' : 'border border-slate-300'}`}
        >
          Units
        </button>
      </div>

      {error && <p className="mb-3 text-red-600">{error}</p>}

      {activeTab === 'cases' && (
        <>
          <div className="mb-4 flex gap-2">
            {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as CaseStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setCaseStatusFilter(status)}
                className={`rounded-md px-3 py-1 text-sm ${
                  caseStatusFilter === status ? 'bg-slate-800 text-white' : 'border border-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          {loading && <p className="text-slate-600">Loading cases...</p>}
          <ul className="space-y-3">
            {cases.map((item) => {
              const current = parseCaseStatus(item.status);
              const emergency = emergencyMap[item.emergencyId];
              const nextStatuses = CASE_TRANSITIONS[current];
              return (
                <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {emergency?.address ?? item.emergencyId}
                        </p>
                        <p className="text-sm text-slate-600">
                          {emergency?.description ?? 'Emergency details unavailable'}
                        </p>
                      </div>
                      <StatusBadge label={current} tone="info" />
                    </div>
                  </button>
                  {expandedId === item.id && nextStatuses.length > 0 && (
                    <CaseUpdateForm
                      caseItem={item}
                      current={current}
                      nextStatuses={nextStatuses}
                      units={units}
                      onUpdate={handleUpdateCase}
                      onLoadUnits={loadUnits}
                    />
                  )}
                  {expandedId === item.id && (
                    <Link
                      to={`/emergencies/${item.emergencyId}`}
                      className="mt-2 inline-block text-sm text-red-700 hover:underline"
                    >
                      View emergency
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {activeTab === 'units' && (
        <ul className="space-y-2">
          {units.map((unit) => {
            const status = parseUnitStatus(unit.status);
            return (
              <li key={unit.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3">
                <div>
                  <p className="font-medium">{unit.name}</p>
                  <StatusBadge label={status} tone="neutral" />
                </div>
                <select
                  value={status}
                  onChange={(e) => void handleUnitStatus(unit.id, e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="DEPLOYED">DEPLOYED</option>
                  <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                </select>
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
}

interface CaseUpdateFormProps {
  caseItem: DepartmentCase;
  current: CaseStatus;
  nextStatuses: CaseStatus[];
  units: Unit[];
  onUpdate: (emergencyId: string, status: CaseStatus, unitId?: string) => Promise<void>;
  onLoadUnits: () => Promise<void>;
}

function CaseUpdateForm({
  caseItem,
  current,
  nextStatuses,
  units,
  onUpdate,
  onLoadUnits,
}: CaseUpdateFormProps) {
  const [nextStatus, setNextStatus] = useState<CaseStatus>(nextStatuses[0]);
  const [unitId, setUnitId] = useState('');

  useEffect(() => {
    void onLoadUnits();
  }, [onLoadUnits]);

  return (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      <label className="block text-sm">
        Update status (from {current})
        <select
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value as CaseStatus)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
        >
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      {nextStatus === 'IN_PROGRESS' && (
        <label className="block text-sm">
          Unit (optional)
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
          >
            <option value="">No unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({parseUnitStatus(unit.status)})
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        onClick={() => void onUpdate(caseItem.emergencyId, nextStatus, unitId || undefined)}
        className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
      >
        Save
      </button>
    </div>
  );
}
