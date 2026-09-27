import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  createBanner,
  deleteBanner,
  getBannerById,
  getUserBanners,
  updateBanner
} from '../modules/banners/banner.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All banner routes require authentication
router.use(requireAuth);

// GET /api/banners - Get current user's saved banners
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const request = req as typeof req & { user?: { _id?: string } };
    const userId = request.user?._id ? String(request.user._id) : '';
    if (!userId) {
      throw new AppError('User ID not found in session.', 401);
    }

    const banners = await getUserBanners(userId);
    sendSuccess(res, 'Banners loaded successfully', banners);
  })
);

// GET /api/banners/:id - Get single banner detail (owned by current user)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const request = req as typeof req & { user?: { _id?: string } };
    const userId = request.user?._id ? String(request.user._id) : '';
    const bannerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const banner = await getBannerById(bannerId, userId);
    sendSuccess(res, 'Banner loaded successfully', banner);
  })
);

// POST /api/banners - Create a new customized banner
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const request = req as typeof req & { user?: { _id?: string } };
    const userId = request.user?._id ? String(request.user._id) : '';
    const { title, templateId, canvas, background, elements, fields, mainText, secondaryText } =
      req.body ?? {};

    const banner = await createBanner({
      userId,
      templateId,
      title,
      canvas,
      background,
      elements,
      fields,
      mainText,
      secondaryText
    });

    sendSuccess(res, 'Banner saved successfully', banner, 201);
  })
);

// PUT /api/banners/:id - Update an existing banner
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const request = req as typeof req & { user?: { _id?: string } };
    const userId = request.user?._id ? String(request.user._id) : '';
    const bannerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, canvas, background, elements, fields, mainText, secondaryText } =
      req.body ?? {};

    const updated = await updateBanner(bannerId, userId, {
      title,
      canvas,
      background,
      elements,
      fields,
      mainText,
      secondaryText
    });

    sendSuccess(res, 'Banner updated successfully', updated);
  })
);

// PATCH /api/banners/:id - Partial update of a banner
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const request = req as typeof req & { user?: { _id?: string } };
    const userId = request.user?._id ? String(request.user._id) : '';
    const bannerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, canvas, background, elements, fields, mainText, secondaryText } =
      req.body ?? {};

    const updated = await updateBanner(bannerId, userId, {
      title,
      canvas,
      background,
      elements,
      fields,
      mainText,
      secondaryText
    });

    sendSuccess(res, 'Banner updated successfully', updated);
  })
);

// DELETE /api/banners/:id - Delete a user's banner
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const request = req as typeof req & { user?: { _id?: string } };
    const userId = request.user?._id ? String(request.user._id) : '';
    const bannerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const deleted = await deleteBanner(bannerId, userId);
    sendSuccess(res, 'Banner deleted successfully', deleted);
  })
);

export default router;
