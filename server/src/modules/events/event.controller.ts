import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as service from './event.service.js';

function memberId(request: Request) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  return request.auth.memberId;
}

export async function listMember(request: Request, response: Response) {
  const data = await service.listMemberEvents(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function getMember(request: Request, response: Response) {
  const data = await service.getMemberEvent(String(request.params.id));
  return response.status(200).json({ success: true, data });
}

export async function book(request: Request, response: Response) {
  const data = await service.createEventBooking(memberId(request), String(request.params.id), request.body);
  return response.status(201).json({ success: true, message: 'Event ticket booked successfully.', data });
}

export async function cancel(request: Request, response: Response) {
  const data = await service.cancelOwnEventBooking(memberId(request), String(request.params.id));
  return response.status(200).json({ success: true, message: 'Event ticket cancelled and seats restored.', data });
}

export async function adminList(request: Request, response: Response) {
  const data = await service.listAdminEvents(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function adminCreate(request: Request, response: Response) {
  const data = await service.createEvent(request.body);
  return response.status(201).json({ success: true, message: 'Event created.', data });
}

export async function adminUpdate(request: Request, response: Response) {
  const data = await service.updateEvent(String(request.params.id), request.body);
  return response.status(200).json({ success: true, message: 'Event updated.', data });
}

export async function adminBookings(request: Request, response: Response) {
  const data = await service.listAdminEventBookings(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function adminUpdateBookingStatus(request: Request, response: Response) {
  const data = await service.updateEventBookingStatus(String(request.params.id), request.body.status);
  return response.status(200).json({ success: true, message: 'Event booking status updated.', data });
}
