import { apiClient } from './apiClient';
import { mapAuthUser } from '../utils/apiMappers';
import type { AuthUser, LoginResponse } from '../types';

export const authService = {
  register: (body: {
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
    cityId: string;
    department?: string;
    phone?: string;
  }) => apiClient.post<{ userId: string }>('/api/auth/register', body),

  login: async (email: string, password: string) => {
    const res = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
    return res;
  },

  logout: (refreshToken: string, accessToken?: string | null) =>
    apiClient.post('/api/auth/logout', { refreshToken, accessToken }),

  me: async () => {
    const res = await apiClient.get<unknown>('/api/me');
    return { ...res, data: mapAuthUser(res.data) satisfies AuthUser };
  },
};
