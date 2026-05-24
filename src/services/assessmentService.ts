import { apiClient } from './apiClient';
import type { AssessmentReport } from '../types';

export const assessmentService = {
  get: (emergencyId: string) =>
    apiClient.get<AssessmentReport>(`/api/assessments/${emergencyId}`),

  retry: (emergencyId: string) =>
    apiClient.post<AssessmentReport>(`/api/assessments/${emergencyId}/retry`),
};
