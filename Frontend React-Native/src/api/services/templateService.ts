import { apiRequest } from '../client';
import { getAuthToken } from '../../utils/tokenStorage';

export type BannerSizePreset = 'Square' | 'Portrait' | 'Story' | 'Landscape' | 'Custom';
export type BannerElementType = 'text' | 'image' | 'logo' | 'symbol';
export type SocialPlatform = 'facebook' | 'instagram' | 'x' | 'threads';

export type PlatformSocialContent = {
  caption?: string;
  hashtags?: string[];
  extraFields?: Record<string, any>;
};

export type TemplateSocialContent = {
  facebook?: PlatformSocialContent;
  instagram?: PlatformSocialContent;
  x?: PlatformSocialContent;
  threads?: PlatformSocialContent;
};

export type BannerElementStyle = {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  alignment?: 'left' | 'center' | 'right';
  borderRadius?: number;
  opacity?: number;
};

export type BannerElement = {
  id: string;
  type: BannerElementType;
  label: string;
  content?: string;
  source?: string;
  position: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
  size: {
    width: number; // percentage 0-100
    height?: number; // percentage or auto
  };
  style?: BannerElementStyle;
  required?: boolean;
  editable?: boolean;
  movable?: boolean;
  resizable?: boolean;
  locked?: boolean;
  zIndex: number;
  visible?: boolean;
};

export type BannerCanvas = {
  width: number;
  height: number;
  sizePreset: BannerSizePreset | string;
};

export type BannerBackground = {
  type: 'image' | 'color';
  source?: string;
  color?: string;
};

export type EditableField = {
  id: string;
  label: string;
  type?: string;
  required: boolean;
  movable?: boolean;
  defaultStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    alignment?: 'left' | 'center' | 'right';
  };
  defaultPosition?: {
    x: number;
    y: number;
  };
};

export type Template = {
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
  createdAt: string;
  updatedAt: string;
};

export type TemplateServiceResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  environment: string;
};

export const getTemplates = async (category?: string, size?: string): Promise<Template[]> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const queryParams = new URLSearchParams();
  if (category && category !== 'All') {
    queryParams.append('category', category);
  }
  if (size && size !== 'All') {
    queryParams.append('size', size);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const response = await apiRequest<TemplateServiceResponse<Template[]>>(`/templates${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const getTemplateById = async (id: string): Promise<Template> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<TemplateServiceResponse<Template>>(`/templates/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const createTemplate = async (data: {
  title: string;
  category: string;
  imageUrl: string;
  canvas?: BannerCanvas;
  background?: BannerBackground;
  elements?: BannerElement[];
  socialContent?: TemplateSocialContent;
  isActive?: boolean;
  editableFields?: EditableField[];
}): Promise<Template> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<TemplateServiceResponse<Template>>('/templates', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  return response.data;
};

export const updateTemplate = async (
  id: string,
  data: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Template> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<TemplateServiceResponse<Template>>(`/templates/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  return response.data;
};

export const deleteTemplate = async (id: string): Promise<Template> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await apiRequest<TemplateServiceResponse<Template>>(`/templates/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};
