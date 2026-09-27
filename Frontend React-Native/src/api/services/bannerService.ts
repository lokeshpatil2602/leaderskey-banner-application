import { apiRequest } from '../client';
import { getAuthToken } from '../../utils/tokenStorage';
import {
  BannerBackground,
  BannerCanvas,
  BannerElement,
  EditableField,
  TemplateSocialContent
} from './templateService';

export type PopulatedTemplate = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  canvas: BannerCanvas;
  background: BannerBackground;
  elements: BannerElement[];
  socialContent?: TemplateSocialContent;
  editableFields?: EditableField[];
  isActive: boolean;
};

export type BannerFieldStyle = {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  alignment?: 'left' | 'center' | 'right';
  borderRadius?: number;
  opacity?: number;
};

export type BannerField = {
  fieldId: string;
  label: string;
  value: string;
  style: {
    fontFamily: string;
    fontSize: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
  };
  position?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
};

export type Banner = {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  canvas: BannerCanvas;
  background: BannerBackground;
  elements: BannerElement[];
  template?: PopulatedTemplate;
  fields?: BannerField[];
  mainText?: string;
  secondaryText?: string;
  createdAt: string;
  updatedAt: string;
};

export type BannerServiceResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  environment: string;
};

export const getBanners = async (): Promise<Banner[]> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<BannerServiceResponse<Banner[]>>('/banners', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const getBannerById = async (id: string): Promise<Banner> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<BannerServiceResponse<Banner>>(`/banners/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const createBanner = async (data: {
  templateId: string;
  title?: string;
  canvas?: BannerCanvas;
  background?: BannerBackground;
  elements?: BannerElement[];
  fields?: BannerField[];
  mainText?: string;
  secondaryText?: string;
}): Promise<Banner> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<BannerServiceResponse<Banner>>('/banners', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  return response.data;
};

export const updateBanner = async (
  id: string,
  data: {
    title?: string;
    canvas?: BannerCanvas;
    background?: BannerBackground;
    elements?: BannerElement[];
    fields?: BannerField[];
    mainText?: string;
    secondaryText?: string;
  }
): Promise<Banner> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<BannerServiceResponse<Banner>>(`/banners/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  return response.data;
};

export const deleteBanner = async (id: string): Promise<Banner> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<BannerServiceResponse<Banner>>(`/banners/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

