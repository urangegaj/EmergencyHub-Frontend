import type { AuthUser, Role } from '../types';

export function getRoleLandingPath(role?: AuthUser['role']): string {
  switch (role) {
    case 'Dispatcher': return '/dispatcher';
    case 'Responder':  return '/cases';
    case 'Admin':      return '/admin';
    default:           return '/';
  }
}

export type NavIconId = 'dashboard' | 'report' | 'dispatcher' | 'cases' | 'admin';

export interface NavItem {
  label: string;
  to: string;
  icon: NavIconId;
  end?: boolean;
  isActive?: (pathname: string) => boolean;
}

export function getNavItemsForRole(role: Role): NavItem[] {
  switch (role) {
    case 'Citizen':
      return [
        { label: 'Dashboard', to: '/', icon: 'dashboard', end: true, isActive: (p) => p === '/' },
        { label: 'Report emergency', to: '/emergencies/report', icon: 'report', end: true },
      ];
    case 'Dispatcher':
      return [
        {
          label: 'Dispatcher board',
          to: '/dispatcher',
          icon: 'dispatcher',
          end: true,
          isActive: (p) => p === '/dispatcher' || p.startsWith('/emergencies/'),
        },
      ];
    case 'Responder':
      return [
        {
          label: 'My cases',
          to: '/cases',
          icon: 'cases',
          end: true,
          isActive: (p) => p === '/cases' || p.startsWith('/emergencies/'),
        },
      ];
    case 'Admin':
      return [{ label: 'Admin panel', to: '/admin', icon: 'admin', end: true }];
    default:
      return [{ label: 'Dashboard', to: '/', icon: 'dashboard', end: true }];
  }
}
