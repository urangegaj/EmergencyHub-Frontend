import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface QuickActionCardProps {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
  accent?: 'red' | 'slate' | 'blue' | 'amber';
}

const accentStyles = {
  red: 'border-red-100 bg-red-50 text-red-700 group-hover:border-red-200 group-hover:bg-red-100',
  slate: 'border-slate-200 bg-slate-50 text-slate-700 group-hover:border-slate-300 group-hover:bg-slate-100',
  blue: 'border-blue-100 bg-blue-50 text-blue-700 group-hover:border-blue-200 group-hover:bg-blue-100',
  amber: 'border-amber-100 bg-amber-50 text-amber-800 group-hover:border-amber-200 group-hover:bg-amber-100',
};

export function QuickActionCard({
  to,
  title,
  description,
  icon,
  accent = 'red',
}: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border ${accentStyles[accent]}`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 group-hover:text-red-700">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <span className="mt-3 text-sm font-medium text-red-600 opacity-0 transition group-hover:opacity-100">
        Open →
      </span>
    </Link>
  );
}
