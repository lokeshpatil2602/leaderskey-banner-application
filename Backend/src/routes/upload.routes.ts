import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import multer from 'multer';

import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../utils/asyncHandler';
import { CloudinaryStorage } from '../storage/cloudinaryStorage';

const router = Router();
router.use(requireAuth);

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

// Use multer memory storage to buffer files before uploading to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Unsupported file type. Only JPEG, PNG, and WebP are allowed.', 400));
    }
  }
});

const cloudinaryStorage = new CloudinaryStorage();

import { logger } from '../utils/logger';

// POST /api/upload - upload a single image file
router.post(
  '/',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded.', 400);
    }
    const file = req.file;
    try {
      const uploaded = await cloudinaryStorage.upload(file.buffer, file.originalname, file.mimetype);
      const url = uploaded.url;
      sendSuccess(res, 'Image uploaded successfully', { url });
    } catch (error: any) {
      logger.error(`[Upload] Cloudinary storage failure: ${error?.message || error}`, {
        error: error?.message || error,
        stack: error?.stack,
      });
      throw new AppError('Image upload service is temporarily unavailable.', 503);
    }
  })
);

export default router;
