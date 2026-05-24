import { apiClient } from './apiClient';
import type { AdminUser, PagedUsersResponse } from '../types';

function normalizeAdminUser(raw: Record<string, unknown>): AdminUser {
  return {
    userId: String(raw.userId ?? ''),
    email: String(raw.email ?? ''),
    role: String(raw.role ?? ''),
    department: (raw.department as AdminUser['department']) ?? null,
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    phone: (raw.phone as string | null) ?? null,
    isActive: Boolean(raw.isActive ?? true),
    createdAt: String(raw.createdAt ?? ''),
  };
}

export const adminService = {
  listUsers: async (params?: {
    role?: string;
    department?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const res = await apiClient.get<unknown>('/api/admin/users', { params });
    const body = (res.data ?? {}) as Record<string, unknown>;
    const usersRaw = body.users;
    const users = Array.isArray(usersRaw)
      ? usersRaw.map((u) => normalizeAdminUser(u as Record<string, unknown>))
      : [];
    const data: PagedUsersResponse = {
      users,
      totalCount: Number(body.totalCount ?? users.length),
      page: Number(body.page ?? params?.page ?? 1),
      pageSize: Number(body.pageSize ?? params?.pageSize ?? 20),
    };
    return { ...res, data };
  },

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
