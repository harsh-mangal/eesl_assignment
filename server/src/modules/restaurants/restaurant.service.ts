import { BookingStatus, QrStatus, QrType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { dateOnlyKey, parseDateOnly, startOfToday } from '../../utils/dates.js';
import { ensureMemberCanBook } from '../../utils/member-eligibility.js';
import { withSerializableRetry } from '../../utils/transactions.js';

const activeBookingStatuses = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

function restaurantInclude(date?: Date) {
  return {
    slots: {
      ...(date ? { where: { bookingDate: date } } : {}),
      orderBy: [{ bookingDate: 'asc' as const }, { startTime: 'asc' as const }],
    },
  };
}

function serializeRestaurant<T extends { slots: Array<{ capacity: number; bookedCapacity: number }> }>(item: T) {
  return {
    ...item,
    slots: item.slots.map((slot) => ({
      ...slot,
      availableCapacity: Math.max(0, slot.capacity - slot.bookedCapacity),
    })),
  };
}

export async function listMemberRestaurants(dateInput: string) {
  const date = parseDateOnly(dateInput, 'Booking date');
  if (date < startOfToday()) throw new ApiError(422, 'Past dates are not allowed.');

  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    include: restaurantInclude(date),
    orderBy: { name: 'asc' },
  });

  return {
    date: dateOnlyKey(date),
    items: restaurants.map(serializeRestaurant),
  };
}

export async function getMemberRestaurant(id: string, dateInput: string) {
  const date = parseDateOnly(dateInput, 'Booking date');
  if (date < startOfToday()) throw new ApiError(422, 'Past dates are not allowed.');

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, isActive: true },
    include: restaurantInclude(date),
  });
  if (!restaurant) throw new ApiError(404, 'Restaurant not found or inactive.');
  return serializeRestaurant(restaurant);
}

export async function createRestaurantBooking(
  memberId: string,
  input: { slotId: string; guestCount: number; specialInstructions?: string },
) {
  return withSerializableRetry(async (transaction) => {
    await ensureMemberCanBook(transaction, memberId);
    const slot = await transaction.restaurantSlot.findUnique({
      where: { id: input.slotId },
      include: { restaurant: true },
    });
    if (!slot) throw new ApiError(404, 'Restaurant slot not found.');
    if (!slot.restaurant.isActive) throw new ApiError(409, 'This restaurant is inactive.');
    if (!slot.isAvailable) throw new ApiError(409, 'This time slot is unavailable.');
    if (slot.bookingDate < startOfToday()) throw new ApiError(422, 'Past dates are not allowed.');
    if (input.guestCount > slot.capacity - slot.bookedCapacity) {
      throw new ApiError(409, 'The selected slot does not have enough available capacity.');
    }

    const capacityUpdate = await transaction.restaurantSlot.updateMany({
      where: {
        id: slot.id,
        isAvailable: true,
        bookedCapacity: { lte: slot.capacity - input.guestCount },
      },
      data: { bookedCapacity: { increment: input.guestCount } },
    });
    if (capacityUpdate.count !== 1) {
      throw new ApiError(409, 'The slot capacity changed. Please refresh and try again.');
    }

    const suffix = randomUUID().split('-')[0].toUpperCase();
    const bookingNumber = `REST-${Date.now()}-${suffix}`;
    const qrToken = `QR-${bookingNumber}-${randomUUID()}`;
    const booking = await transaction.restaurantBooking.create({
      data: {
        bookingNumber,
        memberId,
        restaurantId: slot.restaurantId,
        slotId: slot.id,
        guestCount: input.guestCount,
        specialInstructions: input.specialInstructions,
        status: BookingStatus.CONFIRMED,
        qrToken,
      },
      include: { restaurant: true, slot: true, member: { select: { fullName: true, memberCode: true } } },
    });

    await transaction.qrToken.create({
      data: {
        token: qrToken,
        type: QrType.RESTAURANT_BOOKING,
        status: QrStatus.ACTIVE,
        memberId,
        referenceId: booking.id,
        expiresAt: new Date(`${dateOnlyKey(slot.bookingDate)}T23:59:59.999Z`),
      },
    });
    return booking;
  });
}

export async function cancelRestaurantBooking(memberId: string, id: string) {
  return withSerializableRetry(async (transaction) => {
    const booking = await transaction.restaurantBooking.findFirst({
      where: { id, memberId },
      include: { slot: true, restaurant: true },
    });
    if (!booking) throw new ApiError(404, 'Restaurant booking not found.');
    if (!activeBookingStatuses.includes(booking.status)) {
      throw new ApiError(409, 'Only pending or confirmed bookings can be cancelled.');
    }

    const updated = await transaction.restaurantBooking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED },
      include: { slot: true, restaurant: true },
    });
    await transaction.restaurantSlot.update({
      where: { id: booking.slotId },
      data: { bookedCapacity: { decrement: booking.guestCount } },
    });
    await transaction.qrToken.updateMany({
      where: { token: booking.qrToken },
      data: { status: QrStatus.CANCELLED },
    });
    return updated;
  });
}

