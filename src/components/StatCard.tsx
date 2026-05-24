interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'default' | 'warning' | 'success';
}

const toneStyles = {
  default: 'border-slate-200 bg-white text-slate-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  success: 'border-green-200 bg-green-50 text-green-900',
};

export function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneStyles[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
