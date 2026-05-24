interface StatusBadgeProps {
  label: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

const toneClasses: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
};

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}
