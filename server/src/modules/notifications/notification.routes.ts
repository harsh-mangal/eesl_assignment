import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './notification.controller.js';
import {
  adminNotificationIdSchema,
  createNotificationSchema,
  listAdminNotificationsSchema,
  listOwnNotificationsSchema,
  markAllReadSchema,
  ownNotificationIdSchema,
  unreadCountSchema,
} from './notification.validation.js';

export const notificationRouter = Router();
export const adminNotificationRouter = Router();

notificationRouter.use(authenticate, authorize(Role.MEMBER));
notificationRouter.get('/', validate(listOwnNotificationsSchema), asyncHandler(controller.ownList));
notificationRouter.get('/unread-count', validate(unreadCountSchema), asyncHandler(controller.ownUnreadCount));
notificationRouter.patch('/read-all', validate(markAllReadSchema), asyncHandler(controller.ownMarkAllRead));
notificationRouter.get('/:id', validate(ownNotificationIdSchema), asyncHandler(controller.ownGet));
notificationRouter.patch('/:id/read', validate(ownNotificationIdSchema), asyncHandler(controller.ownMarkRead));

adminNotificationRouter.use(authenticate, authorize(Role.ADMIN));
adminNotificationRouter.get('/', validate(listAdminNotificationsSchema), asyncHandler(controller.adminList));
adminNotificationRouter.post('/', validate(createNotificationSchema), asyncHandler(controller.adminCreate));
adminNotificationRouter.get('/:id', validate(adminNotificationIdSchema), asyncHandler(controller.adminGet));
