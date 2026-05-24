import type {
  CaseStatus,
  Department,
  DepartmentCase,
  DeptRoute,
  EmergencyStatus,
  Unit,
  UnitStatus,
} from '../types';

export function departmentToRoute(department: Department): DeptRoute {
  return department.toLowerCase() as DeptRoute;
}

export function parseCaseStatus(status: DepartmentCase['status']): CaseStatus {
  if (typeof status === 'number') {
    const map: CaseStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED'];
    return map[status] ?? 'OPEN';
  }
  const normalized = String(status).toUpperCase().replace('-', '_');
  if (normalized === 'OPEN' || normalized === 'IN_PROGRESS' || normalized === 'CLOSED') {
    return normalized as CaseStatus;
  }
  return 'OPEN';
}

export function parseUnitStatus(status: Unit['status']): UnitStatus {
  if (typeof status === 'number') {
    const map: UnitStatus[] = ['AVAILABLE', 'DEPLOYED', 'OUT_OF_SERVICE'];
    return map[status] ?? 'AVAILABLE';
  }
  return status as UnitStatus;
}

export const CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['CLOSED'],
  CLOSED: [],
};

export function isTerminalEmergencyStatus(status: EmergencyStatus): boolean {
  return status === 'Resolved' || status === 'Cancelled';
}
