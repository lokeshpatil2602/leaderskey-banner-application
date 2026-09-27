import { Response } from 'express';

export type ApiResponsePayload<T> = {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  environment: string;
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): Response<ApiResponsePayload<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development'
  });
};

export const sendError = <T>(
  res: Response,
  message: string,
  statusCode = 500,
  data?: T
): Response<ApiResponsePayload<T>> => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development'
  });
};
