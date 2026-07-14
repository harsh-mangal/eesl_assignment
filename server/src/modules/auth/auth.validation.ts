import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3).max(150),
    password: z.string().min(6).max(100),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
