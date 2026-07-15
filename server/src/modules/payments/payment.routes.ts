import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './payment.controller.js';
import { listAdminPaymentsSchema, listOwnPaymentsSchema } from './payment.validation.js';

export const paymentRouter = Router();
export const adminPaymentRouter = Router();

paymentRouter.use(authenticate, authorize(Role.MEMBER));
paymentRouter.get('/', validate(listOwnPaymentsSchema), asyncHandler(controller.ownList));

adminPaymentRouter.use(authenticate, authorize(Role.ADMIN));
adminPaymentRouter.get('/', validate(listAdminPaymentsSchema), asyncHandler(controller.adminList));
