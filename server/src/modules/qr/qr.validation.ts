import { z } from 'zod';

export const verifyQrSchema = z.object({
  body: z.object({
    token: z.string().trim().min(5),
    checkIn: z.boolean().default(false),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
