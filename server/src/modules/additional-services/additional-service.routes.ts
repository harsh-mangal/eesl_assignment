import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './additional-service.controller.js';
import {
  getOwnAdditionalServiceSchema,
  listOwnAdditionalServicesSchema,
} from './additional-service.validation.js';

export const additionalServiceRouter = Router();
additionalServiceRouter.use(authenticate, authorize(Role.MEMBER));
additionalServiceRouter.get('/', validate(listOwnAdditionalServicesSchema), asyncHandler(controller.listOwn));
additionalServiceRouter.get('/:serviceType', validate(getOwnAdditionalServiceSchema), asyncHandler(controller.getOwn));
