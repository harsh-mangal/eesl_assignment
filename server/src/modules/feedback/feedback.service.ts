import { BookingStatus, Prisma, ServiceType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { withSerializableRetry } from '../../utils/transactions.js';

const memberSelect = {
  id: true,
  memberCode: true,
  fullName: true,
  email: true,
} as const;

const feedbackInclude = {
  member: { select: memberSelect },
  restaurantBooking: {
    select: {
      id: true,
      bookingNumber: true,
      status: true,
      restaurant: { select: { id: true, name: true } },
      slot: { select: { bookingDate: true, startTime: true, endTime: true } },
    },
  },
  roomBooking: {
    select: {
      id: true,
      bookingNumber: true,
      status: true,
      checkInDate: true,
      checkOutDate: true,
      room: { select: { id: true, roomNumber: true, roomName: true } },
    },
  },
  eventBooking: {
    select: {
      id: true,
      bookingNumber: true,
      ticketNumber: true,
      status: true,
      event: { select: { id: true, title: true, eventDate: true, venue: true } },
    },
  },
} as const;

function relatedBooking(feedback: {
  serviceType: ServiceType;
  restaurantBooking: null | {
    id: string;
    bookingNumber: string;
    status: BookingStatus;
    restaurant: { id: string; name: string };
    slot: { bookingDate: Date; startTime: string; endTime: string };
  };
  roomBooking: null | {
    id: string;
    bookingNumber: string;
    status: BookingStatus;
    checkInDate: Date;
    checkOutDate: Date;
    room: { id: string; roomNumber: string; roomName: string };
  };
  eventBooking: null | {
    id: string;
    bookingNumber: string;
    ticketNumber: string;
    status: BookingStatus;
    event: { id: string; title: string; eventDate: Date; venue: string };
  };
}) {
  if (feedback.serviceType === ServiceType.RESTAURANT && feedback.restaurantBooking) {
    return {
      id: feedback.restaurantBooking.id,
      bookingNumber: feedback.restaurantBooking.bookingNumber,
      status: feedback.restaurantBooking.status,
      serviceName: feedback.restaurantBooking.restaurant.name,
      serviceId: feedback.restaurantBooking.restaurant.id,
      date: feedback.restaurantBooking.slot.bookingDate,
      detail: `${feedback.restaurantBooking.slot.startTime}-${feedback.restaurantBooking.slot.endTime}`,
    };
  }
  if (feedback.serviceType === ServiceType.ROOM && feedback.roomBooking) {
    return {
      id: feedback.roomBooking.id,
      bookingNumber: feedback.roomBooking.bookingNumber,
      status: feedback.roomBooking.status,
      serviceName: feedback.roomBooking.room.roomName,
      serviceId: feedback.roomBooking.room.id,
      date: feedback.roomBooking.checkInDate,
      detail: `${feedback.roomBooking.room.roomNumber} · ${feedback.roomBooking.checkOutDate.toISOString().slice(0, 10)}`,
    };
  }
  if (feedback.serviceType === ServiceType.EVENT && feedback.eventBooking) {
    return {
      id: feedback.eventBooking.id,
      bookingNumber: feedback.eventBooking.bookingNumber,
      ticketNumber: feedback.eventBooking.ticketNumber,
      status: feedback.eventBooking.status,
      serviceName: feedback.eventBooking.event.title,
      serviceId: feedback.eventBooking.event.id,
      date: feedback.eventBooking.event.eventDate,
      detail: feedback.eventBooking.event.venue,
    };
  }
  return null;
}

function serializeFeedback<T extends {
  id: string;
  memberId: string;
  serviceType: ServiceType;
  rating: number;
  comments: string;
  createdAt: Date;
  member: { id: string; memberCode: string; fullName: string; email: string };
  restaurantBooking: Parameters<typeof relatedBooking>[0]['restaurantBooking'];
  roomBooking: Parameters<typeof relatedBooking>[0]['roomBooking'];
  eventBooking: Parameters<typeof relatedBooking>[0]['eventBooking'];
}>(feedback: T) {
  return {
    id: feedback.id,
    memberId: feedback.memberId,
    serviceType: feedback.serviceType,
    rating: feedback.rating,
    comments: feedback.comments,
    createdAt: feedback.createdAt,
    member: feedback.member,
    relatedBooking: relatedBooking(feedback),
  };
}

async function createRestaurantFeedback(
  transaction: Prisma.TransactionClient,
  memberId: string,
  input: { bookingId: string; rating: number; comments: string },
) {
  const booking = await transaction.restaurantBooking.findFirst({
    where: { id: input.bookingId, memberId },
    select: { id: true, status: true, feedback: { select: { id: true } } },
  });
  if (!booking) throw new ApiError(404, 'Restaurant booking not found.');
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new ApiError(422, 'Feedback can be submitted only for a completed booking.');
  }
  if (booking.feedback) throw new ApiError(409, 'Feedback has already been submitted for this booking.');
  return transaction.feedback.create({
    data: {
      memberId,
      serviceType: ServiceType.RESTAURANT,
      restaurantBookingId: booking.id,
      rating: input.rating,
      comments: input.comments,
    },
    include: feedbackInclude,
  });
}

