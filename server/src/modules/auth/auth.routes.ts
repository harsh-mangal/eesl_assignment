import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './auth.controller.js';
import { loginSchema } from './auth.validation.js';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), asyncHandler(controller.login));
authRouter.get('/me', authenticate, asyncHandler(controller.me));
authRouter.post('/logout', authenticate, asyncHandler(controller.logout));
