import { apiClient } from './apiClient';
import type { DepartmentCase, DeptRoute, DispatcherUnitsResponse, Unit } from '../types';

/** Gateway has no /api/dispatcher/units; aggregate per-department unit endpoints. */
export const departmentService = {
  getCases: (dept: DeptRoute, status?: string) =>
    apiClient.get<DepartmentCase[]>(`/api/${dept}/cases`, {
      params: status ? { status } : undefined,
    }),

  getCase: (dept: DeptRoute, emergencyId: string) =>
    apiClient.get<DepartmentCase>(`/api/${dept}/cases/${emergencyId}`),

  updateCase: (dept: DeptRoute, emergencyId: string, body: { status: string; unitId?: string }) =>
    apiClient.put<DepartmentCase>(`/api/${dept}/cases/${emergencyId}`, body),

  getUnits: (dept: DeptRoute) => apiClient.get<Unit[]>(`/api/${dept}/units`),

  updateUnitStatus: (dept: DeptRoute, unitId: string, status: string) =>
    apiClient.put<Unit>(`/api/${dept}/units/${unitId}/status`, { status }),

  getDispatcherUnits: async () => {
    const [fire, police, medical] = await Promise.all([
      apiClient.get<Unit[]>('/api/fire/units'),
      apiClient.get<Unit[]>('/api/police/units'),
      apiClient.get<Unit[]>('/api/medical/units'),
    ]);
    return {
      data: {
        fire: fire.data ?? [],
        police: police.data ?? [],
        medical: medical.data ?? [],
      } satisfies DispatcherUnitsResponse,
    };
  },
};
