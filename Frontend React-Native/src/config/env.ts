const DEFAULT_PRODUCTION_API_URL = 'https://leaderskey-banner-application.onrender.com/api';

export const appConfig = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || DEFAULT_PRODUCTION_API_URL
};

export const getApiBaseUrl = (): string => {
  const value = (appConfig.apiUrl || '').trim();
  if (!value || value === '${EXPO_PUBLIC_API_URL}') {
    return DEFAULT_PRODUCTION_API_URL;
  }
  return value.replace(/\/+$/, '');
};
