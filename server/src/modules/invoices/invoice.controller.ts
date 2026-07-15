import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as service from './invoice.service.js';

function memberId(request: Request) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  return request.auth.memberId;
}

export async function ownList(request: Request, response: Response) {
  const data = await service.listOwnInvoices(memberId(request), request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function ownGet(request: Request, response: Response) {
  const data = await service.getOwnInvoice(memberId(request), String(request.params.id));
  return response.status(200).json({ success: true, data });
}

export async function ownPay(request: Request, response: Response) {
  const data = await service.payOwnInvoice(memberId(request), String(request.params.id), request.body);
  return response.status(200).json({ success: true, message: 'Invoice paid successfully.', data });
}

export async function adminList(request: Request, response: Response) {
  const data = await service.listAdminInvoices(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function adminGet(request: Request, response: Response) {
  const data = await service.getAdminInvoice(String(request.params.id));
  return response.status(200).json({ success: true, data });
}

export async function adminCreate(request: Request, response: Response) {
  const data = await service.createInvoice(request.body);
  return response.status(201).json({ success: true, message: 'Invoice created.', data });
}

export async function adminUpdate(request: Request, response: Response) {
  const data = await service.updateInvoice(String(request.params.id), request.body);
  return response.status(200).json({ success: true, message: 'Invoice updated.', data });
}

export async function adminCancel(request: Request, response: Response) {
  const data = await service.cancelInvoice(String(request.params.id));
  return response.status(200).json({ success: true, message: 'Invoice cancelled.', data });
}
