import { Router } from 'express';
import { authorize, requireAuth } from '../middleware/auth.middleware';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory
} from '../modules/categories/category.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  requireAuth,
  authorize('USER', 'ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (_req, res) => {
    const categories = await getAllCategories();
    sendSuccess(res, 'Categories loaded successfully', categories);
  })
);

router.get(
  '/:id',
  requireAuth,
  authorize('USER', 'ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const category = await getCategoryById(categoryId);
    sendSuccess(res, 'Category loaded successfully', category);
  })
);

router.post(
  '/',
  requireAuth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { name, description, icon } = req.body ?? {};
    const created = await createCategory({
      name,
      description,
      icon
    });
    sendSuccess(res, 'Category created successfully', created, 201);
  })
);

router.put(
  '/:id',
  requireAuth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, description, icon } = req.body ?? {};
    const updated = await updateCategory(categoryId, {
      name,
      description,
      icon
    });
    sendSuccess(res, 'Category updated successfully', updated);
  })
);

router.delete(
  '/:id',
  requireAuth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await deleteCategory(categoryId);
    sendSuccess(res, 'Category deleted successfully', deleted);
  })
);

export default router;
