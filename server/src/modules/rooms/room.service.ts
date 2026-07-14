import { BookingStatus, Prisma, RoomStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { nightsBetween, parseDateOnly, startOfToday } from '../../utils/dates.js';
import { ensureMemberCanBook } from '../../utils/member-eligibility.js';
import { serializeDecimal } from '../../utils/serializers.js';
import { withSerializableRetry } from '../../utils/transactions.js';

const blockingStatuses = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

function validateStay(checkInDate: Date, checkOutDate: Date) {
  if (checkInDate < startOfToday()) throw new ApiError(422, 'Check-in date cannot be in the past.');
  if (checkOutDate <= checkInDate) throw new ApiError(422, 'Check-out date must be after check-in date.');
  const nights = nightsBetween(checkInDate, checkOutDate);
  if (nights > 60) throw new ApiError(422, 'A room stay cannot exceed 60 nights.');
  return nights;
}

function serializeRoom<T extends { pricePerNight: Prisma.Decimal }>(room: T) {
  return { ...room, pricePerNight: serializeDecimal(room.pricePerNight) };
}

function serializeRoomBooking<T extends { totalAmount: Prisma.Decimal; room: { pricePerNight: Prisma.Decimal } }>(booking: T) {
  return {
    ...booking,
    totalAmount: serializeDecimal(booking.totalAmount),
    room: serializeRoom(booking.room),
  };
}

export async function listAvailableRooms(input: { checkInDate: string; checkOutDate: string; guestCount: number }) {
  const checkInDate = parseDateOnly(input.checkInDate, 'Check-in date');
  const checkOutDate = parseDateOnly(input.checkOutDate, 'Check-out date');
  const nights = validateStay(checkInDate, checkOutDate);

  const rooms = await prisma.room.findMany({
    where: {
      status: RoomStatus.AVAILABLE,
      guestCapacity: { gte: input.guestCount },
      bookings: {
        none: {
          status: { in: blockingStatuses },
          checkInDate: { lt: checkOutDate },
          checkOutDate: { gt: checkInDate },
        },
      },
    },
    orderBy: [{ pricePerNight: 'asc' }, { roomNumber: 'asc' }],
  });

  return {
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    guestCount: input.guestCount,
    numberOfNights: nights,
    items: rooms.map((room) => ({
      ...serializeRoom(room),
      estimatedTotal: serializeDecimal(room.pricePerNight) * nights,
    })),
  };
}

export async function getMemberRoom(id: string) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new ApiError(404, 'Room not found.');
  return serializeRoom(room);
}

export async function createRoomBooking(
  memberId: string,
  input: { roomId: string; checkInDate: string; checkOutDate: string; guestCount: number },
) {
  const checkInDate = parseDateOnly(input.checkInDate, 'Check-in date');
  const checkOutDate = parseDateOnly(input.checkOutDate, 'Check-out date');
  const numberOfNights = validateStay(checkInDate, checkOutDate);

  return withSerializableRetry(async (transaction) => {
    await ensureMemberCanBook(transaction, memberId);
    const room = await transaction.room.findUnique({ where: { id: input.roomId } });
    if (!room) throw new ApiError(404, 'Room not found.');
    if (room.status !== RoomStatus.AVAILABLE) {
      throw new ApiError(409, room.status === RoomStatus.MAINTENANCE ? 'This room is under maintenance.' : 'This room is unavailable.');
    }
    if (input.guestCount > room.guestCapacity) throw new ApiError(422, 'Guest count exceeds room capacity.');

    const overlap = await transaction.roomBooking.findFirst({
      where: {
        roomId: room.id,
        status: { in: blockingStatuses },
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
      },
      select: { id: true },
    });
    if (overlap) throw new ApiError(409, 'This room is no longer available for the selected dates.');

    const totalAmount = new Prisma.Decimal(room.pricePerNight).mul(numberOfNights);
    const suffix = randomUUID().split('-')[0].toUpperCase();
    const booking = await transaction.roomBooking.create({
      data: {
        bookingNumber: `ROOM-${Date.now()}-${suffix}`,
        memberId,
        roomId: room.id,
        checkInDate,
        checkOutDate,
        guestCount: input.guestCount,
        numberOfNights,
        totalAmount,
        status: BookingStatus.CONFIRMED,
      },
      include: { room: true, member: { select: { fullName: true, memberCode: true } } },
    });
    return serializeRoomBooking(booking);
  });
}

