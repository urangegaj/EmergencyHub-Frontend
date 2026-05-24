import type { AuthUser, Emergency, EmergencyAssignment, EmergencyListResponse, Role } from '../types';

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

function normalizeAssignment(raw: unknown): EmergencyAssignment {
  const a = (raw ?? {}) as JsonRecord;
  return {
    id: str(a.id ?? a.Id),
    departmentType: str(a.departmentType ?? a.DepartmentType) as EmergencyAssignment['departmentType'],
    assignedAt: str(a.assignedAt ?? a.AssignedAt),
    closedAt: (a.closedAt ?? a.ClosedAt) as string | null | undefined,
  };
}

export function normalizeEmergency(raw: unknown): Emergency {
  const e = (raw ?? {}) as JsonRecord;
  const assignmentsRaw = e.assignments ?? e.Assignments;
  const assignments = Array.isArray(assignmentsRaw)
    ? assignmentsRaw.map(normalizeAssignment)
    : [];

  return {
    id: str(e.id ?? e.Id),
    cityId: str(e.cityId ?? e.CityId),
    reportedByUserId: str(e.reportedByUserId ?? e.ReportedByUserId),
    emergencyTypeId: str(e.emergencyTypeId ?? e.EmergencyTypeId),
    emergencyTypeName: str(e.emergencyTypeName ?? e.EmergencyTypeName),
    description: str(e.description ?? e.Description),
    address: str(e.address ?? e.Address),
    status: str(e.status ?? e.Status, 'Reported') as Emergency['status'],
    version: Number(e.version ?? e.Version ?? 0),
    createdAt: str(e.createdAt ?? e.CreatedAt),
    updatedAt: str(e.updatedAt ?? e.UpdatedAt),
    resolvedAt: (e.resolvedAt ?? e.ResolvedAt) as string | null | undefined,
    assignments,
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

/** Gateway returns a bare array; filter/paginate client-side until server supports query params. */
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

export function parseEmergencyListPayload(data: unknown): Emergency[] {
  if (Array.isArray(data)) {
    return data.map(normalizeEmergency);
  }
  const record = (data ?? {}) as JsonRecord;
  const list = record.emergencies ?? record.Emergencies;
  if (Array.isArray(list)) {
    return list.map(normalizeEmergency);
  }
  return [];
}
