import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { z } from 'zod';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const idParams = z.object({ id: z.string().min(1) });
const emptyBody = z.object({}).passthrough();
const emptyQuery = z.object({}).passthrough();

export const listOwnInvoicesSchema = z.object({
  body: emptyBody,
  params: z.object({}).passthrough(),
  query: z.object({
    filter: z.enum(['ALL', 'PAID', 'UNPAID']).default('ALL'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  }),
});

export const invoiceIdSchema = z.object({ body: emptyBody, params: idParams, query: emptyQuery });

export const payInvoiceSchema = z.object({
  body: z.object({
    paymentMethod: z.enum([PaymentMethod.SIMULATED, PaymentMethod.CARD, PaymentMethod.UPI]),
  }),
  params: idParams,
  query: emptyQuery,
});

export const listAdminInvoicesSchema = z.object({
  body: emptyBody,
  params: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional(),
    status: z.nativeEnum(InvoiceStatus).optional(),
    memberId: z.string().optional(),
    dateFrom: z.string().regex(datePattern).optional(),
    dateTo: z.string().regex(datePattern).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
});

const invoicePayload = z.object({
  memberId: z.string().min(1),
  description: z.string().trim().min(3).max(2000),
  amount: z.coerce.number().positive().max(100000000),
  issueDate: z.string().regex(datePattern, 'Issue date must use YYYY-MM-DD.'),
  dueDate: z.string().regex(datePattern, 'Due date must use YYYY-MM-DD.'),
});

export const createInvoiceSchema = z.object({
  body: invoicePayload,
  params: z.object({}).passthrough(),
  query: emptyQuery,
});

export const updateInvoiceSchema = z.object({
  body: invoicePayload
    .omit({ memberId: true })
    .partial()
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required.'),
  params: idParams,
  query: emptyQuery,
});
