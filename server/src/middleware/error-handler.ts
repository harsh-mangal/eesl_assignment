import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';

export function notFound(request: Request, _response: Response, next: NextFunction) {
  next(new ApiError(404, `Route ${request.method} ${request.originalUrl} was not found.`));
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return response.status(413).json({ success: false, message: 'The selected image is too large.' });
    }
    return response.status(422).json({ success: false, message: `Upload failed: ${error.message}` });
  }

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof ZodError) {
    return response.status(422).json({
      success: false,
      message: 'Validation failed.',
      details: error.flatten(),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return response.status(409).json({
        success: false,
        message: 'A record with the same unique value already exists.',
        details: error.meta,
      });
    }
    if (error.code === 'P2025') {
      return response.status(404).json({ success: false, message: 'Record not found.' });
    }
  }

  console.error(error);
  return response.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
  });
}
