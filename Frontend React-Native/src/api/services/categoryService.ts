import { apiRequest } from '../client';
import { getAuthToken } from '../../utils/tokenStorage';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryServiceResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  environment: string;
};

export const getCategories = async (): Promise<Category[]> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<CategoryServiceResponse<Category[]>>('/categories', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const getCategoryById = async (id: string): Promise<Category> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<CategoryServiceResponse<Category>>(`/categories/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  icon?: string;
}): Promise<Category> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<CategoryServiceResponse<Category>>('/categories', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  return response.data;
};

export const updateCategory = async (
  id: string,
  data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Category> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<CategoryServiceResponse<Category>>(`/categories/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  return response.data;
};

export const deleteCategory = async (id: string): Promise<Category> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<CategoryServiceResponse<Category>>(`/categories/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};
