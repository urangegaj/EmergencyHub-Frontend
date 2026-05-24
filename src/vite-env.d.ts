/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_DEFAULT_CITY_ID: string;
  readonly VITE_EMERGENCY_TYPE_FIRE: string;
  readonly VITE_EMERGENCY_TYPE_MEDICAL: string;
  readonly VITE_EMERGENCY_TYPE_CRIME: string;
  readonly VITE_EMERGENCY_TYPE_OTHER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
