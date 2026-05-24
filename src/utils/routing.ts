import type { AuthUser, Role } from '../types';

/** All roles land on the shared dashboard hub after login. */
export function getRoleLandingPath(_role?: AuthUser['role']): string {
  return '/';
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
  const dashboard: NavItem = {
    label: 'Dashboard',
    to: '/',
    icon: 'dashboard',
    end: true,
    isActive: (p) => p === '/',
  };

  switch (role) {
    case 'Citizen':
      return [
        dashboard,
        {
          label: 'Report emergency',
          to: '/emergencies/report',
          icon: 'report',
          end: true,
        },
      ];
    case 'Dispatcher':
      return [
        dashboard,
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
        dashboard,
        {
          label: 'My cases',
          to: '/cases',
          icon: 'cases',
          end: true,
          isActive: (p) => p === '/cases' || p.startsWith('/emergencies/'),
        },
      ];
    case 'Admin':
      return [
        dashboard,
        {
          label: 'Admin panel',
          to: '/admin',
          icon: 'admin',
          end: true,
        },
      ];
    default:
      return [dashboard];
  }
}
