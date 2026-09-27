import { apiRequest } from '../client';
import { getAuthToken } from '../../utils/tokenStorage';

export type AuthUserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthUserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type AuthApiResponse = {
  success: boolean;
  message: string;
  data: AuthResponse;
  timestamp: string;
  environment: string;
};

export const registerUser = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await apiRequest<AuthApiResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });

  return response.data;
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiRequest<AuthApiResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  return response.data;
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<{ success: boolean; message: string; data: AuthUser; timestamp: string; environment: string }>(
    '/auth/me',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};
