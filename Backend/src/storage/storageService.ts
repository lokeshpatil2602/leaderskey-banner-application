// src/storage/storageService.ts
export interface UploadedFileInfo {
  url: string;
  publicId?: string;
  format?: string;
  size?: number;
  mimeType?: string;
}
export interface StorageService {
  upload(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadedFileInfo>;
  delete(publicId: string): Promise<void>;
}
