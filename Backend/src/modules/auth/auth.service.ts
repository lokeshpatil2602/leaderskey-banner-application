import jwt from 'jsonwebtoken';
import { env } from '../../config/environment';
import { AppError } from '../../utils/appError';
import { User, IUser } from './auth.model';

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const sanitizeUser = (user: IUser): SafeUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString()
});

export const generateToken = (user: IUser): string => {
  const secret = env.JWT_SECRET as string;
  const expiresIn = env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'];

  return jwt.sign({ id: user._id, email: user.email, role: user.role }, secret, {
    expiresIn
  });
};

export const registerUser = async (name: string, email: string, password: string): Promise<{ user: SafeUser; token: string }> => {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName || normalizedName.length < 2) {
    throw new AppError('Name is required and must be at least 2 characters long.', 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password
  });

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token
  };
};

export const loginUser = async (email: string, password: string): Promise<{ user: SafeUser; token: string }> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account is inactive.', 401);
  }

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token
  };
};

export const forgotPassword = async (email: string): Promise<{ resetToken?: string; message: string }> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return {
      message: 'If an account exists with this email, password reset instructions have been provided.'
    };
  }

  const crypto = require('crypto');
  const rawToken = crypto.randomBytes(20).toString('hex');
  const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validity

  user.resetPasswordToken = rawToken;
  user.resetPasswordExpires = tokenExpires;
  await user.save();

  return {
    resetToken: rawToken,
    message: 'Password reset token generated successfully. Valid for 30 minutes.'
  };
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const normalizedToken = (token || '').trim();

  if (!normalizedToken) {
    throw new AppError('Invalid or missing password reset token.', 400);
  }

  if (!newPassword || newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long.', 400);
  }

  const user = await User.findOne({
    resetPasswordToken: normalizedToken,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError('Password reset token is invalid or has expired.', 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return {
    message: 'Password has been reset successfully. You can now login with your new password.'
  };
};

