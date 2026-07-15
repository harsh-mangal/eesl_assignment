import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './report.controller.js';
import { getReportSchema } from './report.validation.js';

export const adminReportRouter = Router();

adminReportRouter.use(authenticate, authorize(Role.ADMIN));
adminReportRouter.get('/:reportType', validate(getReportSchema), asyncHandler(controller.getReport));
