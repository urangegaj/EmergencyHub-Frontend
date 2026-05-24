export type Role = 'Citizen' | 'Dispatcher' | 'Responder' | 'Admin';

export type Department = 'Fire' | 'Police' | 'Medical';

export type EmergencyStatus =
  | 'Reported'
  | 'Dispatched'
  | 'InProgress'
  | 'Resolved'
  | 'Cancelled';

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export type UnitStatus = 'AVAILABLE' | 'DEPLOYED' | 'OUT_OF_SERVICE';

export type ReportStatus = 'Pending' | 'Sent' | 'Completed' | 'Failed';

export type EmergencyTypeName = 'FIRE' | 'MEDICAL' | 'CRIME' | 'OTHER';

export interface AuthUser {
  userId: string;
  cityId: string;
  role: Role;
  department?: Department | null;
}

export interface LoginResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
}

export interface EmergencyAssignment {
  id: string;
  departmentType: Department;
  assignedAt: string;
  closedAt?: string | null;
}

export interface StatusHistoryEntry {
  status: EmergencyStatus;
  changedAt: string;
  changedBy?: string;
}

export interface Emergency {
  id: string;
  cityId: string;
  reportedByUserId: string;
  emergencyTypeId: string;
  emergencyTypeName: string;
  description: string;
  address: string;
  status: EmergencyStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  assignments: EmergencyAssignment[];
  statusHistory?: StatusHistoryEntry[];
}

export interface EmergencyListResponse {
  emergencies: Emergency[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface DepartmentCase {
  id: string;
  emergencyId: string;
  cityId: string;
  status: CaseStatus | number;
  assignedUnitId?: string | null;
  assignedUnitName?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}

export interface Unit {
  id: string;
  cityId: string;
  name: string;
  status: UnitStatus | number;
}

export interface AssessmentReport {
  id: string;
  emergencyId: string;
  status: ReportStatus;
  aiResponse?: string | null;
  lastError?: string | null;
  retryCount: number;
  createdAt: string;
  sentAt?: string | null;
}

export interface DispatcherUnitsResponse {
  police: Unit[];
  fire: Unit[];
  medical: Unit[];
}

export interface AdminUser {
  userId: string;
  email: string;
  role: string;
  department?: Department | null;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PagedUsersResponse {
  users: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type DeptRoute = 'fire' | 'police' | 'medical';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}
