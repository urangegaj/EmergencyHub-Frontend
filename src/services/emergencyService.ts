import { apiClient } from './apiClient';
import type { Emergency, EmergencyListResponse } from '../types';

export const emergencyService = {
  create: (body: { emergencyTypeId: string; description: string; address: string }) =>
    apiClient.post<Emergency>('/api/emergencies', body),

  get: (id: string) => apiClient.get<Emergency>(`/api/emergencies/${id}`),

  list: (params?: {
    status?: string;
    typeName?: string;
    fromTs?: number;
    toTs?: number;
    q?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    order?: string;
  }) => apiClient.get<EmergencyListResponse>('/api/emergencies', { params }),

  poll: (id: string, since: number, timeout = 30, signal?: AbortSignal) =>
    apiClient.get<Emergency>(`/api/emergencies/${id}/poll`, {
      params: { since, timeout },
      signal,
    }),

  assign: (id: string, departments: string[]) =>
    apiClient.post<Emergency>(`/api/emergencies/${id}/assign`, { departments }),
};
