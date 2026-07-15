import {
  BookingStatus,
  EventStatus,
  InvoiceStatus,
  MembershipStatus,
  PaymentStatus,
  RfidStatus,
  RoomStatus,
  ServiceType,
} from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { parseDateOnly } from '../../utils/dates.js';
import { serializeDecimal } from '../../utils/serializers.js';
import { reportTypes } from './report.validation.js';

export type ReportType = (typeof reportTypes)[number];
export type ReportQuery = {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

type ReportFormat = 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'percent';
type ReportColumn = { key: string; label: string; format?: ReportFormat; align?: 'left' | 'right' | 'center' };
type ReportSummary = { label: string; value: string | number; format?: ReportFormat };
type ReportRow = Record<string, string | number | null>;

type ReportResult = {
  reportType: ReportType;
  title: string;
  description: string;
  generatedAt: Date;
  dateRange: { from: string | null; to: string | null };
  summary: ReportSummary[];
  breakdown: Array<{ label: string; value: number }>;
  columns: ReportColumn[];
  rows: ReportRow[];
};

function dateRange(query: ReportQuery, fieldName: string) {
  const from = query.dateFrom ? parseDateOnly(query.dateFrom, `${fieldName} start date`) : undefined;
  const to = query.dateTo ? parseDateOnly(query.dateTo, `${fieldName} end date`) : undefined;
  if (to) to.setUTCHours(23, 59, 59, 999);
  return { from, to, filter: from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined };
}

function responseBase(
  reportType: ReportType,
  title: string,
  description: string,
  query: ReportQuery,
): Pick<ReportResult, 'reportType' | 'title' | 'description' | 'generatedAt' | 'dateRange'> {
  return {
    reportType,
    title,
    description,
    generatedAt: new Date(),
    dateRange: { from: query.dateFrom ?? null, to: query.dateTo ?? null },
  };
}

function includesSearch(search: string | undefined, values: Array<string | null | undefined>) {
  if (!search) return true;
  const needle = search.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(needle));
}

function percentage(part: number, total: number) {
  return total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0;
}

