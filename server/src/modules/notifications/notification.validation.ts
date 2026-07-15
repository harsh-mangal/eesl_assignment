import { NotificationAudience, NotificationType } from '@prisma/client';
import { z } from 'zod';

const emptyBody = z.object({}).passthrough();
const emptyParams = z.object({}).passthrough();
const emptyQuery = z.object({}).passthrough();
const idParams = z.object({ id: z.string().min(1) });

export const listOwnNotificationsSchema = z.object({
  body: emptyBody,
  params: emptyParams,
  query: z.object({
    filter: z.enum(['ALL', 'UNREAD']).default('ALL'),
    type: z.nativeEnum(NotificationType).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  }),
});

export const ownNotificationIdSchema = z.object({
  body: emptyBody,
  params: idParams,
  query: emptyQuery,
});

export const markAllReadSchema = z.object({
  body: emptyBody,
  params: emptyParams,
  query: emptyQuery,
});

export const unreadCountSchema = markAllReadSchema;

export const listAdminNotificationsSchema = z.object({
  body: emptyBody,
  params: emptyParams,
  query: z.object({
    search: z.string().trim().optional(),
    type: z.nativeEnum(NotificationType).optional(),
    audience: z.nativeEnum(NotificationAudience).optional(),
    status: z.enum(['PUBLISHED', 'SCHEDULED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

const createPayload = z
  .object({
    title: z.string().trim().min(3).max(160),
    message: z.string().trim().min(3).max(5000),
    type: z.nativeEnum(NotificationType),
    audience: z.nativeEnum(NotificationAudience),
    selectedMemberId: z.string().min(1).optional(),
    membershipType: z.string().trim().min(1).max(100).optional(),
    publishAt: z.coerce.date().optional(),
  })
  .superRefine((value, context) => {
    if (value.audience === NotificationAudience.SELECTED_MEMBER && !value.selectedMemberId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectedMemberId'],
        message: 'A member must be selected for this audience.',
      });
    }
    if (value.audience === NotificationAudience.MEMBERSHIP_TYPE && !value.membershipType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['membershipType'],
        message: 'Membership type is required for this audience.',
      });
    }
  });

export const createNotificationSchema = z.object({
  body: createPayload,
  params: emptyParams,
  query: emptyQuery,
});

export const adminNotificationIdSchema = ownNotificationIdSchema;