export async function listAdminRestaurants(query: { search?: string; active?: boolean }) {
  const items = await prisma.restaurant.findMany({
    where: {
      ...(query.active !== undefined ? { isActive: query.active } : {}),
      ...(query.search ? { name: { contains: query.search } } : {}),
    },
    include: {
      slots: { where: { bookingDate: { gte: startOfToday() } }, orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }] },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return { items: items.map(serializeRestaurant) };
}

export async function createRestaurant(input: {
  name: string;
  description: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  imageUrl?: string;
}) {
  return prisma.restaurant.create({
    data: { ...input, imageUrl: input.imageUrl || null },
    include: { slots: true, _count: { select: { bookings: true } } },
  });
}

export async function updateRestaurant(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    openingTime: string;
    closingTime: string;
    isActive: boolean;
    imageUrl: string | null;
  }>,
) {
  const exists = await prisma.restaurant.findUnique({ where: { id } });
  if (!exists) throw new ApiError(404, 'Restaurant not found.');
  return prisma.restaurant.update({
    where: { id },
    data: { ...input, ...(input.imageUrl === '' ? { imageUrl: null } : {}) },
    include: { slots: { orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }] }, _count: { select: { bookings: true } } },
  });
}

export async function createRestaurantSlot(
  restaurantId: string,
  input: { bookingDate: string; startTime: string; endTime: string; capacity: number; isAvailable: boolean },
) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new ApiError(404, 'Restaurant not found.');
  const bookingDate = parseDateOnly(input.bookingDate, 'Booking date');
  if (bookingDate < startOfToday()) throw new ApiError(422, 'Past slot dates are not allowed.');
  if (input.endTime === input.startTime) throw new ApiError(422, 'Slot start and end time cannot be the same.');
  return prisma.restaurantSlot.create({
    data: { ...input, bookingDate, restaurantId },
  });
}

export async function updateRestaurantSlot(
  id: string,
  input: Partial<{ bookingDate: string; startTime: string; endTime: string; capacity: number; isAvailable: boolean }>,
) {
  const slot = await prisma.restaurantSlot.findUnique({ where: { id } });
  if (!slot) throw new ApiError(404, 'Restaurant slot not found.');
  const nextCapacity = input.capacity ?? slot.capacity;
  if (nextCapacity < slot.bookedCapacity) {
    throw new ApiError(422, `Capacity cannot be lower than the booked capacity (${slot.bookedCapacity}).`);
  }
  const nextStart = input.startTime ?? slot.startTime;
  const nextEnd = input.endTime ?? slot.endTime;
  if (nextEnd === nextStart) throw new ApiError(422, 'Slot start and end time cannot be the same.');
  const bookingDate = input.bookingDate ? parseDateOnly(input.bookingDate, 'Booking date') : undefined;
  return prisma.restaurantSlot.update({
    where: { id },
    data: { ...input, ...(bookingDate ? { bookingDate } : {}) },
  });
}

export async function listAdminRestaurantBookings(query: {
  search?: string;
  status?: BookingStatus;
  restaurantId?: string;
  date?: string;
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;
  const bookingDate = query.date ? parseDateOnly(query.date, 'Booking date') : undefined;
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.restaurantId ? { restaurantId: query.restaurantId } : {}),
    ...(bookingDate ? { slot: { is: { bookingDate } } } : {}),
    ...(query.search
      ? {
          OR: [
            { bookingNumber: { contains: query.search } },
            { member: { is: { fullName: { contains: query.search } } } },
            { member: { is: { memberCode: { contains: query.search } } } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.restaurantBooking.findMany({
      where,
      include: {
        restaurant: true,
        slot: true,
        member: { select: { id: true, fullName: true, memberCode: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.restaurantBooking.count({ where }),
  ]);
  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) } };
}

export async function updateRestaurantBookingStatus(id: string, status: BookingStatus) {
  if (status === BookingStatus.CANCELLED) {
    return withSerializableRetry(async (transaction) => {
      const booking = await transaction.restaurantBooking.findUnique({ where: { id } });
      if (!booking) throw new ApiError(404, 'Restaurant booking not found.');
      if (booking.status === BookingStatus.CANCELLED) return booking;
      if (booking.status === BookingStatus.COMPLETED) throw new ApiError(409, 'Completed bookings cannot be cancelled.');
      const updated = await transaction.restaurantBooking.update({ where: { id }, data: { status } });
      await transaction.restaurantSlot.update({ where: { id: booking.slotId }, data: { bookedCapacity: { decrement: booking.guestCount } } });
      await transaction.qrToken.updateMany({ where: { token: booking.qrToken }, data: { status: QrStatus.CANCELLED } });
      return updated;
    });
  }
  const booking = await prisma.restaurantBooking.findUnique({ where: { id } });
  if (!booking) throw new ApiError(404, 'Restaurant booking not found.');
  if (booking.status === BookingStatus.CANCELLED) throw new ApiError(409, 'Cancelled bookings cannot be reopened.');
  return prisma.restaurantBooking.update({ where: { id }, data: { status } });
}
