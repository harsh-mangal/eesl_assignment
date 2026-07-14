import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as service from './room.service.js';

function memberId(request: Request) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  return request.auth.memberId;
}

export async function availability(request: Request, response: Response) {
  const data = await service.listAvailableRooms(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function get(request: Request, response: Response) {
  const data = await service.getMemberRoom(String(request.params.id));
  return response.status(200).json({ success: true, data });
}

export async function createBooking(request: Request, response: Response) {
  const data = await service.createRoomBooking(memberId(request), request.body);
  return response.status(201).json({ success: true, message: 'Room booking confirmed.', data });
}

export async function cancelBooking(request: Request, response: Response) {
  const data = await service.cancelRoomBooking(memberId(request), String(request.params.id));
  return response.status(200).json({ success: true, message: 'Room booking cancelled.', data });
}

export async function adminList(request: Request, response: Response) {
  const data = await service.listAdminRooms(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function adminCreate(request: Request, response: Response) {
  const data = await service.createRoom(request.body);
  return response.status(201).json({ success: true, message: 'Room created.', data });
}

export async function adminUpdate(request: Request, response: Response) {
  const data = await service.updateRoom(String(request.params.id), request.body);
  return response.status(200).json({ success: true, message: 'Room updated.', data });
}

export async function adminBookings(request: Request, response: Response) {
  const data = await service.listAdminRoomBookings(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function adminUpdateBookingStatus(request: Request, response: Response) {
  const data = await service.updateRoomBookingStatus(String(request.params.id), request.body.status);
  return response.status(200).json({ success: true, message: 'Booking status updated.', data });
}
