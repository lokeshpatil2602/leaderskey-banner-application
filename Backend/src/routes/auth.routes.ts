import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import { registerUser, loginUser, sanitizeUser } from '../modules/auth/auth.service';

const router = Router();

router.use(authRateLimiter);


import { registerValidation, loginValidation, validate } from '../middleware/validation.middleware';

router.post(
  '/register',
  registerValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body ?? {};
    const result = await registerUser(name, email, password);

    sendSuccess(res, 'User registered successfully', {
      token: result.token,
      user: result.user
    }, 201);
  })
);

router.post(
  '/login',
  loginValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    const result = await loginUser(email, password);

    sendSuccess(res, 'Login successful', {
      token: result.token,
      user: result.user
    });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const request = req as typeof req & { user?: { _id?: string; name?: string; email?: string; role?: string; isActive?: boolean; createdAt?: Date; updatedAt?: Date } };
    const user = request.user;
    sendSuccess(res, 'Authenticated user loaded', sanitizeUser(user as any));
  })
);

export default router;
