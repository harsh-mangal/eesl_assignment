import { AccountStatus } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { verifyAccessToken } from '../utils/jwt.js';

export async function authenticate(request: Request, _response: Response, next: NextFunction) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token is required.');
    }

    const payload = verifyAccessToken(authorization.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new ApiError(401, 'Your session is invalid or the account is disabled.');
    }

    request.auth = {
      userId: user.id,
      role: user.role,
      memberId: user.memberId ?? undefined,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, 'Invalid or expired authentication token.'));
  }
}
