import { apiClient } from './apiClient';
import type { PagedUsersResponse } from '../types';

export const adminService = {
  listUsers: (params?: {
    role?: string;
    department?: string;
    page?: number;
    pageSize?: number;
  }) => apiClient.get<PagedUsersResponse>('/api/admin/users', { params }),

  createUser: (body: {
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
    department?: string;
    phone?: string;
  }) => apiClient.post<{ userId: string }>('/api/admin/users', body),

  updateUser: (
    id: string,
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      department?: string;
    },
  ) => apiClient.patch(`/api/admin/users/${id}`, body),

  deleteUser: (id: string) => apiClient.delete(`/api/admin/users/${id}`),

  assignRole: (id: string, role: string, department?: string) =>
    apiClient.patch(`/api/admin/users/${id}/role`, { role, department }),
};
