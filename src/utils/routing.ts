import type { AuthUser } from '../types';

export function getRoleLandingPath(role: AuthUser['role']): string {
  switch (role) {
    case 'Dispatcher':
      return '/dispatcher';
    case 'Responder':
      return '/cases';
    case 'Admin':
      return '/admin';
    default:
      return '/';
  }
}
