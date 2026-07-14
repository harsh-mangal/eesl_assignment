import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { list } from './booking.controller.js';
import { listOwnBookingsSchema } from './booking.validation.js';

export const bookingRouter = Router();
bookingRouter.use(authenticate, authorize(Role.MEMBER));
bookingRouter.get('/', validate(listOwnBookingsSchema), asyncHandler(list));
