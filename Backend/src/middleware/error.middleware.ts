import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  sendError(res, `Route not found: ${req.originalUrl}`, 404, {});
};

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  let statusCode = error instanceof AppError ? error.statusCode : res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  if ((error as any).name === 'MulterError') {
    statusCode = (error as any).code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  }

  // Log server-side for internal/unhandled errors
  if (statusCode >= 500) {
    logger.error(`[ErrorHandler] ${error.message}`, { stack: error.stack });
  }

  // Sanitize message: only expose custom AppError messages or default safe messages
  let safeMessage = error.message || 'Internal server error';
  if (statusCode >= 500 && !(error instanceof AppError)) {
    safeMessage = 'Internal server error';
  }

  // Do NOT expose stack traces, filesystem paths, or provider details in responses
  sendError(res, safeMessage, statusCode, {});
};
