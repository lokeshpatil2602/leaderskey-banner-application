import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'banner_app_auth_token';
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

export const saveAuthToken = async (token: string): Promise<void> => {
  if (isWeb) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
};

export const removeAuthToken = async (): Promise<void> => {
  if (isWeb) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
};
