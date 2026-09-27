import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/environment';
import { User, UserRole } from '../modules/auth/auth.model';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../utils/asyncHandler';

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization ?? '';

  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication token is missing or invalid.', 401);
  }

  const token = authHeader.split(' ')[1];

  let decoded: JwtPayload & { id?: string };

  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { id?: string };
  } catch {
    throw new AppError('Invalid or expired token.', 401);
  }

  if (!decoded.id) {
    throw new AppError('Authentication token is invalid.', 401);
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw new AppError('User not found.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account is inactive.', 401);
  }

  const request = req as typeof req & { user?: typeof user };
  request.user = user;
  next();
});

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const request = req as typeof req & { user?: { role?: UserRole } };
    const user = request.user;

    if (!user || !user.role) {
      throw new AppError('Access denied. User role is missing.', 403);
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AppError('Access denied. You do not have permission to perform this action.', 403);
    }

    next();
  };
};
