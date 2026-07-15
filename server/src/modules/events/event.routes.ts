import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { imageUpload } from '../uploads/upload.middleware.js';
import * as uploadController from '../uploads/upload.controller.js';
import * as controller from './event.controller.js';
import {
  adminEventBookingsSchema,
  adminListEventsSchema,
  createEventBookingSchema,
  createEventSchema,
  eventIdSchema,
  listMemberEventsSchema,
  updateEventBookingStatusSchema,
  updateEventSchema,
} from './event.validation.js';

export const eventRouter = Router();
export const adminEventRouter = Router();

eventRouter.use(authenticate, authorize(Role.MEMBER));
eventRouter.get('/', validate(listMemberEventsSchema), asyncHandler(controller.listMember));
eventRouter.get('/:id', validate(eventIdSchema), asyncHandler(controller.getMember));
eventRouter.post('/:id/book', validate(createEventBookingSchema), asyncHandler(controller.book));
eventRouter.patch('/bookings/:id/cancel', validate(eventIdSchema), asyncHandler(controller.cancel));

adminEventRouter.use(authenticate, authorize(Role.ADMIN));
adminEventRouter.get('/', validate(adminListEventsSchema), asyncHandler(controller.adminList));
adminEventRouter.post('/', validate(createEventSchema), asyncHandler(controller.adminCreate));
adminEventRouter.get('/bookings/list', validate(adminEventBookingsSchema), asyncHandler(controller.adminBookings));
adminEventRouter.patch('/bookings/:id/status', validate(updateEventBookingStatusSchema), asyncHandler(controller.adminUpdateBookingStatus));
adminEventRouter.patch('/:id', validate(updateEventSchema), asyncHandler(controller.adminUpdate));
adminEventRouter.post('/:id/banner', imageUpload, validate(eventIdSchema), asyncHandler(uploadController.eventBanner));
