import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/member',
  authenticate,
  authorize(Role.MEMBER),
  asyncHandler(controller.memberDashboard),
);

dashboardRouter.get(
  '/admin',
  authenticate,
  authorize(Role.ADMIN),
  asyncHandler(controller.adminDashboard),
);
