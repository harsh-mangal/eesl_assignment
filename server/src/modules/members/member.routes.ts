import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './member.controller.js';
import {
  createMemberSchema,
  listMembersSchema,
  memberIdSchema,
  updateMemberSchema,
  updateOwnProfileSchema,
} from './member.validation.js';

export const memberRouter = Router();
export const adminMemberRouter = Router();

memberRouter.use(authenticate, authorize(Role.MEMBER));
memberRouter.get('/profile', asyncHandler(controller.ownProfile));
memberRouter.patch('/profile', validate(updateOwnProfileSchema), asyncHandler(controller.updateOwnProfile));
memberRouter.get('/membership-card', asyncHandler(controller.membershipCard));

adminMemberRouter.use(authenticate, authorize(Role.ADMIN));
adminMemberRouter.get('/', validate(listMembersSchema), asyncHandler(controller.list));
adminMemberRouter.post('/', validate(createMemberSchema), asyncHandler(controller.create));
adminMemberRouter.get('/:id', validate(memberIdSchema), asyncHandler(controller.get));
adminMemberRouter.patch('/:id', validate(updateMemberSchema), asyncHandler(controller.update));
