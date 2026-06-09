import type { EmergencyTypeName } from '../types';

export const EMERGENCY_TYPE_OPTIONS: { name: EmergencyTypeName; id: string }[] = [
  { name: 'FIRE',    id: import.meta.env.VITE_EMERGENCY_TYPE_FIRE    || '20000000-0000-0000-0000-000000000001' },
  { name: 'MEDICAL', id: import.meta.env.VITE_EMERGENCY_TYPE_MEDICAL || '20000000-0000-0000-0000-000000000002' },
  { name: 'CRIME',   id: import.meta.env.VITE_EMERGENCY_TYPE_CRIME   || '20000000-0000-0000-0000-000000000003' },
  { name: 'OTHER',   id: import.meta.env.VITE_EMERGENCY_TYPE_OTHER   || '20000000-0000-0000-0000-000000000004' },
];

export const DEFAULT_CITY_ID = import.meta.env.VITE_DEFAULT_CITY_ID || '10000000-0000-0000-0000-000000000001';
