import { apiRequest } from '../client';

/**
 * Uploads an image file to the backend and returns the hosted URL.
 * Expects a local file URI from Expo ImagePicker.
 */
export const uploadImage = async (uri: string): Promise<{ url: string }> => {
  // Convert the local file URI to a Blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const formData = new FormData();
  const filename = uri.split('/').pop() || 'upload.jpg';
  formData.append('image', blob as any, filename);

  // Use apiRequest without JSON headers; multipart/form-data will be set automatically.
  const result = await apiRequest<{ url: string }>('/upload', {
    method: 'POST',
    body: formData,
    headers: {}
  });

  return result;
};
