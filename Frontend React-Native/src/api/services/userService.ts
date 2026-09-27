import { apiRequest } from '../client';
import { getAuthToken } from '../../utils/tokenStorage';
import { AuthUser, AuthUserRole } from './authService';

export type UserServiceResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  environment: string;
};

export const getUsers = async (): Promise<AuthUser[]> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<UserServiceResponse<AuthUser[]>>('/users', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const updateUserRole = async (userId: string, role: AuthUserRole): Promise<AuthUser> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<UserServiceResponse<AuthUser>>(`/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ role })
  });

  return response.data;
};

export const updateUserStatus = async (userId: string, isActive: boolean): Promise<AuthUser> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<UserServiceResponse<AuthUser>>(`/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ isActive })
  });

  return response.data;
};
