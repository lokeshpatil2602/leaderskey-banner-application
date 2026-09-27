import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = (process.env.NODE_ENV ?? 'development').trim();
const isProd = nodeEnv === 'production';
const rawMongoUri = process.env.MONGODB_URI?.trim().replace(/^['"]|['"]$/g, '');
const rawJwtSecret = process.env.JWT_SECRET?.trim().replace(/^['"]|['"]$/g, '');

export const env = {
  HOST: (process.env.HOST ?? '0.0.0.0').trim(),
  PORT: Number(process.env.PORT ?? 5000),
  NODE_ENV: nodeEnv,
  MONGODB_URI: rawMongoUri || (isProd ? '' : 'mongodb://127.0.0.1:27017/banner_app'),
  JWT_SECRET: rawJwtSecret || (isProd ? '' : 'development_secret_change_me'),
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN ?? '7d').trim(),
  CLIENT_URL: (process.env.CLIENT_URL ?? '*').trim(),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^['"]|['"]$/g, ''),
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY?.trim().replace(/^['"]|['"]$/g, ''),
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET?.trim().replace(/^['"]|['"]$/g, '')
};

export const isProduction = env.NODE_ENV === 'production';

export const getAllowedOrigins = (): string[] => {
  if (env.CLIENT_URL === '*') {
    return ['*'];
  }
  return env.CLIENT_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const validateEnvironment = (): void => {
  const issues: string[] = [];

  if (!Number.isInteger(env.PORT) || env.PORT <= 0) {
    issues.push('PORT must be a valid integer greater than 0');
  }

  if (!env.NODE_ENV) {
    issues.push('NODE_ENV is required');
  }

  if (isProduction) {
    if (!env.JWT_SECRET) {
      issues.push('JWT_SECRET must be set in production environment variables');
    }
    if (!env.MONGODB_URI) {
      issues.push('MONGODB_URI is required in production (MongoDB Atlas connection string must be configured in Render Environment Variables)');
    } else if (env.MONGODB_URI.includes('localhost') || env.MONGODB_URI.includes('127.0.0.1')) {
      issues.push('MONGODB_URI in production must point to MongoDB Atlas, not localhost or 127.0.0.1');
    }
  }

  if (issues.length > 0) {
    throw new Error(`Invalid environment configuration: ${issues.join('; ')}`);
  }
};
