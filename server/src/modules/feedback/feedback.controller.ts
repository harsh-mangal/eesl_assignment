import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as service from './feedback.service.js';

function memberId(request: Request) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  return request.auth.memberId;
}

export async function createOwn(request: Request, response: Response) {
  const data = await service.createOwnFeedback(memberId(request), request.body);
  return response.status(201).json({ success: true, message: 'Thank you for your feedback.', data });
}

export async function listOwn(request: Request, response: Response) {
  const data = await service.listOwnFeedback(memberId(request), request.query.serviceType as never);
  return response.status(200).json({ success: true, data });
}

export async function adminList(request: Request, response: Response) {
  const data = await service.listAdminFeedback(request.query as never);
  return response.status(200).json({ success: true, data });
}
