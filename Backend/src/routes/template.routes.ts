import { Router } from 'express';
import { authorize, requireAuth } from '../middleware/auth.middleware';
import {
  createTemplate,
  deleteTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate
} from '../modules/templates/template.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /api/templates - View active templates (or all for admins), supports ?category=... and ?size=...
router.get(
  '/',
  requireAuth,
  authorize('USER', 'ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const size = typeof req.query.size === 'string' ? req.query.size : undefined;
    const request = req as typeof req & { user?: { role?: string } };
    const includeInactive = request.user?.role === 'ADMIN' || request.user?.role === 'SUPER_ADMIN';
    const templates = await getAllTemplates(category, size, includeInactive);
    sendSuccess(res, 'Templates loaded successfully', templates);
  })
);

// GET /api/templates/:id - View single template
router.get(
  '/:id',
  requireAuth,
  authorize('USER', 'ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const template = await getTemplateById(templateId);
    sendSuccess(res, 'Template loaded successfully', template);
  })
);

// POST /api/templates - Create template (Admin & Super Admin only)
router.post(
  '/',
  requireAuth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const {
      title,
      category,
      imageUrl,
      canvas,
      background,
      elements,
      socialContent,
      isActive,
      editableFields
    } = req.body ?? {};
    const created = await createTemplate({
      title,
      category,
      imageUrl,
      canvas,
      background,
      elements,
      socialContent,
      isActive,
      editableFields
    });
    sendSuccess(res, 'Template created successfully', created, 201);
  })
);

// PUT /api/templates/:id - Update template (Admin & Super Admin only)
router.put(
  '/:id',
  requireAuth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const {
      title,
      category,
      imageUrl,
      canvas,
      background,
      elements,
      socialContent,
      isActive,
      editableFields
    } = req.body ?? {};
    const updated = await updateTemplate(templateId, {
      title,
      category,
      imageUrl,
      canvas,
      background,
      elements,
      socialContent,
      isActive,
      editableFields
    });
    sendSuccess(res, 'Template updated successfully', updated);
  })
);

// DELETE /api/templates/:id - Delete template (Admin & Super Admin only)
router.delete(
  '/:id',
  requireAuth,
  authorize('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await deleteTemplate(templateId);
    sendSuccess(res, 'Template deleted successfully', deleted);
  })
);

export default router;
