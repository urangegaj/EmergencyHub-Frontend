import type { Role } from '../types';

const roleLabels: Record<Role, string> = {
  Citizen: 'Citizen',
  Dispatcher: 'Dispatcher',
  Responder: 'Responder',
  Admin: 'Administrator',
};

const roleHints: Record<Role, string> = {
  Citizen: 'Report emergencies and track their status in real time.',
  Dispatcher: 'Monitor incoming reports and assign response units.',
  Responder: 'Manage department cases and unit availability.',
  Admin: 'Manage users, roles, and platform access.',
};

interface DashboardHeroProps {
  role: Role;
  department?: string | null;
}

export function DashboardHero({ role, department }: DashboardHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 px-6 py-8 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/5" />
      <p className="text-sm font-medium uppercase tracking-wide text-red-100">Welcome back</p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{roleLabels[role]} dashboard</h1>
      <p className="mt-2 max-w-xl text-sm text-red-100 sm:text-base">{roleHints[role]}</p>
      {department && (
        <span className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          {department} department
        </span>
      )}
    </section>
  );
}
