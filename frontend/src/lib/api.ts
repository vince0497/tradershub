const developmentApiUrl = 'http://localhost:5000';
const productionApiUrl = 'https://tradershub.onrender.com';
const configuredApiUrl = import.meta.env.VITE_API_URL;
const isLocalApiUrl = configuredApiUrl?.startsWith('http://localhost');

export const API_BASE_URL = import.meta.env.PROD
  ? (configuredApiUrl && !isLocalApiUrl ? configuredApiUrl : productionApiUrl)
  : (configuredApiUrl || developmentApiUrl);