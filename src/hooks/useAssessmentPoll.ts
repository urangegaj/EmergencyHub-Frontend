import { useCallback, useEffect, useRef, useState } from 'react';
import { assessmentService } from '../services/assessmentService';
import type { AssessmentReport, EmergencyStatus } from '../types';

const TERMINAL_REPORT_STATUSES: AssessmentReport['status'][] = ['Completed', 'Failed'];

export function useAssessmentPoll(
  emergencyId: string | undefined,
  emergencyStatus: EmergencyStatus | undefined,
) {
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [pollGeneration, setPollGeneration] = useState(0);
  const activeRef = useRef(false);

  const restartPolling = useCallback(() => {
    setPollGeneration((generation) => generation + 1);
  }, []);

  const resetReport = useCallback((next: AssessmentReport | null) => {
    setReport(next);
  }, []);

  useEffect(() => {
    if (!emergencyId || emergencyStatus !== 'Resolved') return;
    activeRef.current = true;
    setReport(null);

    const poll = async () => {
      while (activeRef.current) {
        try {
          const { data } = await assessmentService.get(emergencyId);
          if (!activeRef.current) break;
          setReport(data);
          if (TERMINAL_REPORT_STATUSES.includes(data.status)) break;
        } catch {
          // 404 or not ready — keep polling
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    };

    void poll();
    return () => {
      activeRef.current = false;
    };
  }, [emergencyId, emergencyStatus, pollGeneration]);

  return { report, setReport: resetReport, restartPolling };
}
