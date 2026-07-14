import { BookingStatus } from '@prisma/client';
import { z } from 'zod';

export const listOwnBookingsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ status: z.nativeEnum(BookingStatus).optional() }),
  params: z.object({}).passthrough(),
});
