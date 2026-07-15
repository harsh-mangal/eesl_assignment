import { BookingStatus, EventStatus, PaymentMethod } from '@prisma/client';
import { z } from 'zod';

const idParams = z.object({ id: z.string().min(1) });
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const listMemberEventsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    filter: z.enum(['ALL', 'FREE', 'PAID', 'UPCOMING']).default('UPCOMING'),
    category: z.string().trim().optional(),
    search: z.string().trim().optional(),
  }),
});

export const eventIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: idParams,
  query: z.object({}).passthrough(),
});

export const createEventBookingSchema = z.object({
  body: z.object({
    ticketQuantity: z.coerce.number().int().min(1).max(20),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  }),
  params: idParams,
  query: z.object({}).passthrough(),
});

const eventPayload = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(5),
  category: z.string().trim().min(2).max(80),
  eventDate: z.string().regex(datePattern, 'Event date must use YYYY-MM-DD.'),
  startTime: z.string().regex(timePattern, 'Start time must use HH:mm.'),
  endTime: z.string().regex(timePattern, 'End time must use HH:mm.'),
  venue: z.string().trim().min(2).max(200),
  ticketPrice: z.coerce.number().min(0).max(1000000),
  totalCapacity: z.coerce.number().int().min(1).max(1000000),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  bannerUrl: z.string().trim().url().or(z.literal('')).optional(),
});

export const createEventSchema = z.object({
  body: eventPayload,
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const updateEventSchema = z.object({
  body: eventPayload.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required.'),
  params: idParams,
  query: z.object({}).passthrough(),
});

export const adminListEventsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    status: z.nativeEnum(EventStatus).optional(),
  }),
});

export const adminEventBookingsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional(),
    eventId: z.string().optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    checkedIn: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
});

export const updateEventBookingStatusSchema = z.object({
  body: z.object({ status: z.nativeEnum(BookingStatus) }),
  params: idParams,
  query: z.object({}).passthrough(),
});
