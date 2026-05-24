import { EmergencyStatusBadge } from './EmergencyStatusBadge';
import type { StatusHistoryEntry } from '../types';

interface StatusHistoryTimelineProps {
  entries: StatusHistoryEntry[];
  currentStatus?: StatusHistoryEntry['status'];
}

export function StatusHistoryTimeline({ entries, currentStatus }: StatusHistoryTimelineProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  if (sorted.length === 0 && currentStatus) {
    return (
      <p className="text-sm text-slate-600">
        Current status: <EmergencyStatusBadge status={currentStatus} />
      </p>
    );
  }

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-600">No status history available.</p>;
  }

  return (
    <ol className="relative border-l border-slate-200 pl-4">
      {sorted.map((entry, index) => (
        <li key={`${entry.changedAt}-${entry.status}-${index}`} className="mb-4 last:mb-0">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
          <div className="flex flex-wrap items-center gap-2">
            <EmergencyStatusBadge status={entry.status} />
            <time className="text-xs text-slate-500">
              {new Date(entry.changedAt).toLocaleString()}
            </time>
          </div>
          {entry.changedBy && (
            <p className="mt-1 text-xs text-slate-500">By {entry.changedBy}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
