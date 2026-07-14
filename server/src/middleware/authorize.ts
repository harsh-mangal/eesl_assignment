import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api-error.js';

export const authorize = (...roles: Role[]) => {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      return next(new ApiError(403, 'You are not allowed to perform this action.'));
    }
    return next();
  };
};
