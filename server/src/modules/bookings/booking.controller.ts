import type { BookingStatus } from '@prisma/client';
import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import {
  getOwnBookingDetail,
  listAdminBookings,
  listOwnBookings,
  updateAdminBookingStatus,
  type BookingType,
} from './booking.service.js';

export async function list(request: Request, response: Response) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  const data = await listOwnBookings(request.auth.memberId, request.query.status as BookingStatus | undefined);
  return response.status(200).json({ success: true, data });
}

export async function detail(request: Request, response: Response) {
  if (!request.auth?.memberId) throw new ApiError(403, 'Member account is required.');
  const data = await getOwnBookingDetail(
    request.auth.memberId,
    request.params.type as BookingType,
    String(request.params.id),
  );
  return response.status(200).json({ success: true, data });
}

export async function adminList(request: Request, response: Response) {
  const data = await listAdminBookings({
    search: request.query.search as string | undefined,
    type: request.query.type as BookingType | undefined,
    status: request.query.status as BookingStatus | undefined,
    page: Number(request.query.page),
    limit: Number(request.query.limit),
  });
  return response.status(200).json({ success: true, data });
}

export async function adminUpdateStatus(request: Request, response: Response) {
  const data = await updateAdminBookingStatus(
    request.params.type as BookingType,
    String(request.params.id),
    request.body.status as BookingStatus,
  );
  return response.status(200).json({ success: true, message: 'Booking status updated.', data });
}
