import { Router } from 'express';
import { getDatabaseStatus } from '../config/database';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// General health check
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const database = getDatabaseStatus();
    sendSuccess(res, 'Healthy', {
      server: 'running',
      api: 'healthy',
      environment: process.env.NODE_ENV ?? 'development',
      database,
    });
  })
);

// Liveness probe – does not depend on DB or other services
router.get(
  '/live',
  (_req, res) => {
    sendSuccess(res, 'Live', { status: 'up' });
  }
);

// Readiness probe – checks DB connectivity and required config
router.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    const database = getDatabaseStatus();
    // The environment validation will throw if required vars are missing in production
    // It is safe to call here for readiness checks
    // (imported lazily to avoid circular deps)
    const { validateEnvironment } = await import('../config/environment');
    try {
      validateEnvironment();
    } catch (err) {
      return sendSuccess(res, 'Not ready', { error: err instanceof Error ? err.message : err }, 500);
    }
    sendSuccess(res, 'Ready', {
      server: 'running',
      api: 'healthy',
      environment: process.env.NODE_ENV ?? 'development',
      database,
    });
  })
);

export default router;
