import {
  BookingStatus,
  EventStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  QrStatus,
  QrType,
  type Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { dateOnlyKey, parseDateOnly, startOfToday } from '../../utils/dates.js';
import { ensureMemberCanBook } from '../../utils/member-eligibility.js';
import { serializeDecimal } from '../../utils/serializers.js';
import { withSerializableRetry } from '../../utils/transactions.js';

const activeBookingStatuses = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

function serializeEvent<T extends { ticketPrice: Prisma.Decimal }>(event: T) {
  return { ...event, ticketPrice: serializeDecimal(event.ticketPrice) };
}

function serializeBooking<T extends {
  amount: Prisma.Decimal;
  event: { ticketPrice: Prisma.Decimal };
  payments?: Array<{ amount: Prisma.Decimal }>;
}>(booking: T) {
  return {
    ...booking,
    amount: serializeDecimal(booking.amount),
    event: serializeEvent(booking.event),
    ...(booking.payments
      ? { payments: booking.payments.map((payment) => ({ ...payment, amount: serializeDecimal(payment.amount) })) }
      : {}),
  };
}

export async function listMemberEvents(query: {
  filter: 'ALL' | 'FREE' | 'PAID' | 'UPCOMING';
  category?: string;
  search?: string;
}) {
  const today = startOfToday();
  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      eventDate: { gte: today },
      ...(query.category ? { category: query.category } : {}),
      ...(query.filter === 'FREE' ? { ticketPrice: 0 } : {}),
      ...(query.filter === 'PAID' ? { ticketPrice: { gt: 0 } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search } },
              { description: { contains: query.search } },
              { venue: { contains: query.search } },
              { category: { contains: query.search } },
            ],
          }
        : {}),
    },
    orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }],
  });

  const categories = await prisma.event.findMany({
    where: { status: EventStatus.PUBLISHED, eventDate: { gte: today } },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' },
  });

  return { items: events.map(serializeEvent), categories: categories.map((item) => item.category) };
}

export async function getMemberEvent(id: string) {
  const event = await prisma.event.findFirst({
    where: { id, status: EventStatus.PUBLISHED, eventDate: { gte: startOfToday() } },
  });
  if (!event) throw new ApiError(404, 'Event not found, unpublished or already completed.');
  return serializeEvent(event);
}

export async function createEventBooking(
  memberId: string,
  eventId: string,
  input: { ticketQuantity: number; paymentMethod?: PaymentMethod },
) {
  return withSerializableRetry(async (transaction) => {
    await ensureMemberCanBook(transaction, memberId);
    const event = await transaction.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, 'Event not found.');
    if (event.status !== EventStatus.PUBLISHED) throw new ApiError(409, 'This event is not available for booking.');
    if (event.eventDate < startOfToday()) throw new ApiError(409, 'This event has already passed.');
    if (input.ticketQuantity > event.availableSeats) throw new ApiError(409, 'Not enough event seats are available.');

    const seatUpdate = await transaction.event.updateMany({
      where: {
        id: event.id,
        status: EventStatus.PUBLISHED,
        availableSeats: { gte: input.ticketQuantity },
      },
      data: { availableSeats: { decrement: input.ticketQuantity } },
    });
    if (seatUpdate.count !== 1) throw new ApiError(409, 'Event availability changed. Please refresh and try again.');

    const amount = Number(event.ticketPrice) * input.ticketQuantity;
    const suffix = randomUUID().split('-')[0].toUpperCase();
    const bookingNumber = `EVT-${Date.now()}-${suffix}`;
    const ticketNumber = `TKT-${Date.now()}-${randomUUID().split('-')[0].toUpperCase()}`;
    const qrToken = `QR-${ticketNumber}-${randomUUID()}`;

    const booking = await transaction.eventBooking.create({
      data: {
        bookingNumber,
        ticketNumber,
        memberId,
        eventId: event.id,
        ticketQuantity: input.ticketQuantity,
        amount,
        status: BookingStatus.CONFIRMED,
        qrToken,
      },
      include: {
        event: true,
        member: { select: { id: true, fullName: true, memberCode: true, email: true } },
        payments: true,
      },
    });

    await transaction.qrToken.create({
      data: {
        token: qrToken,
        type: QrType.EVENT_TICKET,
        status: QrStatus.ACTIVE,
        memberId,
        referenceId: booking.id,
        expiresAt: new Date(`${dateOnlyKey(event.eventDate)}T23:59:59.999Z`),
      },
    });

    const method = input.paymentMethod && input.paymentMethod !== PaymentMethod.CASH
      ? input.paymentMethod
      : PaymentMethod.SIMULATED;
    const payment = amount > 0
      ? await transaction.payment.create({
          data: {
            transactionId: `TXN-${Date.now()}-${randomUUID().split('-')[0].toUpperCase()}`,
            memberId,
            eventBookingId: booking.id,
            amount,
            paymentMethod: method,
            paymentType: PaymentType.EVENT_BOOKING,
            status: PaymentStatus.SUCCESS,
          },
        })
      : null;

    return {
      booking: serializeBooking(booking),
      payment: payment ? { ...payment, amount: serializeDecimal(payment.amount) } : null,
      receipt: {
        paid: amount > 0,
        amount,
        description: `${input.ticketQuantity} ticket(s) for ${event.title}`,
      },
    };
  });
}

