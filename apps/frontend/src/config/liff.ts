export const LIFF_CONFIG = {
  TICKET: import.meta.env.VITE_LIFF_TICKET,
  SURVEY: import.meta.env.VITE_LIFF_SURVEY,
  UNIT_SURVEY: import.meta.env.VITE_LIFF_UNIT_SURVEY,
  REGISTRATION: import.meta.env.VITE_LIFF_REGISTRATION,
  VERIFY_TICKET: import.meta.env.VITE_LIFF_VERIFY_TICKET,
  CERTIFICATE: import.meta.env.VITE_LIFF_CERTIFICATE,
  NEWS: import.meta.env.VITE_LIFF_NEWS,
  STAFF_DASHBOARD: import.meta.env.VITE_LIFF_STAFF_DASHBOARD,
} as const;

export type LiffAppType = keyof typeof LIFF_CONFIG;
