import { BookingStatus } from '@prisma/client';
import { z } from 'zod';

export const bookingTypeSchema = z.enum(['RESTAURANT', 'ROOM', 'EVENT']);

export const listOwnBookingsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ status: z.nativeEnum(BookingStatus).optional() }),
  params: z.object({}).passthrough(),
});

export const ownBookingDetailSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    type: bookingTypeSchema,
    id: z.string().min(1),
  }),
});

export const listAdminBookingsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional(),
    type: bookingTypeSchema.optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  params: z.object({}).passthrough(),
});

export const updateAdminBookingStatusSchema = z.object({
  body: z.object({ status: z.nativeEnum(BookingStatus) }),
  query: z.object({}).passthrough(),
  params: z.object({
    type: bookingTypeSchema,
    id: z.string().min(1),
  }),
});
