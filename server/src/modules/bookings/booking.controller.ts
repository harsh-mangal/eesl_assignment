import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import { listOwnBookings } from './booking.service.js';

export async function list(request: Request, response: Response) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  const data = await listOwnBookings(request.auth.memberId, request.query.status as never);
  return response.status(200).json({ success: true, data });
}
