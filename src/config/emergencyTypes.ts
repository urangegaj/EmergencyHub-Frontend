import type { EmergencyTypeName } from '../types';

export const EMERGENCY_TYPE_OPTIONS: { name: EmergencyTypeName; id: string }[] = [
  { name: 'FIRE', id: import.meta.env.VITE_EMERGENCY_TYPE_FIRE ?? '' },
  { name: 'MEDICAL', id: import.meta.env.VITE_EMERGENCY_TYPE_MEDICAL ?? '' },
  { name: 'CRIME', id: import.meta.env.VITE_EMERGENCY_TYPE_CRIME ?? '' },
  { name: 'OTHER', id: import.meta.env.VITE_EMERGENCY_TYPE_OTHER ?? '' },
];

export const DEFAULT_CITY_ID = import.meta.env.VITE_DEFAULT_CITY_ID ?? '';