async function cancelInsideTransaction(transaction: Prisma.TransactionClient, bookingId: string) {
  const booking = await transaction.eventBooking.findUnique({
    where: { id: bookingId },
    include: { event: true, payments: true },
  });
  if (!booking) throw new ApiError(404, 'Event booking not found.');
  if (!activeBookingStatuses.includes(booking.status)) {
    throw new ApiError(409, 'Only pending or confirmed tickets can be cancelled.');
  }
  if (booking.checkedInAt) throw new ApiError(409, 'A checked-in ticket cannot be cancelled.');

  const updated = await transaction.eventBooking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.CANCELLED },
    include: { event: true, payments: true },
  });
  await transaction.event.update({
    where: { id: booking.eventId },
    data: { availableSeats: { increment: booking.ticketQuantity } },
  });
  await transaction.qrToken.updateMany({
    where: { token: booking.qrToken },
    data: { status: QrStatus.CANCELLED },
  });
  await transaction.payment.updateMany({
    where: { eventBookingId: booking.id, status: PaymentStatus.SUCCESS },
    data: { status: PaymentStatus.REFUNDED },
  });
  return serializeBooking(updated);
}

export async function cancelOwnEventBooking(memberId: string, id: string) {
  return withSerializableRetry(async (transaction) => {
    const owned = await transaction.eventBooking.findFirst({ where: { id, memberId }, select: { id: true } });
    if (!owned) throw new ApiError(404, 'Event booking not found.');
    return cancelInsideTransaction(transaction, owned.id);
  });
}

export async function listAdminEvents(query: { search?: string; category?: string; status?: EventStatus }) {
  const items = await prisma.event.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.search
        ? { OR: [{ title: { contains: query.search } }, { venue: { contains: query.search } }, { category: { contains: query.search } }] }
        : {}),
    },
    include: { _count: { select: { bookings: true } } },
    orderBy: [{ eventDate: 'desc' }, { startTime: 'asc' }],
  });
  return { items: items.map(serializeEvent) };
}

export async function createEvent(input: {
  title: string;
  description: string;
  category: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  ticketPrice: number;
  totalCapacity: number;
  status: EventStatus;
  bannerUrl?: string;
}) {
  const eventDate = parseDateOnly(input.eventDate, 'Event date');
  if (eventDate < startOfToday()) throw new ApiError(422, 'Event date cannot be in the past.');
  if (input.startTime >= input.endTime) throw new ApiError(422, 'End time must be after start time.');
  const event = await prisma.event.create({
    data: {
      ...input,
      eventDate,
      availableSeats: input.totalCapacity,
      bannerUrl: input.bannerUrl || null,
    },
    include: { _count: { select: { bookings: true } } },
  });
  return serializeEvent(event);
}

