import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// Custom error classes
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', details?: any) {
    super(400, message, true, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation Error', details?: any) {
    super(422, message, true, details);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Too Many Requests') {
    super(429, message, false);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error') {
    super(500, message, false);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default to 500 (Internal Server Error)
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details;
  let isOperational = false;

  // Handle known error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
    isOperational = err.isOperational;
  } 
  // Handle Mongoose validation errors
  else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    isOperational = true;
  } 
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle known Prisma errors
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        details = { target: err.meta?.target };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        break;
      default:
        message = 'Database Error';
        details = { code: err.code, meta: err.meta };
    }
    isOperational = true;
  } 
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
      error: err.stack,
      body: req.body,
      query: req.query,
      params: req.params,
      user: (req as any).user?._id,
    });
  } else if (!isOperational) {
    logger.warn(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }

  // Don't leak error details in production for non-operational errors
  if (!isOperational && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong';
    details = undefined;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};

// 404 Not Found middleware
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
    timestamp: new Date().toISOString(),
  });
};
