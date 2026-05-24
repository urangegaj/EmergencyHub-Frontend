import { useCallback, useEffect, useRef, useState } from 'react';
import { assessmentService } from '../services/assessmentService';
import type { AssessmentReport, EmergencyStatus } from '../types';

export function useAssessmentPoll(
  emergencyId: string | undefined,
  emergencyStatus: EmergencyStatus | undefined,
) {
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const activeRef = useRef(false);

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
          if (data.status === 'Completed' || data.status === 'Failed') break;
        } catch {
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    };

    void poll();
    return () => {
      activeRef.current = false;
    };
  }, [emergencyId, emergencyStatus]);

  return { report, setReport: resetReport };
}
