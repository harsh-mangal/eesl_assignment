import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import * as service from './restaurant.service.js';

function memberId(request: Request) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  return request.auth.memberId;
}

export async function listMember(request: Request, response: Response) {
  const data = await service.listMemberRestaurants(request.query.date as string);
  return response.status(200).json({ success: true, data });
}

export async function getMember(request: Request, response: Response) {
  const data = await service.getMemberRestaurant(String(request.params.id), request.query.date as string);
  return response.status(200).json({ success: true, data });
}

export async function createBooking(request: Request, response: Response) {
  const data = await service.createRestaurantBooking(memberId(request), request.body);
  return response.status(201).json({ success: true, message: 'Restaurant reservation confirmed.', data });
}

export async function cancelBooking(request: Request, response: Response) {
  const data = await service.cancelRestaurantBooking(memberId(request), String(request.params.id));
  return response.status(200).json({ success: true, message: 'Restaurant reservation cancelled.', data });
}

export async function adminList(request: Request, response: Response) {
  const data = await service.listAdminRestaurants(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function adminCreate(request: Request, response: Response) {
  const data = await service.createRestaurant(request.body);
  return response.status(201).json({ success: true, message: 'Restaurant created.', data });
}

export async function adminUpdate(request: Request, response: Response) {
  const data = await service.updateRestaurant(String(request.params.id), request.body);
  return response.status(200).json({ success: true, message: 'Restaurant updated.', data });
}

export async function adminCreateSlot(request: Request, response: Response) {
  const data = await service.createRestaurantSlot(String(request.params.id), request.body);
  return response.status(201).json({ success: true, message: 'Restaurant slot created.', data });
}

export async function adminUpdateSlot(request: Request, response: Response) {
  const data = await service.updateRestaurantSlot(String(request.params.id), request.body);
  return response.status(200).json({ success: true, message: 'Restaurant slot updated.', data });
}

export async function adminBookings(request: Request, response: Response) {
  const data = await service.listAdminRestaurantBookings(request.query as never);
  return response.status(200).json({ success: true, data });
}

export async function adminUpdateBookingStatus(request: Request, response: Response) {
  const data = await service.updateRestaurantBookingStatus(String(request.params.id), request.body.status);
  return response.status(200).json({ success: true, message: 'Booking status updated.', data });
}
