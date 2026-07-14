import {
  AccountStatus,
  BookingStatus,
  EventStatus,
  InvoiceStatus,
  MembershipStatus,
  PaymentStatus,
  RfidStatus,
  RoomStatus,
} from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { serializeDecimal } from '../../utils/serializers.js';

export async function getMemberDashboard(memberId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { membership: true, rfidRecord: true },
  });
  if (!member) throw new ApiError(404, 'Member profile not found.');

  const [outstanding, restaurantBookings, roomBookings, eventBookings, unreadNotifications] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: { memberId, status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] } },
        _sum: { amount: true },
      }),
      prisma.restaurantBooking.count({
        where: {
          memberId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          slot: { bookingDate: { gte: today } },
        },
      }),
      prisma.roomBooking.count({
        where: {
          memberId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          checkInDate: { gte: today },
        },
      }),
      prisma.eventBooking.count({
        where: {
          memberId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          event: { eventDate: { gte: today }, status: EventStatus.PUBLISHED },
        },
      }),
      prisma.notificationRecipient.count({ where: { memberId, isRead: false } }),
    ]);

  return {
    member: {
      fullName: member.fullName,
      profilePhotoUrl: member.profilePhotoUrl,
      memberCode: member.memberCode,
    },
    membership: member.membership,
    rfid: member.rfidRecord,
    summary: {
      outstandingInvoiceAmount: serializeDecimal(outstanding._sum.amount),
      upcomingBookings: restaurantBookings + roomBookings + eventBookings,
      upcomingEvents: eventBookings,
      unreadNotifications,
    },
  };
}

export async function getAdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalMembers,
    activeMembers,
    inactiveMembers,
    activeRfid,
    blockedRfid,
    totalRestaurants,
    availableSlots,
    availableRooms,
    unavailableRooms,
    upcomingEvents,
    restaurantBookingsToday,
    roomBookingsToday,
    eventBookingsToday,
    pendingInvoices,
    successfulPayments,
    totalPayments,
    feedbackAverage,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.membership.count({ where: { status: MembershipStatus.ACTIVE } }),
    prisma.membership.count({ where: { status: { not: MembershipStatus.ACTIVE } } }),
    prisma.rfidRecord.count({ where: { status: RfidStatus.ACTIVE } }),
    prisma.rfidRecord.count({ where: { status: RfidStatus.BLOCKED } }),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.restaurantSlot.count({
      where: { bookingDate: { gte: today }, isAvailable: true, restaurant: { isActive: true } },
    }),
    prisma.room.count({ where: { status: RoomStatus.AVAILABLE } }),
    prisma.room.count({ where: { status: { not: RoomStatus.AVAILABLE } } }),
    prisma.event.count({ where: { eventDate: { gte: today }, status: EventStatus.PUBLISHED } }),
    prisma.restaurantBooking.count({
      where: { createdAt: { gte: today, lt: tomorrow }, status: { not: BookingStatus.CANCELLED } },
    }),
    prisma.roomBooking.count({
      where: { createdAt: { gte: today, lt: tomorrow }, status: { not: BookingStatus.CANCELLED } },
    }),
    prisma.eventBooking.count({
      where: { createdAt: { gte: today, lt: tomorrow }, status: { not: BookingStatus.CANCELLED } },
    }),
    prisma.invoice.count({ where: { status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] } } }),
    prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    }),
    prisma.feedback.aggregate({ _avg: { rating: true } }),
  ]);

  return {
    statistics: {
      totalMembers,
      activeMembers,
      inactiveMembers,
      activeRfidCards: activeRfid,
      blockedRfidCards: blockedRfid,
      totalRestaurants,
      availableRestaurantSlots: availableSlots,
      availableRooms,
      unavailableRooms,
      upcomingEvents,
      todaysBookings: restaurantBookingsToday + roomBookingsToday + eventBookingsToday,
      pendingInvoices,
      successfulPayments,
      totalPaymentAmount: serializeDecimal(totalPayments._sum.amount),
      averageFeedbackRating: Number((feedbackAverage._avg.rating ?? 0).toFixed(1)),
      activeAccounts: await prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
    },
    charts: {
      bookingsByService: [
        { label: 'Restaurant', value: await prisma.restaurantBooking.count() },
        { label: 'Room', value: await prisma.roomBooking.count() },
        { label: 'Event', value: await prisma.eventBooking.count() },
      ],
      memberStatus: [
        { label: 'Active', value: activeMembers },
        { label: 'Inactive', value: inactiveMembers },
      ],
    },
  };
}
