import { getApiBaseUrl } from '../../config/env';

export type ApiResponse<T> = T;

export const apiRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutMs = 10000;

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: (() => {
        const isFormData = options.body instanceof FormData;
        const defaultHeaders: Record<string, string> = {
          Accept: 'application/json',
          ...(isFormData ? {} : { 'Content-Type': 'application/json' })
        };
        return { ...defaultHeaders, ...(options.headers as Record<string, string> || {}) };
      })()
    });

    if (!response.ok) {
      const errorText = await response.text();
      let extractedMessage = '';
      try {
        const parsed = JSON.parse(errorText);
        if (parsed && typeof parsed.message === 'string') {
          extractedMessage = parsed.message;
        }
      } catch {
        // Not JSON
      }

      throw new Error(extractedMessage || errorText || `Request failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Unexpected response format from the backend.');
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out while contacting the backend.');
    }

    if (error instanceof Error && error.message.includes('EXPO_PUBLIC_API_URL')) {
      throw new Error('API base URL is not configured. Add EXPO_PUBLIC_API_URL to your .env file.');
    }

    throw error instanceof Error ? error : new Error('Request failed');
  } finally {
    clearTimeout(timeoutId);
  }
};
