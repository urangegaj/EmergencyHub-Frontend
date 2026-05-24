import { apiClient } from './apiClient';
import {
  filterAndPaginateEmergencies,
  normalizeEmergency,
  parseEmergencyListPayload,
  type EmergencyListParams,
} from '../utils/apiMappers';
import type { EmergencyListResponse } from '../types';

export const emergencyService = {
  create: async (body: { emergencyTypeId: string; description: string; address: string }) => {
    const res = await apiClient.post<unknown>('/api/emergencies', body);
    return { ...res, data: normalizeEmergency(res.data) };
  },

  get: async (id: string) => {
    const res = await apiClient.get<unknown>(`/api/emergencies/${id}`);
    return { ...res, data: normalizeEmergency(res.data) };
  },

  list: async (params?: EmergencyListParams) => {
    const res = await apiClient.get<unknown>('/api/emergencies');
    const all = parseEmergencyListPayload(res.data);
    const paged = filterAndPaginateEmergencies(all, params);
    return { ...res, data: paged satisfies EmergencyListResponse };
  },

  poll: async (id: string, since: number, timeout = 30, signal?: AbortSignal) => {
    const res = await apiClient.get<unknown>(`/api/emergencies/${id}/poll`, {
      params: { since, timeout },
      signal,
    });
    return { ...res, data: normalizeEmergency(res.data) };
  },

  assign: async (id: string, departments: string[]) => {
    const res = await apiClient.post<unknown>(`/api/emergencies/${id}/assign`, { departments });
    return { ...res, data: normalizeEmergency(res.data) };
  },
};
