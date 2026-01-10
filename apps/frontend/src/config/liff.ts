export const LIFF_CONFIG = {
  TICKET: '2008498720-IgQ8sUzW',
  SURVEY: '2008498720-Sd7gGdIL',
  UNIT_SURVEY: '2008498720-IskiQTvw',
} as const;

export type LiffAppType = keyof typeof LIFF_CONFIG;
