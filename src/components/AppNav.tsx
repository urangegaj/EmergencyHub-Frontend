import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  IconAdmin,
  IconCases,
  IconDashboard,
  IconDispatcher,
  IconReport,
} from './icons/NavIcons';
import { getNavItemsForRole, type NavIconId, type NavItem } from '../utils/routing';

function NavIcon({ id }: { id: NavIconId }) {
  switch (id) {
    case 'report':
      return <IconReport />;
    case 'dispatcher':
      return <IconDispatcher />;
    case 'cases':
      return <IconCases />;
    case 'admin':
      return <IconAdmin />;
    default:
      return <IconDashboard />;
  }
}

function navLinkClass(isActive: boolean) {
  return [
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
    isActive
      ? 'bg-red-600 text-white shadow-sm shadow-red-200'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');
}

function isItemActive(item: NavItem, pathname: string, navActive: boolean) {
  return item.isActive ? item.isActive(pathname) : navActive;
}

export function AppNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;

  const items = getNavItemsForRole(user.role);

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm" aria-label="Main navigation">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2.5">
        {items.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              navLinkClass(isItemActive(item, pathname, isActive))
            }
          >
            <NavIcon id={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
