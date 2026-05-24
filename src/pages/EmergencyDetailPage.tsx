import { useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { EmergencyStatusBadge } from '../components/EmergencyStatusBadge';
import { ReportPanel } from '../components/ReportPanel';
import { useEmergencyPoll } from '../hooks/useEmergencyPoll';
import { isTerminalEmergencyStatus } from '../utils/department';

export function EmergencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { emergency, error } = useEmergencyPoll(id);

  const isLive = emergency && !isTerminalEmergencyStatus(emergency.status);

  return (
    <AppLayout title="Emergency detail">
      {error && <p className="mb-4 text-red-600">{error}</p>}
      {!emergency && !error && <p className="text-slate-600">Loading emergency...</p>}
      {emergency && (
        <div className="space-y-4">
          {emergency.status === 'Cancelled' && (
            <div className="rounded-md bg-slate-200 px-4 py-2 text-slate-800">This emergency was cancelled.</div>
          )}
          {emergency.status === 'Resolved' && (
            <div className="rounded-md bg-green-100 px-4 py-2 text-green-800">This emergency has been resolved.</div>
          )}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">Emergency</h1>
              <EmergencyStatusBadge status={emergency.status} />
              {isLive && (
                <span className="flex items-center gap-1 text-sm text-green-700">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  Live
                </span>
              )}
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Type</dt>
                <dd className="font-medium">{emergency.emergencyTypeName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Reported</dt>
                <dd className="font-medium">{new Date(emergency.createdAt).toLocaleString()}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Address</dt>
                <dd className="font-medium">{emergency.address}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Description</dt>
                <dd className="font-medium">{emergency.description}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-lg font-semibold">Assigned departments</h2>
            {emergency.assignments.length === 0 ? (
              <p className="text-sm text-slate-600">No departments assigned yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {emergency.assignments.map((assignment) => (
                  <li
                    key={assignment.id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800"
                  >
                    {assignment.departmentType}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {emergency.status !== 'Cancelled' && (
            <ReportPanel emergencyId={emergency.id} emergencyStatus={emergency.status} />
          )}
        </div>
      )}
    </AppLayout>
  );
}