export async function updateEvent(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    category: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    venue: string;
    ticketPrice: number;
    totalCapacity: number;
    status: EventStatus;
    bannerUrl: string;
  }>,
) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new ApiError(404, 'Event not found.');
  const soldSeats = event.totalCapacity - event.availableSeats;
  const nextCapacity = input.totalCapacity ?? event.totalCapacity;
  if (nextCapacity < soldSeats) throw new ApiError(422, `Capacity cannot be lower than sold tickets (${soldSeats}).`);
  const nextStart = input.startTime ?? event.startTime;
  const nextEnd = input.endTime ?? event.endTime;
  if (nextStart >= nextEnd) throw new ApiError(422, 'End time must be after start time.');
  const eventDate = input.eventDate ? parseDateOnly(input.eventDate, 'Event date') : undefined;
  const nextStatus = input.status ?? event.status;
  if (eventDate && eventDate < startOfToday() && ![EventStatus.COMPLETED, EventStatus.CANCELLED].includes(nextStatus)) {
    throw new ApiError(422, 'A current or bookable event cannot be moved to a past date.');
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...input,
      ...(eventDate ? { eventDate } : {}),
      ...(input.totalCapacity !== undefined ? { availableSeats: nextCapacity - soldSeats } : {}),
      ...(input.bannerUrl === '' ? { bannerUrl: null } : {}),
    },
    include: { _count: { select: { bookings: true } } },
  });
  return serializeEvent(updated);
}

export async function listAdminEventBookings(query: {
  search?: string;
  eventId?: string;
  status?: BookingStatus;
  checkedIn?: boolean;
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;
  const where = {
    ...(query.eventId ? { eventId: query.eventId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.checkedIn !== undefined ? { checkedInAt: query.checkedIn ? { not: null } : null } : {}),
    ...(query.search
      ? {
          OR: [
            { bookingNumber: { contains: query.search } },
            { ticketNumber: { contains: query.search } },
            { member: { is: { fullName: { contains: query.search } } } },
            { member: { is: { memberCode: { contains: query.search } } } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.eventBooking.findMany({
      where,
      include: {
        event: true,
        member: { select: { id: true, fullName: true, memberCode: true, email: true } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.eventBooking.count({ where }),
  ]);
  return {
    items: items.map(serializeBooking),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function updateEventBookingStatus(id: string, status: BookingStatus) {
  if (status === BookingStatus.CANCELLED) {
    return withSerializableRetry((transaction) => cancelInsideTransaction(transaction, id));
  }
  const booking = await prisma.eventBooking.findUnique({ where: { id }, include: { event: true, payments: true } });
  if (!booking) throw new ApiError(404, 'Event booking not found.');
  if (booking.status === BookingStatus.CANCELLED) throw new ApiError(409, 'Cancelled tickets cannot be reopened.');
  if (booking.status === BookingStatus.COMPLETED && status !== BookingStatus.COMPLETED) {
    throw new ApiError(409, 'Completed tickets cannot be reopened.');
  }
  if (booking.checkedInAt && status !== BookingStatus.COMPLETED) {
    throw new ApiError(409, 'A checked-in ticket must remain completed.');
  }
  const updated = await prisma.eventBooking.update({
    where: { id },
    data: { status },
    include: { event: true, payments: true },
  });
  return serializeBooking(updated);
}

export async function replaceEventBanner(id: string, bannerUrl: string) {
  const existing = await prisma.event.findUnique({ where: { id }, select: { bannerUrl: true } });
  if (!existing) throw new ApiError(404, 'Event not found.');
  const event = await prisma.event.update({
    where: { id },
    data: { bannerUrl },
    include: { _count: { select: { bookings: true } } },
  });
  return { data: serializeEvent(event), previousUrl: existing.bannerUrl };
}
