import { BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { serializeDecimal } from '../../utils/serializers.js';
import { updateEventBookingStatus } from '../events/event.service.js';
import { updateRestaurantBookingStatus } from '../restaurants/restaurant.service.js';
import { updateRoomBookingStatus } from '../rooms/room.service.js';

export type BookingType = 'RESTAURANT' | 'ROOM' | 'EVENT';

export async function listOwnBookings(memberId: string, status?: BookingStatus) {
  const where = { memberId, ...(status ? { status } : {}) };
  const [restaurant, room, event] = await Promise.all([
    prisma.restaurantBooking.findMany({
      where,
      include: { restaurant: true, slot: true, feedback: { select: { id: true, rating: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.roomBooking.findMany({
      where,
      include: { room: true, feedback: { select: { id: true, rating: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.eventBooking.findMany({
      where,
      include: { event: true, payments: { orderBy: { paidAt: 'desc' } }, feedback: { select: { id: true, rating: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    restaurant,
    room: room.map((booking) => ({
      ...booking,
      totalAmount: serializeDecimal(booking.totalAmount),
      room: { ...booking.room, pricePerNight: serializeDecimal(booking.room.pricePerNight) },
    })),
    event: event.map((booking) => ({
      ...booking,
      amount: serializeDecimal(booking.amount),
      event: { ...booking.event, ticketPrice: serializeDecimal(booking.event.ticketPrice) },
      payments: booking.payments.map((payment) => ({ ...payment, amount: serializeDecimal(payment.amount) })),
    })),
  };
}

export async function getOwnBookingDetail(memberId: string, type: BookingType, id: string) {
  if (type === 'RESTAURANT') {
    const booking = await prisma.restaurantBooking.findFirst({
      where: { id, memberId },
      include: {
        restaurant: true,
        slot: true,
        feedback: true,
      },
    });
    if (!booking) throw new ApiError(404, 'Restaurant booking not found.');
    return { type, booking };
  }

  if (type === 'ROOM') {
    const booking = await prisma.roomBooking.findFirst({
      where: { id, memberId },
      include: {
        room: true,
        payments: { orderBy: { paidAt: 'desc' } },
        feedback: true,
      },
    });
    if (!booking) throw new ApiError(404, 'Room booking not found.');
    return {
      type,
      booking: {
        ...booking,
        totalAmount: serializeDecimal(booking.totalAmount),
        room: { ...booking.room, pricePerNight: serializeDecimal(booking.room.pricePerNight) },
        payments: booking.payments.map((payment) => ({ ...payment, amount: serializeDecimal(payment.amount) })),
      },
    };
  }

  const booking = await prisma.eventBooking.findFirst({
    where: { id, memberId },
    include: {
      event: true,
      payments: { orderBy: { paidAt: 'desc' } },
      feedback: true,
    },
  });
  if (!booking) throw new ApiError(404, 'Event booking not found.');
  return {
    type,
    booking: {
      ...booking,
      amount: serializeDecimal(booking.amount),
      event: { ...booking.event, ticketPrice: serializeDecimal(booking.event.ticketPrice) },
      payments: booking.payments.map((payment) => ({ ...payment, amount: serializeDecimal(payment.amount) })),
    },
  };
}

type AdminBookingQuery = {
  search?: string;
  type?: BookingType;
  status?: BookingStatus;
  page: number;
  limit: number;
};

function searchWhere(search?: string) {
  return search
    ? {
        OR: [
          { bookingNumber: { contains: search } },
          { member: { is: { fullName: { contains: search } } } },
          { member: { is: { memberCode: { contains: search } } } },
        ],
      }
    : {};
}

export async function listAdminBookings(query: AdminBookingQuery) {
  const common = {
    ...(query.status ? { status: query.status } : {}),
    ...searchWhere(query.search),
  };

  const [restaurant, room, event] = await Promise.all([
    query.type && query.type !== 'RESTAURANT'
      ? Promise.resolve([])
      : prisma.restaurantBooking.findMany({
          where: common,
          include: {
            member: { select: { id: true, memberCode: true, fullName: true, email: true } },
            restaurant: { select: { id: true, name: true } },
            slot: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        }),
    query.type && query.type !== 'ROOM'
      ? Promise.resolve([])
      : prisma.roomBooking.findMany({
          where: common,
          include: {
            member: { select: { id: true, memberCode: true, fullName: true, email: true } },
            room: { select: { id: true, roomNumber: true, roomName: true, roomType: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        }),
    query.type && query.type !== 'EVENT'
      ? Promise.resolve([])
      : prisma.eventBooking.findMany({
          where: query.search
            ? {
                ...(query.status ? { status: query.status } : {}),
                OR: [
                  { bookingNumber: { contains: query.search } },
                  { ticketNumber: { contains: query.search } },
                  { member: { is: { fullName: { contains: query.search } } } },
                  { member: { is: { memberCode: { contains: query.search } } } },
                ],
              }
            : { ...(query.status ? { status: query.status } : {}) },
          include: {
            member: { select: { id: true, memberCode: true, fullName: true, email: true } },
            event: { select: { id: true, title: true, eventDate: true, startTime: true, venue: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        }),
  ]);

  const items = [
    ...restaurant.map((booking) => ({
      id: booking.id,
      type: 'RESTAURANT' as const,
      bookingNumber: booking.bookingNumber,
      ticketNumber: null,
      serviceName: booking.restaurant.name,
      serviceDate: booking.slot.bookingDate,
      detail: `${booking.slot.startTime}-${booking.slot.endTime} · ${booking.guestCount} guest(s)`,
      amount: null,
      status: booking.status,
      createdAt: booking.createdAt,
      member: booking.member,
      raw: booking,
    })),
    ...room.map((booking) => ({
      id: booking.id,
      type: 'ROOM' as const,
      bookingNumber: booking.bookingNumber,
      ticketNumber: null,
      serviceName: `${booking.room.roomName} (${booking.room.roomNumber})`,
      serviceDate: booking.checkInDate,
      detail: `${booking.numberOfNights} night(s) · ${booking.guestCount} guest(s)`,
      amount: serializeDecimal(booking.totalAmount),
      status: booking.status,
      createdAt: booking.createdAt,
      member: booking.member,
      raw: { ...booking, totalAmount: serializeDecimal(booking.totalAmount) },
    })),
    ...event.map((booking) => ({
      id: booking.id,
      type: 'EVENT' as const,
      bookingNumber: booking.bookingNumber,
      ticketNumber: booking.ticketNumber,
      serviceName: booking.event.title,
      serviceDate: booking.event.eventDate,
      detail: `${booking.ticketQuantity} ticket(s) · ${booking.event.venue}`,
      amount: serializeDecimal(booking.amount),
      status: booking.status,
      createdAt: booking.createdAt,
      member: booking.member,
      raw: { ...booking, amount: serializeDecimal(booking.amount) },
    })),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  const total = items.length;
  const start = (query.page - 1) * query.limit;
  return {
    items: items.slice(start, start + query.limit),
    summary: {
      total,
      pending: items.filter((item) => item.status === BookingStatus.PENDING).length,
      confirmed: items.filter((item) => item.status === BookingStatus.CONFIRMED).length,
      completed: items.filter((item) => item.status === BookingStatus.COMPLETED).length,
      cancelled: items.filter((item) => item.status === BookingStatus.CANCELLED).length,
    },
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function updateAdminBookingStatus(type: BookingType, id: string, status: BookingStatus) {
  if (type === 'RESTAURANT') return updateRestaurantBookingStatus(id, status);
  if (type === 'ROOM') return updateRoomBookingStatus(id, status);
  return updateEventBookingStatus(id, status);
}
