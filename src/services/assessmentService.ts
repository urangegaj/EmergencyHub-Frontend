import { apiClient } from './apiClient';
import type { AssessmentReport, ReportStatus } from '../types';

function normalizeReport(raw: Record<string, unknown>): AssessmentReport {
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    emergencyId: String(raw.emergencyId ?? raw.EmergencyId ?? ''),
    status: String(raw.status ?? raw.Status ?? 'Pending') as ReportStatus,
    aiResponse: (raw.aiResponse ?? raw.AiResponse ?? raw.openaiResponse ?? raw.OpenaiResponse) as
      | string
      | null
      | undefined,
    responseRating:
      raw.responseRating != null || raw.ResponseRating != null
        ? Number(raw.responseRating ?? raw.ResponseRating)
        : undefined,
    lastError: (raw.lastError ?? raw.LastError) as string | null | undefined,
    retryCount: Number(raw.retryCount ?? raw.RetryCount ?? 0),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
    sentAt: (raw.sentAt ?? raw.SentAt) as string | null | undefined,
  };
}

export const assessmentService = {
  get: async (emergencyId: string) => {
    const res = await apiClient.get<unknown>(`/api/assessments/${emergencyId}`);
    return { ...res, data: normalizeReport((res.data ?? {}) as Record<string, unknown>) };
  },

  retry: async (emergencyId: string) => {
    const res = await apiClient.post<unknown>(`/api/assessments/${emergencyId}/retry`);
    return { ...res, data: normalizeReport((res.data ?? {}) as Record<string, unknown>) };
  },
};
