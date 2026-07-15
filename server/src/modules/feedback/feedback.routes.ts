import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './feedback.controller.js';
import {
  createFeedbackSchema,
  listAdminFeedbackSchema,
  listOwnFeedbackSchema,
} from './feedback.validation.js';

export const feedbackRouter = Router();
export const adminFeedbackRouter = Router();

feedbackRouter.use(authenticate, authorize(Role.MEMBER));
feedbackRouter.get('/', validate(listOwnFeedbackSchema), asyncHandler(controller.listOwn));
feedbackRouter.post('/', validate(createFeedbackSchema), asyncHandler(controller.createOwn));

adminFeedbackRouter.use(authenticate, authorize(Role.ADMIN));
adminFeedbackRouter.get('/', validate(listAdminFeedbackSchema), asyncHandler(controller.adminList));
