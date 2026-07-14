import type { BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { serializeDecimal } from '../../utils/serializers.js';

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
      include: { event: true, feedback: { select: { id: true, rating: true } } },
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
    })),
  };
}
