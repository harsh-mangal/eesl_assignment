import { ServiceType } from '@prisma/client';
import { z } from 'zod';

const emptyParams = z.object({}).passthrough();
const emptyQuery = z.object({}).passthrough();
const emptyBody = z.object({}).passthrough();

export const createFeedbackSchema = z.object({
  body: z.object({
    serviceType: z.nativeEnum(ServiceType),
    bookingId: z.string().trim().min(1),
    rating: z.coerce.number().int().min(1).max(5),
    comments: z.string().trim().min(3).max(2000),
  }),
  params: emptyParams,
  query: emptyQuery,
});

export const listOwnFeedbackSchema = z.object({
  body: emptyBody,
  params: emptyParams,
  query: z.object({
    serviceType: z.nativeEnum(ServiceType).optional(),
  }),
});

export const listAdminFeedbackSchema = z.object({
  body: emptyBody,
  params: emptyParams,
  query: z.object({
    search: z.string().trim().optional(),
    serviceType: z.nativeEnum(ServiceType).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});