export async function cancelRoomBooking(memberId: string, id: string) {
  const booking = await prisma.roomBooking.findFirst({
    where: { id, memberId },
    include: { room: true },
  });
  if (!booking) throw new ApiError(404, 'Room booking not found.');
  if (!blockingStatuses.includes(booking.status)) {
    throw new ApiError(409, 'Only pending or confirmed room bookings can be cancelled.');
  }
  if (booking.checkInDate < startOfToday()) throw new ApiError(409, 'This stay has already started and cannot be cancelled.');
  const updated = await prisma.roomBooking.update({
    where: { id },
    data: { status: BookingStatus.CANCELLED },
    include: { room: true },
  });
  return serializeRoomBooking(updated);
}

export async function listAdminRooms(query: { search?: string; status?: RoomStatus }) {
  const items = await prisma.room.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { OR: [{ roomNumber: { contains: query.search } }, { roomName: { contains: query.search } }, { roomType: { contains: query.search } }] }
        : {}),
    },
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        where: { status: { in: blockingStatuses }, checkOutDate: { gt: startOfToday() } },
        select: { id: true, bookingNumber: true, checkInDate: true, checkOutDate: true, status: true },
        orderBy: { checkInDate: 'asc' },
        take: 5,
      },
    },
    orderBy: { roomNumber: 'asc' },
  });
  return { items: items.map(serializeRoom) };
}

export async function createRoom(input: {
  roomNumber: string;
  roomName: string;
  roomType: string;
  pricePerNight: number;
  guestCapacity: number;
  amenities: string[];
  status: RoomStatus;
  imageUrl?: string;
}) {
  const room = await prisma.room.create({ data: { ...input, imageUrl: input.imageUrl || null } });
  return serializeRoom(room);
}

export async function updateRoom(
  id: string,
  input: Partial<{
    roomNumber: string;
    roomName: string;
    roomType: string;
    pricePerNight: number;
    guestCapacity: number;
    amenities: string[];
    status: RoomStatus;
    imageUrl: string;
  }>,
) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new ApiError(404, 'Room not found.');
  if (input.status && input.status !== RoomStatus.AVAILABLE) {
    const activeBooking = await prisma.roomBooking.findFirst({
      where: { roomId: id, status: { in: blockingStatuses }, checkOutDate: { gt: startOfToday() } },
    });
    if (activeBooking) throw new ApiError(409, 'This room has an active future booking. Cancel or complete it before making the room unavailable.');
  }
  const updated = await prisma.room.update({
    where: { id },
    data: { ...input, ...(input.imageUrl === '' ? { imageUrl: null } : {}) },
  });
  return serializeRoom(updated);
}

export async function listAdminRoomBookings(query: {
  search?: string;
  status?: BookingStatus;
  roomId?: string;
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.roomId ? { roomId: query.roomId } : {}),
    ...(query.search
      ? {
          OR: [
            { bookingNumber: { contains: query.search } },
            { member: { is: { fullName: { contains: query.search } } } },
            { member: { is: { memberCode: { contains: query.search } } } },
            { room: { is: { roomNumber: { contains: query.search } } } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.roomBooking.findMany({
      where,
      include: { room: true, member: { select: { id: true, fullName: true, memberCode: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.roomBooking.count({ where }),
  ]);
  return {
    items: items.map(serializeRoomBooking),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function updateRoomBookingStatus(id: string, status: BookingStatus) {
  const booking = await prisma.roomBooking.findUnique({ where: { id }, include: { room: true } });
  if (!booking) throw new ApiError(404, 'Room booking not found.');
  if (booking.status === BookingStatus.CANCELLED && status !== BookingStatus.CANCELLED) {
    throw new ApiError(409, 'Cancelled bookings cannot be reopened.');
  }
  if (booking.status === BookingStatus.COMPLETED && status === BookingStatus.CANCELLED) {
    throw new ApiError(409, 'Completed bookings cannot be cancelled.');
  }
  const updated = await prisma.roomBooking.update({ where: { id }, data: { status }, include: { room: true } });
  return serializeRoomBooking(updated);
}
