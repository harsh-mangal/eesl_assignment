import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './rfid.controller.js';
import { listRfidSchema, updateRfidSchema, verifyRfidSchema } from './rfid.validation.js';

export const rfidRouter = Router();

rfidRouter.use(authenticate, authorize(Role.ADMIN));
rfidRouter.get('/', validate(listRfidSchema), asyncHandler(controller.list));
rfidRouter.patch('/:id', validate(updateRfidSchema), asyncHandler(controller.update));
rfidRouter.post('/verify', validate(verifyRfidSchema), asyncHandler(controller.verify));
