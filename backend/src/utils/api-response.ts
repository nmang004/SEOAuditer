import { Response } from 'express';
import { logger } from './logger';

/**
 * Standard API response format
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  message?: string;
}

/**
 * Success response helper
 */
export const successResponse = <T = any>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: any
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = { success: true, data };
  
  if (meta) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Error response helper
 */
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errorCode: string = 'BAD_REQUEST',
  details?: any
): Response<ApiResponse> => {
  logger.error(`API Error [${statusCode}]: ${message}`, { errorCode, details });
  
  const response: ApiResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
    },
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Not found response helper
 */
export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found',
  errorCode: string = 'NOT_FOUND'
): Response<ApiResponse> => {
  return errorResponse(res, message, 404, errorCode);
};

/**
 * Unauthorized response helper
 */
export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized',
  errorCode: string = 'UNAUTHORIZED'
): Response<ApiResponse> => {
  return errorResponse(res, message, 401, errorCode);
};

/**
 * Forbidden response helper
 */
export const forbiddenResponse = (
  res: Response,
  message: string = 'Forbidden',
  errorCode: string = 'FORBIDDEN'
): Response<ApiResponse> => {
  return errorResponse(res, message, 403, errorCode);
};

/**
 * Validation error response helper
 */
export const validationErrorResponse = (
  res: Response,
  message: string = 'Validation failed',
  details: any = {},
  errorCode: string = 'VALIDATION_ERROR'
): Response<ApiResponse> => {
  return errorResponse(res, message, 422, errorCode, details);
};

/**
 * Internal server error response helper
 */
export const serverErrorResponse = (
  res: Response,
  message: string = 'Internal server error',
  errorCode: string = 'INTERNAL_SERVER_ERROR',
  error?: any
): Response<ApiResponse> => {
  // Log the full error for debugging
  logger.error('Server Error:', error);
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return errorResponse(res, 'Something went wrong', 500, 'INTERNAL_SERVER_ERROR');
  }
  
  return errorResponse(res, message, 500, errorCode, error?.message);
};

/**
 * Pagination helper
 */
export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number
) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Async handler wrapper for controllers
 * Handles errors and ensures consistent response format
 */
export const asyncHandler = <P, ResBody, ReqBody, ReqQuery>(
  handler: (
    ...args: Parameters<import('express').RequestHandler<P, ResBody, ReqBody, ReqQuery>>
  ) => Promise<void> | void
) => {
  return async (
    req: import('express').Request<P, ResBody, ReqBody, ReqQuery>,
    res: import('express').Response,
    next: import('express').NextFunction
  ) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
