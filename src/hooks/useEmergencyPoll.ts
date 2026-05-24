import { useCallback, useEffect, useRef, useState } from 'react';
import { emergencyService } from '../services/emergencyService';
import { isTerminalEmergencyStatus } from '../utils/department';
import type { Emergency } from '../types';

export function useEmergencyPoll(emergencyId: string | undefined) {
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeRef = useRef(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!emergencyId) return;
    activeRef.current = true;
    setError(null);

    const run = async () => {
      let since = 0;

      try {
        const { data } = await emergencyService.get(emergencyId);
        if (!activeRef.current) return;
        setEmergency(data);
        since = data.version;
        if (isTerminalEmergencyStatus(data.status)) {
          stop();
          return;
        }
      } catch (e) {
        if (!activeRef.current) return;
        setError(e instanceof Error ? e.message : 'Failed to load emergency');
        return;
      }

      while (activeRef.current) {
        abortRef.current = new AbortController();
        try {
          const { data } = await emergencyService.poll(
            emergencyId,
            since,
            30,
            abortRef.current.signal,
          );
          if (!activeRef.current) break;
          setEmergency(data);
          since = data.version;
          if (isTerminalEmergencyStatus(data.status)) {
            stop();
            break;
          }
        } catch (e) {
          if (!activeRef.current) break;
          const err = e as { name?: string; code?: string };
          if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    };

    void run();
    return () => stop();
  }, [emergencyId, stop]);

  return { emergency, error, stop };
}
