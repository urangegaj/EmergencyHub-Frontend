import { apiClient } from './apiClient';
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

  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/api/auth/login', { email, password }),

  logout: (refreshToken: string, accessToken?: string | null) =>
    apiClient.post('/api/auth/logout', { refreshToken, accessToken }),

  me: () => apiClient.get<AuthUser>('/api/me'),
};
