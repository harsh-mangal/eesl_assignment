import { AdditionalServiceType } from '@prisma/client';
import { z } from 'zod';

const emptyBody = z.object({}).passthrough();
const emptyQuery = z.object({}).passthrough();
const emptyParams = z.object({}).passthrough();

export const listOwnAdditionalServicesSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: emptyParams,
});

export const getOwnAdditionalServiceSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({ serviceType: z.nativeEnum(AdditionalServiceType) }),
});
