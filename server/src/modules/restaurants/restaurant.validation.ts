import { BookingStatus } from '@prisma/client';
import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.');
const timeOnly = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format.');

export const restaurantAvailabilitySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ date: dateOnly }),
  params: z.object({}).passthrough(),
});

export const restaurantIdAvailabilitySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ date: dateOnly }),
  params: z.object({ id: z.string().min(1) }),
});

export const createRestaurantBookingSchema = z.object({
  body: z.object({
    slotId: z.string().min(1),
    guestCount: z.coerce.number().int().min(1).max(50),
    specialInstructions: z.string().trim().max(1000).optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const bookingIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

export const adminListRestaurantsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ search: z.string().trim().optional(), active: z.coerce.boolean().optional() }),
  params: z.object({}).passthrough(),
});

export const createRestaurantSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().min(5).max(2000),
    openingTime: timeOnly,
    closingTime: timeOnly,
    isActive: z.boolean().default(true),
    imageUrl: z.string().url().optional().or(z.literal('')),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateRestaurantSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().min(5).max(2000).optional(),
      openingTime: timeOnly.optional(),
      closingTime: timeOnly.optional(),
      isActive: z.boolean().optional(),
      imageUrl: z.string().url().nullable().optional().or(z.literal('')),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required.'),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

export const createRestaurantSlotSchema = z.object({
  body: z.object({
    bookingDate: dateOnly,
    startTime: timeOnly,
    endTime: timeOnly,
    capacity: z.coerce.number().int().min(1).max(500),
    isAvailable: z.boolean().default(true),
  }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

export const updateRestaurantSlotSchema = z.object({
  body: z
    .object({
      bookingDate: dateOnly.optional(),
      startTime: timeOnly.optional(),
      endTime: timeOnly.optional(),
      capacity: z.coerce.number().int().min(1).max(500).optional(),
      isAvailable: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required.'),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

export const adminRestaurantBookingsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    restaurantId: z.string().optional(),
    date: dateOnly.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  }),
  params: z.object({}).passthrough(),
});

export const updateRestaurantBookingStatusSchema = z.object({
  body: z.object({ status: z.nativeEnum(BookingStatus) }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});
