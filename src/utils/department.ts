import type {
  CaseStatus,
  Department,
  DepartmentCase,
  DeptRoute,
  EmergencyStatus,
  Unit,
  UnitStatus,
} from '../types';

const DEPARTMENT_ROUTE_MAP: Record<string, DeptRoute> = {
  Fire: 'fire',
  FIRE: 'fire',
  Police: 'police',
  POLICE: 'police',
  Medical: 'medical',
  MEDICAL: 'medical',
};

export function departmentToRoute(department: Department | string): DeptRoute {
  const route = DEPARTMENT_ROUTE_MAP[department];
  if (!route) {
    throw new Error(`Unknown department: ${department}`);
  }
  return route;
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
