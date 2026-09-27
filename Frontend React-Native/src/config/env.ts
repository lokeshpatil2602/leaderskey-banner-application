export const appConfig = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? ''
};

export const getApiBaseUrl = (): string => {
  const value = appConfig.apiUrl.trim();
  if (!value) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured. Add it to your .env file.');
  }
  return value.replace(/\/+$/, '');
};
