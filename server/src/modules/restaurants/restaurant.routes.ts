import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './restaurant.controller.js';
import {
  adminListRestaurantsSchema,
  adminRestaurantBookingsSchema,
  bookingIdSchema,
  createRestaurantBookingSchema,
  createRestaurantSchema,
  createRestaurantSlotSchema,
  restaurantAvailabilitySchema,
  restaurantIdAvailabilitySchema,
  updateRestaurantBookingStatusSchema,
  updateRestaurantSchema,
  updateRestaurantSlotSchema,
} from './restaurant.validation.js';

export const restaurantRouter = Router();
export const adminRestaurantRouter = Router();

restaurantRouter.use(authenticate, authorize(Role.MEMBER));
restaurantRouter.get('/', validate(restaurantAvailabilitySchema), asyncHandler(controller.listMember));
restaurantRouter.get('/:id', validate(restaurantIdAvailabilitySchema), asyncHandler(controller.getMember));
restaurantRouter.post('/bookings/create', validate(createRestaurantBookingSchema), asyncHandler(controller.createBooking));
restaurantRouter.patch('/bookings/:id/cancel', validate(bookingIdSchema), asyncHandler(controller.cancelBooking));

adminRestaurantRouter.use(authenticate, authorize(Role.ADMIN));
adminRestaurantRouter.get('/', validate(adminListRestaurantsSchema), asyncHandler(controller.adminList));
adminRestaurantRouter.post('/', validate(createRestaurantSchema), asyncHandler(controller.adminCreate));
adminRestaurantRouter.patch('/:id', validate(updateRestaurantSchema), asyncHandler(controller.adminUpdate));
adminRestaurantRouter.post('/:id/slots', validate(createRestaurantSlotSchema), asyncHandler(controller.adminCreateSlot));
adminRestaurantRouter.patch('/slots/:id', validate(updateRestaurantSlotSchema), asyncHandler(controller.adminUpdateSlot));
adminRestaurantRouter.get('/bookings/list', validate(adminRestaurantBookingsSchema), asyncHandler(controller.adminBookings));
adminRestaurantRouter.patch('/bookings/:id/status', validate(updateRestaurantBookingStatusSchema), asyncHandler(controller.adminUpdateBookingStatus));
