import { RfidStatus } from '@prisma/client';
import { z } from 'zod';

export const listRfidSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional(),
    status: z.nativeEnum(RfidStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  params: z.object({}).passthrough(),
});

export const updateRfidSchema = z.object({
  body: z
    .object({
      status: z.nativeEnum(RfidStatus).optional(),
      expiryDate: z.coerce.date().optional(),
      referenceNumber: z.string().trim().min(3).max(100).optional(),
      cardNumber: z.string().trim().min(3).max(100).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required.'),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

export const verifyRfidSchema = z.object({
  body: z.object({
    referenceNumber: z.string().trim().min(3),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
