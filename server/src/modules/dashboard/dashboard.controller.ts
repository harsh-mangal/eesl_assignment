import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as dashboardService from './dashboard.service.js';

export async function memberDashboard(request: Request, response: Response) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  const data = await dashboardService.getMemberDashboard(request.auth.memberId);
  return response.status(200).json({ success: true, data });
}

export async function adminDashboard(_request: Request, response: Response) {
  const data = await dashboardService.getAdminDashboard();
  return response.status(200).json({ success: true, data });
}
