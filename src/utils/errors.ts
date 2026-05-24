import axios from 'axios';
import { API_BASE_URL } from '../services/apiClient';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return `Cannot reach the API at ${API_BASE_URL}. Start the backend Gateway (port 5158) and related services, then try again.`;
    }
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object' && 'title' in data && typeof data.title === 'string') {
      return data.title;
    }
    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      return data.detail;
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
