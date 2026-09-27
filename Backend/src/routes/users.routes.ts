import { Router } from 'express';
import { AppError } from '../utils/appError';
import { authorize, requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { getAllUsers, getUserById, updateUserRole, updateUserStatus } from '../modules/users/user.service';
import { isValidRole } from '../config/roles';

const router = Router();

router.get(
  '/',
  requireAuth,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (_req, res) => {
    const users = await getAllUsers();
    sendSuccess(res, 'Users loaded successfully', users);
  })
);

router.get(
  '/:id',
  requireAuth,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await getUserById(userId);
    sendSuccess(res, 'User loaded successfully', user);
  })
);

router.patch(
  '/:id/role',
  requireAuth,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { role } = req.body ?? {};
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!isValidRole(role)) {
      throw new AppError('Invalid role value.', 400);
    }

    const request = req as typeof req & { user?: { _id?: string } };
    const currentUserId = request.user?._id ? String(request.user._id) : '';
    const updatedUser = await updateUserRole(userId, currentUserId, role);
    sendSuccess(res, 'User role updated successfully', updatedUser);
  })
);

router.patch(
  '/:id/status',
  requireAuth,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body ?? {};
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean value.', 400);
    }

    const updatedUser = await updateUserStatus(userId, isActive);
    sendSuccess(res, 'User status updated successfully', updatedUser);
  })
);

export default router;
