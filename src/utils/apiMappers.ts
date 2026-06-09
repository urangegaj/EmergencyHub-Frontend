import type {
  AuthUser,
  Emergency,
  EmergencyAssignment,
  EmergencyListResponse,
  Role,
  StatusHistoryEntry,
} from '../types';

type JsonRecord = Record<string, unknown>;

function str(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

export function mapAuthUser(data: unknown): AuthUser {
  const d = (data ?? {}) as JsonRecord;
  const role = str(d.role ?? d.Role) as Role;
  const department = d.department ?? d.Department;
  return {
    userId: str(d.userId ?? d.UserId),
    cityId: str(d.cityId ?? d.CityId),
    role,
    department: department == null || department === '' ? null : (String(department) as AuthUser['department']),
  };
}

const EMERGENCY_STATUS_MAP: Record<string, Emergency['status']> = {
  REPORTED: 'Reported',
  DISPATCHED: 'Dispatched',
  IN_PROGRESS: 'InProgress',
  INPROGRESS: 'InProgress',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
  Reported: 'Reported',
  Dispatched: 'Dispatched',
  InProgress: 'InProgress',
  Resolved: 'Resolved',
  Cancelled: 'Cancelled',
};

function normalizeEmergencyStatus(raw: unknown): Emergency['status'] {
  return EMERGENCY_STATUS_MAP[str(raw)] ?? 'Reported';
}

function normalizeAssignment(raw: unknown): EmergencyAssignment {
  const a = (raw ?? {}) as JsonRecord;
  return {
    id: str(a.id ?? a.Id),
    departmentType: str(a.departmentType ?? a.DepartmentType) as EmergencyAssignment['departmentType'],
    assignedAt: str(a.assignedAt ?? a.AssignedAt),
    closedAt: (a.closedAt ?? a.ClosedAt) as string | null | undefined,
  };
}

function normalizeStatusHistoryEntry(raw: unknown): StatusHistoryEntry {
  const h = (raw ?? {}) as JsonRecord;
  return {
    status: normalizeEmergencyStatus(h.status ?? h.Status) as StatusHistoryEntry['status'],
    changedAt: str(h.changedAt ?? h.ChangedAt),
    changedBy: str(h.changedBy ?? h.ChangedBy ?? h.changedByUserId ?? h.ChangedByUserId) || undefined,
  };
}

export function normalizeEmergency(raw: unknown): Emergency {
  const e = (raw ?? {}) as JsonRecord;
  const assignmentsRaw = e.assignments ?? e.Assignments;
  const assignments = Array.isArray(assignmentsRaw)
    ? assignmentsRaw.map(normalizeAssignment)
    : [];

  const historyRaw = e.statusHistory ?? e.StatusHistory;
  const statusHistory = Array.isArray(historyRaw)
    ? historyRaw.map(normalizeStatusHistoryEntry)
    : undefined;

  const status = normalizeEmergencyStatus(e.status ?? e.Status);
  const explicitResolved = (e.resolvedAt ?? e.ResolvedAt) as string | null | undefined;
  const resolvedAt =
    explicitResolved ??
    (status === 'Resolved'
      ? statusHistory?.filter((h) => h.status === 'Resolved').at(-1)?.changedAt
      : undefined);

  return {
    id: str(e.id ?? e.Id),
    cityId: str(e.cityId ?? e.CityId),
    reportedByUserId: str(e.reportedByUserId ?? e.ReportedByUserId),
    emergencyTypeId: str(e.emergencyTypeId ?? e.EmergencyTypeId),
    emergencyTypeName: str(e.emergencyTypeName ?? e.EmergencyTypeName),
    description: str(e.description ?? e.Description),
    address: str(e.address ?? e.Address),
    status,
    version: Number(e.version ?? e.Version ?? 0),
    createdAt: str(e.createdAt ?? e.CreatedAt),
    updatedAt: str(e.updatedAt ?? e.UpdatedAt),
    resolvedAt: resolvedAt || undefined,
    assignments,
    statusHistory,
  };
}

export interface EmergencyListParams {
  status?: string;
  typeName?: string;
  fromTs?: number;
  toTs?: number;
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  order?: string;
}

export function filterAndPaginateEmergencies(
  items: Emergency[],
  params?: EmergencyListParams,
): EmergencyListResponse {
  let filtered = [...items];

  if (params?.status) {
    filtered = filtered.filter((e) => e.status === params.status);
  }
  if (params?.typeName) {
    const type = params.typeName.toUpperCase();
    filtered = filtered.filter((e) => e.emergencyTypeName.toUpperCase() === type);
  }
  if (params?.fromTs) {
    filtered = filtered.filter((e) => new Date(e.createdAt).getTime() >= params.fromTs!);
  }
  if (params?.toTs) {
    filtered = filtered.filter((e) => new Date(e.createdAt).getTime() <= params.toTs!);
  }
  if (params?.q) {
    const needle = params.q.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.description.toLowerCase().includes(needle) ||
        e.address.toLowerCase().includes(needle),
    );
  }

  const sortBy = params?.sortBy ?? 'created_at';
  const order = params?.order ?? 'desc';
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'status') {
      cmp = a.status.localeCompare(b.status);
    } else {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return order === 'asc' ? cmp : -cmp;
  });

  const page = params?.page && params.page > 0 ? params.page : 1;
  const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 20;
  const totalCount = filtered.length;
  const start = (page - 1) * pageSize;
  const emergencies = filtered.slice(start, start + pageSize);

  return { emergencies, totalCount, page, pageSize };
}

export function parseEmergencyListPayload(data: unknown): EmergencyListResponse {
  if (Array.isArray(data)) {
    const emergencies = data.map(normalizeEmergency);
    return {
      emergencies,
      totalCount: emergencies.length,
      page: 1,
      pageSize: emergencies.length || 20,
    };
  }

  const record = (data ?? {}) as JsonRecord;
  const list = record.emergencies ?? record.Emergencies ?? record.items ?? record.Items;
  const emergencies = Array.isArray(list) ? list.map(normalizeEmergency) : [];

  return {
    emergencies,
    totalCount: Number(record.totalCount ?? record.TotalCount ?? record.total ?? record.Total ?? emergencies.length),
    page: Number(record.page ?? record.Page ?? 1),
    pageSize: Number(record.pageSize ?? record.PageSize ?? 20),
  };
}
