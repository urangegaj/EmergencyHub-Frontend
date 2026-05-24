import { useState } from 'react';
import { assessmentService } from '../services/assessmentService';
import { useAssessmentPoll } from '../hooks/useAssessmentPoll';
import { getApiErrorMessage } from '../utils/errors';
import type { EmergencyStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface ReportPanelProps {
  emergencyId: string;
  emergencyStatus: EmergencyStatus;
}

export function ReportPanel({ emergencyId, emergencyStatus }: ReportPanelProps) {
  const { report, setReport, restartPolling } = useAssessmentPoll(emergencyId, emergencyStatus);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      const { data } = await assessmentService.retry(emergencyId);
      setReport({ ...data, status: 'Pending' });
      restartPolling();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setRetrying(false);
    }
  };

  if (emergencyStatus !== 'Resolved') return null;

  const isLoading =
    !report || report.status === 'Pending' || report.status === 'Sent';

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Assessment Report</h2>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-600">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Generating assessment report...
        </div>
      )}

      {report?.status === 'Completed' && (
        <div className="space-y-3">
          <StatusBadge label="Completed" tone="success" />
          <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-800">
            {report.aiResponse ?? 'No report content.'}
          </pre>
        </div>
      )}

      {report?.status === 'Failed' && (
        <div className="space-y-3">
          <StatusBadge label="Failed" tone="danger" />
          <p className="text-sm text-red-700">{report.lastError ?? 'Report generation failed.'}</p>
          <button
            type="button"
            disabled={retrying}
            onClick={() => void handleRetry()}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
