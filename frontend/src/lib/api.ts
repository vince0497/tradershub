const configuredApiUrls = (import.meta.env.VITE_API_URL || '')
  .split(',')
  .map((url: string) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const API_BASE_URL = import.meta.env.NODE_ENV === 'production'
  ? configuredApiUrls[configuredApiUrls.length - 1]
  : configuredApiUrls[0];