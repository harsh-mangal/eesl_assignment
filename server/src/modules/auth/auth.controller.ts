import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as authService from './auth.service.js';

export async function login(request: Request, response: Response) {
  const result = await authService.login(request.body.identifier, request.body.password);
  return response.status(200).json({ success: true, data: result });
}

export async function me(request: Request, response: Response) {
  if (!request.auth) throw new ApiError(401, 'Authentication is required.');
  const user = await authService.getCurrentUser(request.auth.userId);
  return response.status(200).json({ success: true, data: user });
}

export async function logout(_request: Request, response: Response) {
  return response.status(200).json({
    success: true,
    message: 'Logged out successfully. Remove the stored access token on the client.',
  });
}
