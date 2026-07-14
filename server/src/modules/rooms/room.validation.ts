import { BookingStatus, RoomStatus } from '@prisma/client';
import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.');

export const roomAvailabilitySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    checkInDate: dateOnly,
    checkOutDate: dateOnly,
    guestCount: z.coerce.number().int().min(1).max(20),
  }),
  params: z.object({}).passthrough(),
});

export const roomIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

export const createRoomBookingSchema = z.object({
  body: z.object({
    roomId: z.string().min(1),
    checkInDate: dateOnly,
    checkOutDate: dateOnly,
    guestCount: z.coerce.number().int().min(1).max(20),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const adminListRoomsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional(),
    status: z.nativeEnum(RoomStatus).optional(),
  }),
  params: z.object({}).passthrough(),
});

const roomBody = z.object({
  roomNumber: z.string().trim().min(1).max(30),
  roomName: z.string().trim().min(2).max(120),
  roomType: z.string().trim().min(2).max(80),
  pricePerNight: z.coerce.number().positive().max(1000000),
  guestCapacity: z.coerce.number().int().min(1).max(20),
  amenities: z.array(z.string().trim().min(1).max(80)).min(1),
  status: z.nativeEnum(RoomStatus),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const createRoomSchema = z.object({
  body: roomBody,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateRoomSchema = z.object({
  body: roomBody.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required.'),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

export const adminRoomBookingsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    roomId: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  }),
  params: z.object({}).passthrough(),
});

export const updateRoomBookingStatusSchema = z.object({
  body: z.object({ status: z.nativeEnum(BookingStatus) }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});
