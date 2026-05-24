import axios from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object' && 'title' in data && typeof data.title === 'string') {
      return data.title;
    }
    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      return data.detail;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
