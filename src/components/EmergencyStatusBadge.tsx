import type { EmergencyStatus } from '../types';
import { StatusBadge } from './StatusBadge';

function toneForStatus(status: EmergencyStatus): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'Reported':
      return 'warning';
    case 'Dispatched':
    case 'InProgress':
      return 'info';
    case 'Resolved':
      return 'success';
    case 'Cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function EmergencyStatusBadge({ status }: { status: EmergencyStatus }) {
  return <StatusBadge label={status} tone={toneForStatus(status)} />;
}
