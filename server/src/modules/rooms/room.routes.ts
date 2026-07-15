import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { imageUpload } from '../uploads/upload.middleware.js';
import * as uploadController from '../uploads/upload.controller.js';
import * as controller from './room.controller.js';
import {
  adminListRoomsSchema,
  adminRoomBookingsSchema,
  createRoomBookingSchema,
  createRoomSchema,
  roomAvailabilitySchema,
  roomIdSchema,
  updateRoomBookingStatusSchema,
  updateRoomSchema,
} from './room.validation.js';

export const roomRouter = Router();
export const adminRoomRouter = Router();

roomRouter.use(authenticate, authorize(Role.MEMBER));
roomRouter.get('/availability', validate(roomAvailabilitySchema), asyncHandler(controller.availability));
roomRouter.get('/:id', validate(roomIdSchema), asyncHandler(controller.get));
roomRouter.post('/bookings/create', validate(createRoomBookingSchema), asyncHandler(controller.createBooking));
roomRouter.patch('/bookings/:id/cancel', validate(roomIdSchema), asyncHandler(controller.cancelBooking));

adminRoomRouter.use(authenticate, authorize(Role.ADMIN));
adminRoomRouter.get('/', validate(adminListRoomsSchema), asyncHandler(controller.adminList));
adminRoomRouter.post('/', validate(createRoomSchema), asyncHandler(controller.adminCreate));
adminRoomRouter.patch('/:id', validate(updateRoomSchema), asyncHandler(controller.adminUpdate));
adminRoomRouter.post('/:id/image', imageUpload, validate(roomIdSchema), asyncHandler(uploadController.roomImage));
adminRoomRouter.get('/bookings/list', validate(adminRoomBookingsSchema), asyncHandler(controller.adminBookings));
adminRoomRouter.patch('/bookings/:id/status', validate(updateRoomBookingStatusSchema), asyncHandler(controller.adminUpdateBookingStatus));
