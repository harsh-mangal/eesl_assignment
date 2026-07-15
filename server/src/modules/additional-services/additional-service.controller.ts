import type { Request, Response } from 'express';
import type { AdditionalServiceType } from '@prisma/client';
import { ApiError } from '../../utils/api-error.js';
import * as service from './additional-service.service.js';

function memberId(request: Request) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  return request.auth.memberId;
}

export async function listOwn(request: Request, response: Response) {
  const data = await service.listOwnAdditionalServices(memberId(request));
  return response.status(200).json({ success: true, data });
}

export async function getOwn(request: Request, response: Response) {
  const data = await service.getOwnAdditionalService(
    memberId(request),
    request.params.serviceType as AdditionalServiceType,
  );
  return response.status(200).json({ success: true, data });
}
