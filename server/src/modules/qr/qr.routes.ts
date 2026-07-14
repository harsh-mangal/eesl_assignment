import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './qr.controller.js';
import { verifyQrSchema } from './qr.validation.js';

export const qrRouter = Router();

qrRouter.use(authenticate, authorize(Role.ADMIN));
qrRouter.post('/verify', validate(verifyQrSchema), asyncHandler(controller.verify));
