import { MembershipStatus } from '@prisma/client';
import { z } from 'zod';

export const updateOwnProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2).max(100).optional(),
      email: z.string().email().optional(),
      mobileNumber: z.string().trim().min(7).max(20).optional(),
      address: z.string().trim().min(5).max(500).optional(),
      profilePhotoUrl: z.string().url().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required.'),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const listMembersSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional(),
    membershipStatus: z.nativeEnum(MembershipStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  params: z.object({}).passthrough(),
});

export const memberIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

export const createMemberSchema = z.object({
  body: z.object({
    memberCode: z.string().trim().min(3).max(30).transform((value) => value.toUpperCase()),
    fullName: z.string().trim().min(2).max(100),
    email: z.string().email().transform((value) => value.toLowerCase()),
    mobileNumber: z.string().trim().min(7).max(20),
    address: z.string().trim().min(5).max(500),
    profilePhotoUrl: z.string().url().optional(),
    password: z.string().min(8).max(100),
    membershipType: z.string().trim().min(2).max(50),
    membershipStatus: z.nativeEnum(MembershipStatus).default(MembershipStatus.ACTIVE),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateMemberSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2).max(100).optional(),
      email: z.string().email().transform((value) => value.toLowerCase()).optional(),
      mobileNumber: z.string().trim().min(7).max(20).optional(),
      address: z.string().trim().min(5).max(500).optional(),
      profilePhotoUrl: z.string().url().nullable().optional(),
      membershipType: z.string().trim().min(2).max(50).optional(),
      membershipStatus: z.nativeEnum(MembershipStatus).optional(),
      validUntil: z.coerce.date().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required.'),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});
