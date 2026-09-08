const configuredApiUrls = (import.meta.env.VITE_API_URL || '')
  .split(',')
  .map((url: string) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const isProductionMode = import.meta.env.PROD || import.meta.env.VITE_NODE_ENV_STATUS === 'production';

export const API_BASE_URL = isProductionMode
  ? configuredApiUrls[configuredApiUrls.length - 1] ?? configuredApiUrls[0]
  : configuredApiUrls[0] ?? '';