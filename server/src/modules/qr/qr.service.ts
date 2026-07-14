import { BookingStatus, MembershipStatus, QrStatus, QrType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';

export async function verifyQr(token: string, checkIn: boolean) {
  const qr = await prisma.qrToken.findUnique({
    where: { token },
    include: {
      member: {
        select: {
          id: true,
          memberCode: true,
          fullName: true,
          membership: true,
        },
      },
    },
  });

  if (!qr) {
    return { valid: false, reason: 'QR token was not found.' };
  }

  if (qr.expiresAt && qr.expiresAt.getTime() < Date.now()) {
    if (qr.status !== QrStatus.EXPIRED) {
      await prisma.qrToken.update({ where: { id: qr.id }, data: { status: QrStatus.EXPIRED } });
    }
    return {
      valid: false,
      qrType: qr.type,
      currentStatus: QrStatus.EXPIRED,
      member: qr.member,
      reason: 'QR token has expired.',
    };
  }

  if (qr.type === QrType.MEMBERSHIP) {
    const valid =
      qr.status === QrStatus.ACTIVE &&
      qr.member.membership?.status === MembershipStatus.ACTIVE &&
      (qr.member.membership?.validUntil.getTime() ?? 0) >= Date.now();

    return {
      valid,
      qrType: qr.type,
      currentStatus: qr.status,
      member: qr.member,
      membership: qr.member.membership,
      reason: valid ? 'Membership is valid.' : 'Membership is inactive or expired.',
    };
  }

  if (qr.type === QrType.RESTAURANT_BOOKING) {
    const booking = await prisma.restaurantBooking.findUnique({
      where: { id: qr.referenceId },
      include: { restaurant: true, slot: true },
    });
    const valid =
      Boolean(booking) &&
      qr.status === QrStatus.ACTIVE &&
      booking!.status !== BookingStatus.CANCELLED;

    return {
      valid,
      qrType: qr.type,
      currentStatus: qr.status,
      member: qr.member,
      booking,
      reason: valid ? 'Restaurant booking is valid.' : 'Restaurant booking is invalid or cancelled.',
    };
  }

  const booking = await prisma.eventBooking.findUnique({
    where: { id: qr.referenceId },
    include: { event: true },
  });

  if (!booking) {
    return {
      valid: false,
      qrType: qr.type,
      currentStatus: qr.status,
      member: qr.member,
      reason: 'Event booking was not found.',
    };
  }

  if (qr.status === QrStatus.USED || booking.checkedInAt) {
    return {
      valid: false,
      qrType: qr.type,
      currentStatus: QrStatus.USED,
      member: qr.member,
      booking,
      reason: 'This event ticket has already been checked in.',
    };
  }

  if (qr.status !== QrStatus.ACTIVE || booking.status === BookingStatus.CANCELLED) {
    return {
      valid: false,
      qrType: qr.type,
      currentStatus: qr.status,
      member: qr.member,
      booking,
      reason: 'Event ticket is cancelled, expired or inactive.',
    };
  }

  if (!checkIn) {
    return {
      valid: true,
      qrType: qr.type,
      currentStatus: qr.status,
      member: qr.member,
      booking,
      reason: 'Event ticket is valid and ready for check-in.',
    };
  }

  const checkedInAt = new Date();
  const checkedIn = await prisma.$transaction(async (transaction) => {
    const freshQr = await transaction.qrToken.findUnique({ where: { id: qr.id } });
    const freshBooking = await transaction.eventBooking.findUnique({ where: { id: booking.id } });

    if (!freshQr || !freshBooking || freshQr.status !== QrStatus.ACTIVE || freshBooking.checkedInAt) {
      throw new ApiError(409, 'This event ticket has already been checked in.');
    }

    await transaction.qrToken.update({
      where: { id: qr.id },
      data: { status: QrStatus.USED, usedAt: checkedInAt },
    });
    return transaction.eventBooking.update({
      where: { id: booking.id },
      data: { checkedInAt },
      include: { event: true },
    });
  });

  return {
    valid: true,
    checkedIn: true,
    qrType: qr.type,
    currentStatus: QrStatus.USED,
    member: qr.member,
    booking: checkedIn,
    reason: 'Event ticket checked in successfully.',
  };
}