async function memberReport(query: ReportQuery): Promise<ReportResult> {
  const range = dateRange(query, 'Member');
  const allowedStatuses = Object.values(MembershipStatus) as string[];
  if (query.status && !allowedStatuses.includes(query.status)) throw new ApiError(422, 'Invalid membership status filter.');

  const members = await prisma.member.findMany({
    where: {
      ...(range.filter ? { createdAt: range.filter } : {}),
      ...(query.status ? { membership: { is: { status: query.status as MembershipStatus } } } : {}),
      ...(query.search ? {
        OR: [
          { memberCode: { contains: query.search } },
          { fullName: { contains: query.search } },
          { email: { contains: query.search } },
          { mobileNumber: { contains: query.search } },
        ],
      } : {}),
    },
    include: {
      user: { select: { status: true } },
      membership: true,
      rfidRecord: { select: { status: true } },
      _count: { select: { restaurantBookings: true, roomBookings: true, eventBookings: true, invoices: true, payments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const active = members.filter((item) => item.membership?.status === MembershipStatus.ACTIVE).length;
  const inactive = members.filter((item) => item.membership?.status === MembershipStatus.INACTIVE).length;
  const expired = members.filter((item) => item.membership?.status === MembershipStatus.EXPIRED).length;
  const rows = members.map((member) => ({
    memberCode: member.memberCode,
    fullName: member.fullName,
    email: member.email,
    mobileNumber: member.mobileNumber,
    membershipType: member.membership?.membershipType ?? '—',
    membershipStatus: member.membership?.status ?? '—',
    validUntil: member.membership?.validUntil?.toISOString() ?? null,
    rfidStatus: member.rfidRecord?.status ?? 'NOT_ASSIGNED',
    accountStatus: member.user?.status ?? '—',
    totalBookings: member._count.restaurantBookings + member._count.roomBookings + member._count.eventBookings,
    invoices: member._count.invoices,
    payments: member._count.payments,
    joinedAt: member.createdAt.toISOString(),
  }));

  return {
    ...responseBase('MEMBERS', 'Member Report', 'Membership, account, RFID and activity overview for registered members.', query),
    summary: [
      { label: 'Members', value: members.length, format: 'number' },
      { label: 'Active memberships', value: active, format: 'number' },
      { label: 'Inactive / expired', value: inactive + expired, format: 'number' },
      { label: 'Active rate', value: percentage(active, members.length), format: 'percent' },
    ],
    breakdown: [
      { label: 'Active', value: active },
      { label: 'Inactive', value: inactive },
      { label: 'Expired', value: expired },
    ],
    columns: [
      { key: 'memberCode', label: 'Member ID' },
      { key: 'fullName', label: 'Member' },
      { key: 'email', label: 'Email' },
      { key: 'mobileNumber', label: 'Mobile' },
      { key: 'membershipType', label: 'Membership' },
      { key: 'membershipStatus', label: 'Status' },
      { key: 'validUntil', label: 'Valid until', format: 'date' },
      { key: 'rfidStatus', label: 'RFID' },
      { key: 'totalBookings', label: 'Bookings', format: 'number', align: 'right' },
      { key: 'invoices', label: 'Invoices', format: 'number', align: 'right' },
      { key: 'payments', label: 'Payments', format: 'number', align: 'right' },
      { key: 'joinedAt', label: 'Joined', format: 'date' },
    ],
    rows,
  };
}

async function bookingReport(query: ReportQuery): Promise<ReportResult> {
  const range = dateRange(query, 'Booking');
  const allowedStatuses = Object.values(BookingStatus) as string[];
  if (query.status && !allowedStatuses.includes(query.status)) throw new ApiError(422, 'Invalid booking status filter.');
  const commonWhere = {
    ...(range.filter ? { createdAt: range.filter } : {}),
    ...(query.status ? { status: query.status as BookingStatus } : {}),
  };

  const [restaurants, rooms, events] = await Promise.all([
    prisma.restaurantBooking.findMany({
      where: commonWhere,
      include: {
        member: { select: { memberCode: true, fullName: true } },
        restaurant: { select: { name: true } },
        slot: { select: { bookingDate: true, startTime: true } },
      },
    }),
    prisma.roomBooking.findMany({
      where: commonWhere,
      include: { member: { select: { memberCode: true, fullName: true } }, room: { select: { roomNumber: true, roomName: true } } },
    }),
    prisma.eventBooking.findMany({
      where: commonWhere,
      include: { member: { select: { memberCode: true, fullName: true } }, event: { select: { title: true, eventDate: true } } },
    }),
  ]);

  const rows: ReportRow[] = [
    ...restaurants.map((booking) => ({
      serviceType: 'Restaurant',
      bookingNumber: booking.bookingNumber,
      memberCode: booking.member.memberCode,
      memberName: booking.member.fullName,
      serviceName: booking.restaurant.name,
      serviceDate: booking.slot.bookingDate.toISOString(),
      units: booking.guestCount,
      amount: 0,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    })),
    ...rooms.map((booking) => ({
      serviceType: 'Room',
      bookingNumber: booking.bookingNumber,
      memberCode: booking.member.memberCode,
      memberName: booking.member.fullName,
      serviceName: `${booking.room.roomName} (${booking.room.roomNumber})`,
      serviceDate: booking.checkInDate.toISOString(),
      units: booking.numberOfNights,
      amount: serializeDecimal(booking.totalAmount),
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    })),
    ...events.map((booking) => ({
      serviceType: 'Event',
      bookingNumber: booking.bookingNumber,
      memberCode: booking.member.memberCode,
      memberName: booking.member.fullName,
      serviceName: booking.event.title,
      serviceDate: booking.event.eventDate.toISOString(),
      units: booking.ticketQuantity,
      amount: serializeDecimal(booking.amount),
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    })),
  ].filter((row) => includesSearch(query.search, [String(row.bookingNumber), String(row.memberCode), String(row.memberName), String(row.serviceName)]));

  rows.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  const completed = rows.filter((item) => item.status === BookingStatus.COMPLETED).length;
  const cancelled = rows.filter((item) => item.status === BookingStatus.CANCELLED).length;
  const confirmed = rows.filter((item) => item.status === BookingStatus.CONFIRMED).length;
  const totalAmount = rows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  return {
    ...responseBase('BOOKINGS', 'Consolidated Booking Report', 'Restaurant, room and event bookings in one operational view.', query),
    summary: [
      { label: 'Bookings', value: rows.length, format: 'number' },
      { label: 'Confirmed', value: confirmed, format: 'number' },
      { label: 'Completed', value: completed, format: 'number' },
      { label: 'Booked value', value: totalAmount, format: 'currency' },
    ],
    breakdown: [
      { label: 'Restaurant', value: rows.filter((item) => item.serviceType === 'Restaurant').length },
      { label: 'Room', value: rows.filter((item) => item.serviceType === 'Room').length },
      { label: 'Event', value: rows.filter((item) => item.serviceType === 'Event').length },
      { label: 'Cancelled', value: cancelled },
    ],
    columns: [
      { key: 'serviceType', label: 'Service' },
      { key: 'bookingNumber', label: 'Booking number' },
      { key: 'memberCode', label: 'Member ID' },
      { key: 'memberName', label: 'Member' },
      { key: 'serviceName', label: 'Service name' },
      { key: 'serviceDate', label: 'Service date', format: 'date' },
      { key: 'units', label: 'Guests / units', format: 'number', align: 'right' },
      { key: 'amount', label: 'Amount', format: 'currency', align: 'right' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Booked at', format: 'datetime' },
    ],
    rows,
  };
}

async function paymentReport(query: ReportQuery): Promise<ReportResult> {
  const range = dateRange(query, 'Payment');
  const allowedStatuses = Object.values(PaymentStatus) as string[];
  if (query.status && !allowedStatuses.includes(query.status)) throw new ApiError(422, 'Invalid payment status filter.');
  const payments = await prisma.payment.findMany({
    where: {
      ...(range.filter ? { paidAt: range.filter } : {}),
      ...(query.status ? { status: query.status as PaymentStatus } : {}),
      ...(query.search ? {
        OR: [
          { transactionId: { contains: query.search } },
          { member: { is: { memberCode: { contains: query.search } } } },
          { member: { is: { fullName: { contains: query.search } } } },
        ],
      } : {}),
    },
    include: {
      member: { select: { memberCode: true, fullName: true } },
      invoice: { select: { invoiceNumber: true } },
      roomBooking: { select: { bookingNumber: true } },
      eventBooking: { select: { bookingNumber: true } },
    },
    orderBy: { paidAt: 'desc' },
  });
  const rows = payments.map((payment) => ({
    transactionId: payment.transactionId,
    memberCode: payment.member.memberCode,
    memberName: payment.member.fullName,
    paymentType: payment.paymentType,
    relatedRecord: payment.invoice?.invoiceNumber ?? payment.roomBooking?.bookingNumber ?? payment.eventBooking?.bookingNumber ?? '—',
    amount: serializeDecimal(payment.amount),
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    paidAt: payment.paidAt.toISOString(),
  }));
  const successful = rows.filter((item) => item.status === PaymentStatus.SUCCESS);
  const refunded = rows.filter((item) => item.status === PaymentStatus.REFUNDED);
  const collected = successful.reduce((sum, item) => sum + item.amount, 0);

  return {
    ...responseBase('PAYMENTS', 'Payment Report', 'Transaction-level collections, refunds, methods and related records.', query),
    summary: [
      { label: 'Transactions', value: rows.length, format: 'number' },
      { label: 'Successful', value: successful.length, format: 'number' },
      { label: 'Collected', value: collected, format: 'currency' },
      { label: 'Refunded', value: refunded.reduce((sum, item) => sum + item.amount, 0), format: 'currency' },
    ],
    breakdown: ['UPI', 'CARD', 'SIMULATED', 'CASH'].map((method) => ({
      label: method,
      value: rows.filter((item) => item.paymentMethod === method).length,
    })),
    columns: [
      { key: 'transactionId', label: 'Transaction ID' },
      { key: 'memberCode', label: 'Member ID' },
      { key: 'memberName', label: 'Member' },
      { key: 'paymentType', label: 'Type' },
      { key: 'relatedRecord', label: 'Related record' },
      { key: 'amount', label: 'Amount', format: 'currency', align: 'right' },
      { key: 'paymentMethod', label: 'Method' },
      { key: 'status', label: 'Status' },
      { key: 'paidAt', label: 'Payment date', format: 'datetime' },
    ],
    rows,
  };
}

async function roomAvailabilityReport(query: ReportQuery): Promise<ReportResult> {
  const range = dateRange(query, 'Room availability');
  const allowedStatuses = Object.values(RoomStatus) as string[];
  if (query.status && !allowedStatuses.includes(query.status)) throw new ApiError(422, 'Invalid room status filter.');
  const rooms = await prisma.room.findMany({
    where: {
      ...(query.status ? { status: query.status as RoomStatus } : {}),
      ...(query.search ? { OR: [{ roomNumber: { contains: query.search } }, { roomName: { contains: query.search } }, { roomType: { contains: query.search } }] } : {}),
    },
    include: {
      bookings: {
        where: {
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          ...(range.from && range.to ? { checkInDate: { lt: range.to }, checkOutDate: { gt: range.from } } : {}),
          ...(range.from && !range.to ? { checkOutDate: { gt: range.from } } : {}),
          ...(!range.from && range.to ? { checkInDate: { lt: range.to } } : {}),
        },
        select: { id: true, checkInDate: true, checkOutDate: true },
      },
    },
    orderBy: { roomNumber: 'asc' },
  });
  const rows = rooms.map((room) => {
    const rangeAvailability = room.status === RoomStatus.AVAILABLE && room.bookings.length === 0 ? 'AVAILABLE' : room.status === RoomStatus.AVAILABLE ? 'BOOKED' : room.status;
    return {
      roomNumber: room.roomNumber,
      roomName: room.roomName,
      roomType: room.roomType,
      pricePerNight: serializeDecimal(room.pricePerNight),
      guestCapacity: room.guestCapacity,
      masterStatus: room.status,
      rangeAvailability,
      overlappingBookings: room.bookings.length,
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : String(room.amenities ?? ''),
    };
  });
  const available = rows.filter((item) => item.rangeAvailability === 'AVAILABLE').length;
  const booked = rows.filter((item) => item.rangeAvailability === 'BOOKED').length;
  const maintenance = rows.filter((item) => item.masterStatus === RoomStatus.MAINTENANCE).length;
  const unavailable = rows.filter((item) => item.masterStatus === RoomStatus.UNAVAILABLE).length;

  return {
    ...responseBase('ROOM_AVAILABILITY', 'Room Availability Report', 'Room inventory, operational status and booking overlap for the selected period.', query),
    summary: [
      { label: 'Rooms', value: rows.length, format: 'number' },
      { label: 'Available in range', value: available, format: 'number' },
      { label: 'Booked in range', value: booked, format: 'number' },
      { label: 'Maintenance / unavailable', value: maintenance + unavailable, format: 'number' },
    ],
    breakdown: [
      { label: 'Available', value: available },
      { label: 'Booked', value: booked },
      { label: 'Maintenance', value: maintenance },
      { label: 'Unavailable', value: unavailable },
    ],
    columns: [
      { key: 'roomNumber', label: 'Room number' },
      { key: 'roomName', label: 'Room name' },
      { key: 'roomType', label: 'Type' },
      { key: 'pricePerNight', label: 'Nightly price', format: 'currency', align: 'right' },
      { key: 'guestCapacity', label: 'Guests', format: 'number', align: 'right' },
      { key: 'masterStatus', label: 'Master status' },
      { key: 'rangeAvailability', label: 'Range availability' },
      { key: 'overlappingBookings', label: 'Overlaps', format: 'number', align: 'right' },
      { key: 'amenities', label: 'Amenities' },
    ],
    rows,
  };
}

async function restaurantBookingReport(query: ReportQuery): Promise<ReportResult> {
  const range = dateRange(query, 'Restaurant booking');
  const allowedStatuses = Object.values(BookingStatus) as string[];
  if (query.status && !allowedStatuses.includes(query.status)) throw new ApiError(422, 'Invalid booking status filter.');
  const bookings = await prisma.restaurantBooking.findMany({
    where: {
      ...(query.status ? { status: query.status as BookingStatus } : {}),
      ...(range.filter ? { slot: { is: { bookingDate: range.filter } } } : {}),
      ...(query.search ? {
        OR: [
          { bookingNumber: { contains: query.search } },
          { member: { is: { memberCode: { contains: query.search } } } },
          { member: { is: { fullName: { contains: query.search } } } },
          { restaurant: { is: { name: { contains: query.search } } } },
        ],
      } : {}),
    },
    include: {
      member: { select: { memberCode: true, fullName: true } },
      restaurant: { select: { name: true } },
      slot: { select: { bookingDate: true, startTime: true, endTime: true, capacity: true, bookedCapacity: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const rows = bookings.map((booking) => ({
    bookingNumber: booking.bookingNumber,
    memberCode: booking.member.memberCode,
    memberName: booking.member.fullName,
    restaurant: booking.restaurant.name,
    bookingDate: booking.slot.bookingDate.toISOString(),
    timeSlot: `${booking.slot.startTime}-${booking.slot.endTime}`,
    guests: booking.guestCount,
    slotCapacity: booking.slot.capacity,
    remainingCapacity: Math.max(0, booking.slot.capacity - booking.slot.bookedCapacity),
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  }));
  const confirmed = rows.filter((item) => item.status === BookingStatus.CONFIRMED).length;
  const completed = rows.filter((item) => item.status === BookingStatus.COMPLETED).length;
  const cancelled = rows.filter((item) => item.status === BookingStatus.CANCELLED).length;

  return {
    ...responseBase('RESTAURANT_BOOKINGS', 'Restaurant Booking Report', 'Reservation volume, guests, slots and remaining capacity.', query),
    summary: [
      { label: 'Reservations', value: rows.length, format: 'number' },
      { label: 'Guests', value: rows.reduce((sum, item) => sum + item.guests, 0), format: 'number' },
      { label: 'Confirmed / completed', value: confirmed + completed, format: 'number' },
      { label: 'Cancelled', value: cancelled, format: 'number' },
    ],
    breakdown: Array.from(new Set<string>(rows.map((item) => String(item.restaurant)) as string[])).map((restaurant) => ({
      label: restaurant,
      value: rows.filter((item) => item.restaurant === restaurant).length,
    })),
    columns: [
      { key: 'bookingNumber', label: 'Booking number' },
      { key: 'memberCode', label: 'Member ID' },
      { key: 'memberName', label: 'Member' },
      { key: 'restaurant', label: 'Restaurant' },
      { key: 'bookingDate', label: 'Booking date', format: 'date' },
      { key: 'timeSlot', label: 'Time slot' },
      { key: 'guests', label: 'Guests', format: 'number', align: 'right' },
      { key: 'slotCapacity', label: 'Slot capacity', format: 'number', align: 'right' },
      { key: 'remainingCapacity', label: 'Remaining', format: 'number', align: 'right' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Reserved at', format: 'datetime' },
    ],
    rows,
  };
}

async function eventBookingReport(query: ReportQuery): Promise<ReportResult> {
  const range = dateRange(query, 'Event');
  const allowedStatuses = Object.values(BookingStatus) as string[];
  if (query.status && !allowedStatuses.includes(query.status)) throw new ApiError(422, 'Invalid booking status filter.');
  const bookings = await prisma.eventBooking.findMany({
    where: {
      ...(query.status ? { status: query.status as BookingStatus } : {}),
      ...(range.filter ? { event: { is: { eventDate: range.filter } } } : {}),
      ...(query.search ? {
        OR: [
          { bookingNumber: { contains: query.search } },
          { ticketNumber: { contains: query.search } },
          { member: { is: { memberCode: { contains: query.search } } } },
          { member: { is: { fullName: { contains: query.search } } } },
          { event: { is: { title: { contains: query.search } } } },
        ],
      } : {}),
    },
    include: {
      member: { select: { memberCode: true, fullName: true } },
      event: { select: { title: true, category: true, eventDate: true, venue: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const rows = bookings.map((booking) => ({
    bookingNumber: booking.bookingNumber,
    ticketNumber: booking.ticketNumber,
    memberCode: booking.member.memberCode,
    memberName: booking.member.fullName,
    event: booking.event.title,
    category: booking.event.category,
    eventDate: booking.event.eventDate.toISOString(),
    venue: booking.event.venue,
    tickets: booking.ticketQuantity,
    amount: serializeDecimal(booking.amount),
    status: booking.status,
    checkedInAt: booking.checkedInAt?.toISOString() ?? null,
  }));
  const tickets = rows.filter((item) => item.status !== BookingStatus.CANCELLED).reduce((sum, item) => sum + item.tickets, 0);
  const value = rows.filter((item) => item.status !== BookingStatus.CANCELLED).reduce((sum, item) => sum + item.amount, 0);
  const checkedIn = rows.filter((item) => item.checkedInAt).length;

  return {
    ...responseBase('EVENT_BOOKINGS', 'Event Booking Report', 'Ticket sales, revenue, booking status and event participation.', query),
    summary: [
      { label: 'Bookings', value: rows.length, format: 'number' },
      { label: 'Tickets sold', value: tickets, format: 'number' },
      { label: 'Booking value', value, format: 'currency' },
      { label: 'Checked-in bookings', value: checkedIn, format: 'number' },
    ],
    breakdown: Array.from(new Set<string>(rows.map((item) => String(item.event)) as string[])).map((event) => ({
      label: event,
      value: rows.filter((item) => item.event === event && item.status !== BookingStatus.CANCELLED).reduce((sum, item) => sum + item.tickets, 0),
    })),
    columns: [
      { key: 'bookingNumber', label: 'Booking number' },
      { key: 'ticketNumber', label: 'Ticket number' },
      { key: 'memberCode', label: 'Member ID' },
      { key: 'memberName', label: 'Member' },
      { key: 'event', label: 'Event' },
      { key: 'category', label: 'Category' },
      { key: 'eventDate', label: 'Event date', format: 'date' },
      { key: 'venue', label: 'Venue' },
      { key: 'tickets', label: 'Tickets', format: 'number', align: 'right' },
      { key: 'amount', label: 'Amount', format: 'currency', align: 'right' },
      { key: 'status', label: 'Status' },
      { key: 'checkedInAt', label: 'Checked in', format: 'datetime' },
    ],
    rows,
  };
}

async function eventAttendanceReport(query: ReportQuery): Promise<ReportResult> {
  const range = dateRange(query, 'Event attendance');
  if (query.status && !['CHECKED_IN', 'NOT_CHECKED_IN'].includes(query.status)) throw new ApiError(422, 'Invalid attendance status filter.');
  const events = await prisma.event.findMany({
    where: {
      ...(range.filter ? { eventDate: range.filter } : {}),
      status: { in: [EventStatus.PUBLISHED, EventStatus.COMPLETED] },
      ...(query.search ? { OR: [{ title: { contains: query.search } }, { category: { contains: query.search } }, { venue: { contains: query.search } }] } : {}),
    },
    include: {
      bookings: {
        where: { status: { not: BookingStatus.CANCELLED } },
        select: { ticketQuantity: true, checkedInAt: true },
      },
    },
    orderBy: { eventDate: 'desc' },
  });
  let rows = events.map((event) => {
    const bookedTickets = event.bookings.reduce((sum, item) => sum + item.ticketQuantity, 0);
    const checkedInBookings = event.bookings.filter((item) => item.checkedInAt).length;
    const checkedInTickets = event.bookings.filter((item) => item.checkedInAt).reduce((sum, item) => sum + item.ticketQuantity, 0);
    return {
      event: event.title,
      category: event.category,
      eventDate: event.eventDate.toISOString(),
      venue: event.venue,
      capacity: event.totalCapacity,
      bookedTickets,
      availableSeats: event.availableSeats,
      bookingCount: event.bookings.length,
      checkedInBookings,
      checkedInTickets,
      attendanceRate: percentage(checkedInTickets, bookedTickets),
      attendanceStatus: checkedInBookings > 0 ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
    };
  });
  if (query.status) rows = rows.filter((item) => item.attendanceStatus === query.status);
  const bookedTickets = rows.reduce((sum, item) => sum + item.bookedTickets, 0);
  const checkedInTickets = rows.reduce((sum, item) => sum + item.checkedInTickets, 0);

  return {
    ...responseBase('EVENT_ATTENDANCE', 'Event Attendance Report', 'Event capacity, booked tickets, check-ins and attendance rate.', query),
    summary: [
      { label: 'Events', value: rows.length, format: 'number' },
      { label: 'Booked tickets', value: bookedTickets, format: 'number' },
      { label: 'Checked-in tickets', value: checkedInTickets, format: 'number' },
      { label: 'Attendance rate', value: percentage(checkedInTickets, bookedTickets), format: 'percent' },
    ],
    breakdown: rows.map((item) => ({ label: String(item.event), value: Number(item.attendanceRate) })),
    columns: [
      { key: 'event', label: 'Event' },
      { key: 'category', label: 'Category' },
      { key: 'eventDate', label: 'Event date', format: 'date' },
      { key: 'venue', label: 'Venue' },
      { key: 'capacity', label: 'Capacity', format: 'number', align: 'right' },
      { key: 'bookedTickets', label: 'Booked tickets', format: 'number', align: 'right' },
      { key: 'checkedInTickets', label: 'Checked-in tickets', format: 'number', align: 'right' },
      { key: 'attendanceRate', label: 'Attendance', format: 'percent', align: 'right' },
      { key: 'availableSeats', label: 'Available seats', format: 'number', align: 'right' },
    ],
    rows,
  };
}

async function feedbackReport(query: ReportQuery): Promise<ReportResult> {
  const range = dateRange(query, 'Feedback');
  if (query.status && !['1', '2', '3', '4', '5'].includes(query.status)) throw new ApiError(422, 'Invalid rating filter.');
  const feedback = await prisma.feedback.findMany({
    where: {
      ...(range.filter ? { createdAt: range.filter } : {}),
      ...(query.status ? { rating: Number(query.status) } : {}),
      ...(query.search ? {
        OR: [
          { comments: { contains: query.search } },
          { member: { is: { memberCode: { contains: query.search } } } },
          { member: { is: { fullName: { contains: query.search } } } },
        ],
      } : {}),
    },
    include: {
      member: { select: { memberCode: true, fullName: true } },
      restaurantBooking: { select: { bookingNumber: true, restaurant: { select: { name: true } } } },
      roomBooking: { select: { bookingNumber: true, room: { select: { roomName: true } } } },
      eventBooking: { select: { bookingNumber: true, event: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const rows = feedback.map((item) => ({
    memberCode: item.member.memberCode,
    memberName: item.member.fullName,
    serviceType: item.serviceType,
    serviceName: item.restaurantBooking?.restaurant.name ?? item.roomBooking?.room.roomName ?? item.eventBooking?.event.title ?? '—',
    bookingNumber: item.restaurantBooking?.bookingNumber ?? item.roomBooking?.bookingNumber ?? item.eventBooking?.bookingNumber ?? '—',
    rating: item.rating,
    comments: item.comments,
    submittedAt: item.createdAt.toISOString(),
  }));
  const average = rows.length ? rows.reduce((sum, item) => sum + item.rating, 0) / rows.length : 0;
  const positive = rows.filter((item) => item.rating >= 4).length;

  return {
    ...responseBase('FEEDBACK', 'Feedback Report', 'Service ratings, comments, booking references and satisfaction distribution.', query),
    summary: [
      { label: 'Feedback records', value: rows.length, format: 'number' },
      { label: 'Average rating', value: Number(average.toFixed(1)), format: 'number' },
      { label: 'Positive ratings', value: positive, format: 'number' },
      { label: 'Positive rate', value: percentage(positive, rows.length), format: 'percent' },
    ],
    breakdown: [5, 4, 3, 2, 1].map((rating) => ({ label: `${rating} stars`, value: rows.filter((item) => item.rating === rating).length })),
    columns: [
      { key: 'memberCode', label: 'Member ID' },
      { key: 'memberName', label: 'Member' },
      { key: 'serviceType', label: 'Service' },
      { key: 'serviceName', label: 'Service name' },
      { key: 'bookingNumber', label: 'Booking number' },
      { key: 'rating', label: 'Rating', format: 'number', align: 'right' },
      { key: 'comments', label: 'Comments' },
      { key: 'submittedAt', label: 'Submitted', format: 'datetime' },
    ],
    rows,
  };
}

async function rfidReport(query: ReportQuery): Promise<ReportResult> {
  const range = dateRange(query, 'RFID update');
  const allowedStatuses = Object.values(RfidStatus) as string[];
  if (query.status && !allowedStatuses.includes(query.status)) throw new ApiError(422, 'Invalid RFID status filter.');
  const records = await prisma.rfidRecord.findMany({
    where: {
      ...(range.filter ? { updatedAt: range.filter } : {}),
      ...(query.status ? { status: query.status as RfidStatus } : {}),
      ...(query.search ? {
        OR: [
          { referenceNumber: { contains: query.search } },
          { cardNumber: { contains: query.search } },
          { member: { is: { memberCode: { contains: query.search } } } },
          { member: { is: { fullName: { contains: query.search } } } },
        ],
      } : {}),
    },
    include: { member: { select: { memberCode: true, fullName: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  const now = new Date();
  const rows = records.map((record) => ({
    referenceNumber: record.referenceNumber,
    cardNumber: record.cardNumber,
    memberCode: record.member.memberCode,
    memberName: record.member.fullName,
    status: record.status,
    accessAllowed: record.accessAllowed ? 'YES' : 'NO',
    activationDate: record.activationDate?.toISOString() ?? null,
    expiryDate: record.expiryDate.toISOString(),
    expiryState: record.expiryDate < now ? 'EXPIRED' : 'VALID',
    lastVerificationResult: record.lastVerificationResult ?? 'NOT_VERIFIED',
    lastVerificationDate: record.lastVerificationDate?.toISOString() ?? null,
  }));
  const active = rows.filter((item) => item.status === RfidStatus.ACTIVE && item.expiryState === 'VALID').length;
  const blocked = rows.filter((item) => item.status === RfidStatus.BLOCKED).length;
  const invalid = rows.filter((item) => item.lastVerificationResult === 'INVALID').length;

  return {
    ...responseBase('RFID_STATUS', 'RFID Status Report', 'RFID assignment, card state, access, expiry and verification history.', query),
    summary: [
      { label: 'RFID records', value: rows.length, format: 'number' },
      { label: 'Active and valid', value: active, format: 'number' },
      { label: 'Blocked', value: blocked, format: 'number' },
      { label: 'Invalid verifications', value: invalid, format: 'number' },
    ],
    breakdown: allowedStatuses.map((status) => ({ label: status, value: rows.filter((item) => item.status === status).length })),
    columns: [
      { key: 'referenceNumber', label: 'RFID reference' },
      { key: 'cardNumber', label: 'Card number' },
      { key: 'memberCode', label: 'Member ID' },
      { key: 'memberName', label: 'Member' },
      { key: 'status', label: 'Card status' },
      { key: 'accessAllowed', label: 'Access' },
      { key: 'activationDate', label: 'Activated', format: 'date' },
      { key: 'expiryDate', label: 'Expires', format: 'date' },
      { key: 'expiryState', label: 'Expiry state' },
      { key: 'lastVerificationResult', label: 'Last verification' },
      { key: 'lastVerificationDate', label: 'Verified at', format: 'datetime' },
    ],
    rows,
  };
}

export async function getAdminReport(reportType: ReportType, query: ReportQuery): Promise<ReportResult> {
  switch (reportType) {
    case 'MEMBERS': return memberReport(query);
    case 'BOOKINGS': return bookingReport(query);
    case 'PAYMENTS': return paymentReport(query);
    case 'ROOM_AVAILABILITY': return roomAvailabilityReport(query);
    case 'RESTAURANT_BOOKINGS': return restaurantBookingReport(query);
    case 'EVENT_BOOKINGS': return eventBookingReport(query);
    case 'EVENT_ATTENDANCE': return eventAttendanceReport(query);
    case 'FEEDBACK': return feedbackReport(query);
    case 'RFID_STATUS': return rfidReport(query);
    default: throw new ApiError(404, 'Report type not found.');
  }
}
