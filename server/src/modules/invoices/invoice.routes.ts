import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './invoice.controller.js';
import {
  createInvoiceSchema,
  invoiceIdSchema,
  listAdminInvoicesSchema,
  listOwnInvoicesSchema,
  payInvoiceSchema,
  updateInvoiceSchema,
} from './invoice.validation.js';

export const invoiceRouter = Router();
export const adminInvoiceRouter = Router();

invoiceRouter.use(authenticate, authorize(Role.MEMBER));
invoiceRouter.get('/', validate(listOwnInvoicesSchema), asyncHandler(controller.ownList));
invoiceRouter.get('/:id', validate(invoiceIdSchema), asyncHandler(controller.ownGet));
invoiceRouter.post('/:id/pay', validate(payInvoiceSchema), asyncHandler(controller.ownPay));

adminInvoiceRouter.use(authenticate, authorize(Role.ADMIN));
adminInvoiceRouter.get('/', validate(listAdminInvoicesSchema), asyncHandler(controller.adminList));
adminInvoiceRouter.post('/', validate(createInvoiceSchema), asyncHandler(controller.adminCreate));
adminInvoiceRouter.get('/:id', validate(invoiceIdSchema), asyncHandler(controller.adminGet));
adminInvoiceRouter.patch('/:id', validate(updateInvoiceSchema), asyncHandler(controller.adminUpdate));
adminInvoiceRouter.patch('/:id/cancel', validate(invoiceIdSchema), asyncHandler(controller.adminCancel));