async function createRoomFeedback(
  transaction: Prisma.TransactionClient,
  memberId: string,
  input: { bookingId: string; rating: number; comments: string },
) {
  const booking = await transaction.roomBooking.findFirst({
    where: { id: input.bookingId, memberId },
    select: { id: true, status: true, feedback: { select: { id: true } } },
  });
  if (!booking) throw new ApiError(404, 'Room booking not found.');
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new ApiError(422, 'Feedback can be submitted only for a completed booking.');
  }
  if (booking.feedback) throw new ApiError(409, 'Feedback has already been submitted for this booking.');
  return transaction.feedback.create({
    data: {
      memberId,
      serviceType: ServiceType.ROOM,
      roomBookingId: booking.id,
      rating: input.rating,
      comments: input.comments,
    },
    include: feedbackInclude,
  });
}

async function createEventFeedback(
  transaction: Prisma.TransactionClient,
  memberId: string,
  input: { bookingId: string; rating: number; comments: string },
) {
  const booking = await transaction.eventBooking.findFirst({
    where: { id: input.bookingId, memberId },
    select: { id: true, status: true, feedback: { select: { id: true } } },
  });
  if (!booking) throw new ApiError(404, 'Event booking not found.');
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new ApiError(422, 'Feedback can be submitted only for a completed booking.');
  }
  if (booking.feedback) throw new ApiError(409, 'Feedback has already been submitted for this booking.');
  return transaction.feedback.create({
    data: {
      memberId,
      serviceType: ServiceType.EVENT,
      eventBookingId: booking.id,
      rating: input.rating,
      comments: input.comments,
    },
    include: feedbackInclude,
  });
}

export async function createOwnFeedback(
  memberId: string,
  input: { serviceType: ServiceType; bookingId: string; rating: number; comments: string },
) {
  try {
    const feedback = await withSerializableRetry(async (transaction) => {
      if (input.serviceType === ServiceType.RESTAURANT) {
        return createRestaurantFeedback(transaction, memberId, input);
      }
      if (input.serviceType === ServiceType.ROOM) {
        return createRoomFeedback(transaction, memberId, input);
      }
      return createEventFeedback(transaction, memberId, input);
    });
    return serializeFeedback(feedback);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError(409, 'Feedback has already been submitted for this booking.');
    }
    throw error;
  }
}

export async function listOwnFeedback(memberId: string, serviceType?: ServiceType) {
  const items = await prisma.feedback.findMany({
    where: { memberId, ...(serviceType ? { serviceType } : {}) },
    include: feedbackInclude,
    orderBy: { createdAt: 'desc' },
  });
  return items.map(serializeFeedback);
}

export async function listAdminFeedback(query: {
  search?: string;
  serviceType?: ServiceType;
  rating?: number;
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;
  const where: Prisma.FeedbackWhereInput = {
    ...(query.serviceType ? { serviceType: query.serviceType } : {}),
    ...(query.rating ? { rating: query.rating } : {}),
    ...(query.search
      ? {
          OR: [
            { comments: { contains: query.search } },
            { member: { is: { fullName: { contains: query.search } } } },
            { member: { is: { memberCode: { contains: query.search } } } },
            { restaurantBooking: { is: { bookingNumber: { contains: query.search } } } },
            { roomBooking: { is: { bookingNumber: { contains: query.search } } } },
            { eventBooking: { is: { bookingNumber: { contains: query.search } } } },
          ],
        }
      : {}),
  };

  const [items, total, average, ratingGroups, serviceGroups] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: feedbackInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.feedback.count({ where }),
    prisma.feedback.aggregate({ where, _avg: { rating: true } }),
    prisma.feedback.groupBy({ where, by: ['rating'], _count: { rating: true }, orderBy: { rating: 'asc' } }),
    prisma.feedback.groupBy({ where, by: ['serviceType'], _count: { serviceType: true } }),
  ]);

  return {
    items: items.map(serializeFeedback),
    summary: {
      total,
      averageRating: Number((average._avg.rating ?? 0).toFixed(1)),
      ratingDistribution: [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: ratingGroups.find((item) => item.rating === rating)?._count.rating ?? 0,
      })),
      byService: [ServiceType.RESTAURANT, ServiceType.ROOM, ServiceType.EVENT].map((serviceType) => ({
        serviceType,
        count: serviceGroups.find((item) => item.serviceType === serviceType)?._count.serviceType ?? 0,
      })),
    },
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}
