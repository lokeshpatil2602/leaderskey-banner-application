// src/storage/cloudinaryStorage.ts
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { UploadedFileInfo, StorageService } from './storageService';

// Validate required environment variables at load time
const requiredEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`[Storage] Missing Cloudinary env var ${key}. Uploads will fail until configured.`);
  }
}

import { env } from '../config/environment';

export class CloudinaryStorage implements StorageService {
  private configureCloudinary(): void {
    const cloud_name = env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const api_key = env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY?.trim();
    const api_secret = env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloud_name || !api_key || !api_secret) {
      throw new Error('Cloudinary configuration is missing');
    }

    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadedFileInfo> {
    this.configureCloudinary();

    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'banner-app';
    const publicId = `${Date.now()}_${originalName.replace(/\.[^/.]+$/, '')}`;
    let format = mimeType ? mimeType.split('/')[1] : undefined;
    if (format === 'jpeg') format = 'jpg';

    return new Promise<UploadedFileInfo>((resolve, reject) => {
      const uploadOptions: Record<string, any> = {
        folder,
        resource_type: 'image',
        public_id: publicId,
      };
      if (format) {
        uploadOptions.format = format;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload failed'));
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            mimeType,
          });
        },
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  async delete(publicId: string): Promise<void> {
    this.configureCloudinary();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }
}
