import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as service from './payment.service.js';

export async function adminList(request: Request, response: Response) {
  const data = await service.listAdminPayments(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function ownList(request: Request, response: Response) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  const data = await service.listOwnPayments(request.auth.memberId, Number(request.query.page), Number(request.query.limit));
  return response.status(200).json({ success: true, data });
}
