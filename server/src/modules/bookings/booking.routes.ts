import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './booking.controller.js';
import {
  listAdminBookingsSchema,
  listOwnBookingsSchema,
  ownBookingDetailSchema,
  updateAdminBookingStatusSchema,
} from './booking.validation.js';

export const bookingRouter = Router();
export const adminBookingRouter = Router();

bookingRouter.use(authenticate, authorize(Role.MEMBER));
bookingRouter.get('/', validate(listOwnBookingsSchema), asyncHandler(controller.list));
bookingRouter.get('/:type/:id', validate(ownBookingDetailSchema), asyncHandler(controller.detail));

adminBookingRouter.use(authenticate, authorize(Role.ADMIN));
adminBookingRouter.get('/', validate(listAdminBookingsSchema), asyncHandler(controller.adminList));
adminBookingRouter.patch('/:type/:id/status', validate(updateAdminBookingStatusSchema), asyncHandler(controller.adminUpdateStatus));
