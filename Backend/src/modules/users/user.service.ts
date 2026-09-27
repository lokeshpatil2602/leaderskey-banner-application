import mongoose from 'mongoose';
import { User, UserRole } from '../auth/auth.model';
import { AppError } from '../../utils/appError';
import { sanitizeUser } from '../auth/auth.service';
import { isValidRole } from '../../config/roles';

export const getAllUsers = async () => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  return users.map((user) => sanitizeUser(user));
};

export const getUserById = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid user ID.', 400);
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return sanitizeUser(user);
};

export const updateUserRole = async (id: string, currentUserId: string, nextRole: string) => {
  if (!isValidRole(nextRole)) {
    throw new AppError('Invalid role value.', 400);
  }

  if (id === currentUserId) {
    throw new AppError('You cannot change your own role.', 403);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.role = nextRole as UserRole;
  await user.save();

  return sanitizeUser(user);
};

export const updateUserStatus = async (id: string, isActive: boolean) => {
  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive must be a boolean value.', 400);
  }

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid user ID.', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.isActive = isActive;
  await user.save();

  return sanitizeUser(user);
};
