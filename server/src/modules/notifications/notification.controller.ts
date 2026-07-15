import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as service from './notification.service.js';

function memberId(request: Request) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  return request.auth.memberId;
}

export async function ownList(request: Request, response: Response) {
  const data = await service.listOwnNotifications(memberId(request), request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function ownGet(request: Request, response: Response) {
  const data = await service.getOwnNotification(memberId(request), String(request.params.id));
  return response.status(200).json({ success: true, data });
}

export async function ownMarkRead(request: Request, response: Response) {
  const data = await service.markOwnNotificationRead(memberId(request), String(request.params.id));
  return response.status(200).json({ success: true, message: 'Notification marked as read.', data });
}

export async function ownMarkAllRead(request: Request, response: Response) {
  const data = await service.markAllOwnNotificationsRead(memberId(request));
  return response.status(200).json({ success: true, message: 'All notifications marked as read.', data });
}

export async function ownUnreadCount(request: Request, response: Response) {
  const data = await service.getOwnUnreadCount(memberId(request));
  return response.status(200).json({ success: true, data });
}

export async function adminList(request: Request, response: Response) {
  const data = await service.listAdminNotifications(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function adminGet(request: Request, response: Response) {
  const data = await service.getAdminNotification(String(request.params.id));
  return response.status(200).json({ success: true, data });
}

export async function adminCreate(request: Request, response: Response) {
  const data = await service.createNotification(request.body);
  return response.status(201).json({ success: true, message: 'Notification created.', data });
}
